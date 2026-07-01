from decimal import Decimal
import logging

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from sslcommerz_python.payment import SSLCSession, Validation

from order.models import Cart, CartItem, OrderItem, Order, Payment

logger = logging.getLogger(__name__)


class OrderService:
    @staticmethod
    def create_order(user_id, cart_id):
        with transaction.atomic():
            cart = Cart.objects.get(pk=cart_id)
            cart_items = cart.items.select_related('product').all()

            total_price = sum([item.product.price *
                               item.quantity for item in cart_items])

            order = Order.objects.create(
                user_id=user_id, total_price=total_price)

            order_items = [
                OrderItem(
                    order=order,
                    product=item.product,
                    price=item.product.price,
                    quantity=item.quantity,
                )
                for item in cart_items
            ]
            # [<OrderItem(1)>, <OrderItem(2)>]
            OrderItem.objects.bulk_create(order_items)

            cart.delete()

            return order

    @staticmethod
    def cancel_order(order, user):
        # Admins may cancel any order
        if user.is_staff:
            order.status = Order.CANCELLED
            order.save()
            return order

        if order.user != user:
            raise PermissionDenied(
                {"detail": "You can only cancel your own order"})

        if order.status == Order.DELIVERED:
            raise ValidationError({"detail": "You can not cancel an order"})

        order.status = Order.CANCELLED
        order.save()
        return order


class PaymentService:
    """Encapsulates SSLCommerz session init, IPN validation and lifecycle updates."""

    @staticmethod
    def _build_backend_urls(request):
        backend_base = request.build_absolute_uri('/api/payment/').rstrip('/')
        return {
            'success': f"{backend_base}/success/",
            'fail': f"{backend_base}/fail/",
            'cancel': f"{backend_base}/cancel/",
            'ipn': f"{backend_base}/ipn/",
        }

    @staticmethod
    def _build_session(sandbox=None):
        cfg = settings.SSLCOMMERZ
        if sandbox is None:
            sandbox = cfg.get('IS_SANDBOX', True)
        return SSLCSession(
            sslc_is_sandbox=sandbox,
            sslc_store_id=cfg['STORE_ID'],
            sslc_store_pass=cfg['STORE_PASSWD'],
        )

    @classmethod
    def initiate_payment(cls, order, request):
        if order.user != request.user and not request.user.is_staff:
            raise PermissionDenied(
                {"detail": "You can only pay for your own orders."})

        if order.status == Order.CANCELLED:
            raise ValidationError(
                {"detail": "This order is cancelled and cannot be paid."})

        if order.status == Order.DELIVERED:
            raise ValidationError(
                {"detail": "This order is already delivered."})

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                'amount': order.total_price,
                'currency': settings.SSLCOMMERZ.get('CURRENCY', 'BDT'),
                'status': Payment.PENDING,
            },
        )

        if payment.status in [Payment.SUCCESS, Payment.VALIDATED]:
            raise ValidationError(
                {"detail": "This order has already been paid."})

        payment.amount = order.total_price
        payment.currency = settings.SSLCOMMERZ.get('CURRENCY', 'BDT')
        payment.status = Payment.PENDING
        payment.save(update_fields=['amount', 'currency', 'status', 'updated_at'])

        cart_items = order.items.select_related('product').all()
        total_items = sum(item.quantity for item in cart_items)
        product_names = ', '.join(
            {item.product.name for item in cart_items}) or 'DeshiCart Order'
        primary_product = cart_items.first().product if cart_items.exists() else None
        product_category = (
            primary_product.category.name if primary_product and primary_product.category else 'general')

        urls = cls._build_backend_urls(request)
        session = cls._build_session()
        session.set_urls(
            success_url=urls['success'],
            fail_url=urls['fail'],
            cancel_url=urls['cancel'],
            ipn_url=urls['ipn'],
        )
        session.set_product_integration(
            total_amount=Decimal(str(order.total_price)),
            currency=settings.SSLCOMMERZ.get('CURRENCY', 'BDT'),
            product_category=product_category,
            product_name=product_names,
            num_of_item=total_items or 1,
            shipping_method='NO',
            product_profile='general',
        )

        profile = getattr(request.user, 'profile', None) or request.user
        full_name = (f"{profile.first_name} {profile.last_name}".strip()
                     or profile.username or 'Customer')
        address = ''
        city = 'Dhaka'
        postcode = '1000'
        country = 'Bangladesh'
        phone = getattr(profile, 'phone_number', '') or '01700000000'

        session.set_customer_info(
            name=full_name,
            email=profile.email,
            address1=address,
            city=city,
            postcode=postcode,
            country=country,
            phone=phone,
        )
        session.set_shipping_info(
            shipping_to=full_name,
            address=address,
            city=city,
            postcode=postcode,
            country=country,
        )
        session.set_additional_values(
            value_a=str(order.id),
            value_b=str(payment.id),
        )

        response = session.init_payment()

        if response.get('status') != 'SUCCESS' or not response.get('GatewayPageURL'):
            payment.status = Payment.FAILED
            payment.gateway_response = response
            payment.save(update_fields=['status', 'gateway_response', 'updated_at'])
            logger.error("SSLCommerz init_payment failed: %s", response)
            raise ValidationError({
                'detail': 'Payment gateway initialization failed.',
                'gateway_response': response,
            })

        payment.transaction_id = session.integration_data.get('tran_id')
        payment.gateway_response = {
            'sessionkey': response.get('sessionkey'),
            'GatewayPageURL': response.get('GatewayPageURL'),
        }
        payment.save(update_fields=[
            'transaction_id', 'gateway_response', 'updated_at'
        ])

        return {
            'payment_id': payment.id,
            'gateway_url': response['GatewayPageURL'],
            'transaction_id': payment.transaction_id,
            'amount': str(payment.amount),
            'currency': payment.currency,
        }

    @staticmethod
    def mark_success(transaction_id, payload):
        payment = Payment.objects.filter(transaction_id=transaction_id).first()
        if not payment:
            logger.warning("mark_success: unknown transaction_id %s", transaction_id)
            return None
        if payment.status in [Payment.SUCCESS, Payment.VALIDATED]:
            return payment
        payment.status = Payment.SUCCESS
        gateway = payment.gateway_response or {}
        gateway.update(payload or {})
        payment.gateway_response = gateway
        payment.save(update_fields=['status', 'gateway_response', 'updated_at'])
        return payment

    @staticmethod
    def mark_validated(payment):
        payment.status = Payment.VALIDATED
        payment.order.status = Order.READY_TO_SHIP
        payment.order.save(update_fields=['status', 'updated_at'])
        payment.save(update_fields=['status', 'updated_at'])
        return payment

    @staticmethod
    def mark_failed(transaction_id, payload):
        payment = Payment.objects.filter(transaction_id=transaction_id).first()
        if not payment:
            return None
        payment.status = Payment.FAILED
        gateway = payment.gateway_response or {}
        gateway.update(payload or {})
        payment.gateway_response = gateway
        payment.save(update_fields=['status', 'gateway_response', 'updated_at'])
        return payment

    @staticmethod
    def mark_cancelled(transaction_id, payload):
        payment = Payment.objects.filter(transaction_id=transaction_id).first()
        if not payment:
            return None
        payment.status = Payment.CANCELLED
        gateway = payment.gateway_response or {}
        gateway.update(payload or {})
        payment.gateway_response = gateway
        payment.save(update_fields=['status', 'gateway_response', 'updated_at'])
        return payment

    @classmethod
    def validate_ipn(cls, payload):
        """Verify IPN signature and promote Payment -> VALIDATED if genuine."""
        validator = cls._build_session()
        try:
            signature_ok = validator.validate_ipn_hash(payload)
        except Exception as exc:  # pragma: no cover
            logger.exception("IPN signature verification raised: %s", exc)
            signature_ok = False

        if not signature_ok:
            logger.warning("IPN signature mismatch for payload: %s", payload)
            return False

        tran_id = payload.get('tran_id')
        val_id = payload.get('val_id')
        if not tran_id or not val_id:
            logger.warning("IPN missing tran_id/val_id: %s", payload)
            return False

        payment = Payment.objects.filter(transaction_id=tran_id).first()
        if not payment:
            logger.warning("IPN for unknown tran_id: %s", tran_id)
            return False

        payment.bank_tran_id = payload.get('bank_tran_id', '')
        payment.card_type = payload.get('card_type', '')
        payment.gateway_response = payload
        payment.save(update_fields=[
            'bank_tran_id', 'card_type', 'gateway_response', 'updated_at'
        ])

        verifier = cls._build_session()
        verification = verifier.validate_transaction(val_id)
        if verification.get('status') == 'VALIDATED':
            payment.status = Payment.VALIDATED
            payment.save(update_fields=['status', 'updated_at'])
            payment.order.status = Order.READY_TO_SHIP
            payment.order.save(update_fields=['status', 'updated_at'])
            return True

        logger.warning("IPN validation failed: %s", verification)
        payment.status = Payment.FAILED
        payment.save(update_fields=['status', 'updated_at'])
        return False


"""
Transaction
A       B
100
0
        400
"""
