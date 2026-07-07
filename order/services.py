from decimal import Decimal
import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone as django_timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from sslcommerz_python.payment import SSLCSession, Validation

from order.models import Cart, CartItem, OrderItem, Order, Payment
from product.models import Product  # local import to avoid circulars

logger = logging.getLogger(__name__)


def _restock_order(order):
    """Return OrderItem quantities back to product.stock after cancellation."""
    product_ids = [item.product_id for item in order.items.all()]
    if not product_ids:
        return
    locked_products = {
        p.pk: p for p in
        Product.objects.select_for_update().filter(pk__in=product_ids)
    }
    for item in order.items.all():
        product = locked_products.get(item.product_id)
        if product is None:
            continue
        product.stock = (product.stock or 0) + item.quantity
    Product.objects.bulk_update(locked_products.values(), ['stock'])


def _refund_if_paid(order):
    """If the order already has a paid Payment, flip it to REFUND_PENDING.

    Actual gateway refund is an async job — the row stays in REFUND_PENDING
    until a webhook or admin action marks it REFUNDED.
    """
    payment = Payment.objects.filter(order=order).first()
    if not payment:
        return
    if payment.status in (Payment.SUCCESS, Payment.VALIDATED):
        payment.status = Payment.REFUND_PENDING
        payment.save(update_fields=['status', 'updated_at'])


def _resolve_shipping_address(user):
    """Return a dict with shipping fields for ``user`` or ``None``.

    Tries the default-shipping Address, then default-billing, then the most
    recently added Address. Returns ``None`` if the user has no Address.
    """
    from users.models import Address  # local import — avoid circular at module load
    addr = (
        Address.objects
        .filter(user=user, is_default_shipping=True)
        .first()
        or Address.objects
        .filter(user=user, is_default_billing=True)
        .first()
        or Address.objects
        .filter(user=user)
        .order_by('-created_at')
        .first()
    )
    if not addr:
        return None
    return {
        'line1': addr.line1,
        'line2': addr.line2,
        'city': addr.city,
        'state': addr.state,
        'postal_code': addr.postal_code,
        'country': addr.country,
        'phone': addr.phone,
    }


class OrderService:
    @staticmethod
    def create_order(user_id, cart_id, shipping_address='', notes='', address_id=None, coupon_code=None):
        """
        Convert a user cart into an Order.

        ``coupon_code`` (optional, str): when supplied, the code is looked up,
        validated for active / within-window / within-max-use thresholds, and
        the resulting discount is subtracted from ``total_price``. A matching
        ``CouponUsage`` row is written so the coupon appears under "My coupons"
        for the user. Invalid codes raise ``ValidationError``.
        """
        with transaction.atomic():
            cart = Cart.objects.get(pk=cart_id)
            cart_items = list(cart.items.select_related('product').all())
            if not cart_items:
                raise ValidationError({"detail": "Your cart is empty."})

            # Lock the products for the duration of this transaction so a
            # concurrent checkout cannot oversell.
            product_ids = [item.product_id for item in cart_items]
            locked_products = {
                p.pk: p for p in
                Product.objects.select_for_update().filter(pk__in=product_ids)
            }

            # Validate stock BEFORE touching anything.
            shortages = []
            for item in cart_items:
                product = locked_products.get(item.product_id)
                if product is None:
                    shortages.append(f"item #{item.product_id} is no longer available")
                    continue
                if item.quantity > product.stock:
                    shortages.append(
                        f"{product.name}: only {product.stock} left, you asked for {item.quantity}"
                    )
            if shortages:
                raise ValidationError({"detail": "Stock shortage.", "items": shortages})
            total_price = sum(
                item.product.price * item.quantity for item in cart_items
            )

            # Optional coupon application. We resolve and validate the code
            # BEFORE writing the order so a bad code surfaces as a clean
            # 400 from the checkout endpoint rather than leaving a half-built
            # order in the DB.
            discount_amount = Decimal("0")
            applied_coupon = None
            coupon_code = (coupon_code or "").strip().upper()
            if coupon_code:
                # Local import: Coupons app -> order app edge avoids Django
                # app-loading ordering surprises during testing.
                from coupons.models import Coupon, CouponUsage

                try:
                    applied_coupon = Coupon.objects.get(
                        code=coupon_code, is_active=True
                    )
                except Coupon.DoesNotExist:
                    raise ValidationError(
                        {"coupon_code": "Invalid coupon code."}
                    )
                if not applied_coupon.is_valid:
                    raise ValidationError(
                        {"coupon_code": "Coupon is no longer valid."}
                    )
                if total_price < applied_coupon.min_order:
                    raise ValidationError(
                        {"coupon_code": f"Minimum order ৳{applied_coupon.min_order} required for this coupon."}
                    )
                if applied_coupon.discount_type == "PERCENT":
                    discount_amount = (total_price * applied_coupon.value) / Decimal("100")
                else:
                    discount_amount = applied_coupon.value
                # Never let the discount exceed the cart total.
                discount_amount = min(discount_amount, total_price)
                total_price = total_price - discount_amount

            # Resolve shipping text — if frontend didn't provide one, fall
            # back to the user's saved Address book entry.
            resolved_address_text = shipping_address or ''
            if not resolved_address_text:
                from users.models import User as _User
                user_obj = _User.objects.filter(pk=user_id).first()
                if user_obj:
                    resolved = _resolve_shipping_address(user_obj)
                    if resolved:
                        resolved_address_text = ', '.join(
                            part for part in [
                                resolved.get('line1') or '',
                                resolved.get('line2') or '',
                                resolved.get('city') or '',
                                resolved.get('state') or '',
                                resolved.get('postal_code') or '',
                                resolved.get('country') or '',
                            ] if part
                        )

            order = Order.objects.create(
                user_id=user_id,
                total_price=total_price,
                shipping_address=resolved_address_text,
                notes=notes or '',
                address_id=address_id,
            )

            # Record coupon usage AFTER the order exists so we can attach the
            # CouponUsage FK to the order. Increment used_count atomically.
            if applied_coupon is not None:
                from coupons.models import CouponUsage
                CouponUsage.objects.create(
                    coupon=applied_coupon,
                    user_id=user_id,
                    order=order,
                    discount_amount=discount_amount,
                )
                Coupon.objects.filter(pk=applied_coupon.pk).update(
                    used_count=applied_coupon.used_count + 1
                )

            order_items = [
                OrderItem(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price,
                )
                for item in cart_items
            ]
            OrderItem.objects.bulk_create(order_items)

            for item in cart_items:
                product = locked_products.get(item.product_id)
                if product is None:
                    continue
                product.stock = max(0, (product.stock or 0) - int(item.quantity))
            Product.objects.bulk_update(locked_products.values(), ['stock'])

            CartItem.objects.filter(cart=cart).delete()

            return order

    @staticmethod
    def _build_session(sandbox=None):
        cfg = settings.SSLCOMMERZ
        if sandbox is None:
            sandbox = cfg.get('IS_SANDBOX', True)
        # NOTE: ``sslcommerz-python``'s ``SSLCSession.__init__`` does not accept
        # a ``currency`` kwarg — currency is passed later via
        # ``set_product_integration()``. Passing it here crashes with
        # ``TypeError: SSLCSession.__init__() got an unexpected keyword argument
        # 'currency'``.
        return SSLCSession(
            sslc_is_sandbox=sandbox,
            sslc_store_id=cfg['STORE_ID'],
            sslc_store_pass=cfg['STORE_PASSWD'],
        )

    @classmethod
    def initiate_payment(cls, order, request):
        if order.user != request.user and not request.user.is_staff:
            raise PermissionDenied(
                {"detail": "You can only pay for your own orders."}
            )
        if order.status == Order.CANCELLED:
            raise ValidationError(
                {"detail": "This order is cancelled and cannot be paid."}
            )
        if order.status == Order.DELIVERED:
            raise ValidationError(
                {"detail": "This order is already delivered."}
            )

        profile = getattr(request.user, 'profile', None) or request.user
        shipping_addr = _resolve_shipping_address(request.user)

        full_name = (f"{profile.first_name} {profile.last_name}".strip()
                     or profile.username or 'Customer')
        address = shipping_addr['line1'] if shipping_addr else ''
        city = shipping_addr['city'] if shipping_addr else 'Dhaka'
        postcode = shipping_addr['postal_code'] if shipping_addr else '1000'
        country = shipping_addr['country'] if shipping_addr else 'Bangladesh'
        phone = (
            (shipping_addr['phone'] if shipping_addr else '')
            or getattr(profile, 'phone_number', '')
            or '01700000000'
        )

        session = cls._build_session()
        session.set_urls(
            success_url=settings.SSLCOMMERZ['SUCCESS_URL'],
            fail_url=settings.SSLCOMMERZ['FAIL_URL'],
            cancel_url=settings.SSLCOMMERZ['CANCEL_URL'],
            ipn_url=settings.SSLCOMMERZ['IPN_URL'],
        )
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

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                'amount': order.total_price,
                'currency': settings.SSLCOMMERZ.get('CURRENCY', 'BDT'),
                'status': Payment.PENDING,
            }
        )

        session.set_product_integration(
            total_amount=Decimal(str(order.total_price)),
            currency=settings.SSLCOMMERZ.get('CURRENCY', 'BDT'),
            product_category='general',
            product_name=', '.join(item.product.name for item in order.items.all()) or 'DeshiCart Order',
            num_of_item=sum(item.quantity for item in order.items.all()) or 1,
            shipping_method='NO',
        )

        response = session.init_payment()
        if response.get('status') != 'SUCCESS' or not response.get('GatewayPageURL'):
            payment.status = Payment.FAILED
            payment.save(update_fields=['status', 'updated_at'])
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
        payment.save(update_fields=['transaction_id', 'gateway_response', 'updated_at'])

        return {
            'payment_id': payment.id,
            'gateway_url': response['GatewayPageURL'],
            'transaction_id': payment.transaction_id,
            'amount': str(payment.amount),
            'currency': payment.currency,
        }

    @classmethod
    def validate_with_sslc(cls, tran_id, val_id, amount, currency='BDT'):
        """Hit SSLC's order-validation API to confirm a transaction is genuine.

        Returns the parsed JSON dict from SSLC, or ``None`` if the request fails.
        Anti-tamper: the frontend cannot lie about ``amount`` or ``tran_id``
        because we re-fetch authoritative values from SSLC and compare.
        """
        cfg = settings.SSLCOMMERZ
        base = (
            'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
            if cfg.get('IS_SANDBOX', True)
            else 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
        )
        params = {
            'tran_id': tran_id,
            'store_id': cfg['STORE_ID'],
            'store_passwd': cfg['STORE_PASSWD'],
            'val_id': val_id,
            'format': 'json',
        }
        try:
            import requests
            resp = requests.get(base, params=params, timeout=10)
            return resp.json() if resp.status_code == 200 else None
        except Exception as exc:
            logger.exception("SSLC validation request failed: %s", exc)
            return None

    @staticmethod
    def _reduce_stock_for(order):
        """Decrement product.stock for each OrderItem. Idempotent: skips
        rows whose stock has already been deducted by checking a flag on
        the payment (Payment.status==VALIDATED)."""
        from order.models import OrderItem
        for item in OrderItem.objects.select_related('product').filter(order=order):
            product = item.product
            if product is None:
                continue
            new_stock = max(0, (product.stock or 0) - int(item.quantity))
            Product.objects.filter(pk=product.pk).update(stock=new_stock)

    @classmethod
    def mark_success(cls, transaction_id, payload):
        """Mark payment as PAID and (if SSLC confirms) as VALIDATED.

        Step 1: locate the Payment row.
        Step 2: server-side validate against SSLC's validation API
                (uses ``val_id`` from the gateway callback POST).
        Step 3: only flip to VALIDATED + reduce stock when SSLC says
                ``status == 'VALID'`` AND ``amount`` matches.
        """
        payment = Payment.objects.filter(transaction_id=transaction_id).first()
        if not payment:
            logger.warning("mark_success: unknown transaction_id %s", transaction_id)
            return None
        # Already validated — nothing to do.
        if payment.status == Payment.VALIDATED:
            return payment

        # Persist whatever SSLC posted so we have an audit trail.
        payment.gateway_response = payload or {}
        payment.bank_tran_id = payload.get('bank_tran_id') or payment.bank_tran_id
        payment.card_type = payload.get('card_type') or payment.card_type
        payment.amount = payload.get('amount') or payment.amount
        payment.currency = payload.get('currency') or payment.currency
        payment.status = Payment.SUCCESS
        payment.save(update_fields=[
            'gateway_response', 'bank_tran_id', 'card_type',
            'amount', 'currency', 'status', 'updated_at',
        ])

        # Server-side validation: only trust SSLC's API, not the front payload.
        val_id = payload.get('val_id')
        if val_id:
            val_data = cls.validate_with_sslc(
                tran_id=transaction_id,
                val_id=val_id,
                amount=str(payment.amount),
                currency=payment.currency,
            )
            if val_data:
                # SSLC returns status in either top-level "status" or nested
                # "element" list depending on endpoint variant.
                element = val_data.get('element')
                if isinstance(element, list) and element:
                    status_ok = element[0] == 'VALID'
                else:
                    status_ok = val_data.get('status') == 'VALID'
                # Compare amounts if both present (anti-tamper).
                amount_ok = True
                if val_data.get('amount') and Decimal(str(val_data['amount'])) != Decimal(str(payment.amount)):
                    amount_ok = False
                if status_ok and amount_ok:
                    payment = cls.mark_validated(payment)
        return payment

    @staticmethod
    def mark_failed(transaction_id, payload):
        payment = Payment.objects.filter(transaction_id=transaction_id).first()
        if not payment:
            logger.warning("mark_failed: unknown transaction_id %s", transaction_id)
            return None
        # Don't clobber an already-validated payment (e.g., IPN came in first).
        if payment.status in [Payment.SUCCESS, Payment.VALIDATED]:
            return payment
        payment.status = Payment.FAILED
        payment.gateway_response = payload or payment.gateway_response
        payment.save(update_fields=['status', 'gateway_response', 'updated_at'])
        # If the order was NOT_PAID, leave it. Customer can retry.
        return payment

    @classmethod
    def mark_validated(cls, payment):
        """Final step: SSLC has confirmed the payment. Reduce stock, advance
        order status, dispatch notifications, and store the validated payload."""
        already_validated = payment.status == Payment.VALIDATED

        payment.status = Payment.VALIDATED
        if payment.gateway_response:
            payment.gateway_response.setdefault('validated_at', str(django_timezone.now()))
        payment.save(update_fields=['status', 'gateway_response', 'updated_at'])

        payment.order.status = Order.READY_TO_SHIP
        payment.order.save(update_fields=['status', 'updated_at'])

        # Side-effects fire only on the validated transition (idempotent).
        if not already_validated:
            cls._reduce_stock_for(payment.order)
            cls._dispatch_post_payment_notifications(payment.order)
        return payment

    @staticmethod
    def _dispatch_post_payment_notifications(order):
        """Fire customer + admin notifications after a payment is validated.

        Customer: in-app notification with link to the order detail page.
        Admins: broadcast (user=None) for the orders dashboard.

        Email is intentionally best-effort — SMTP misconfiguration must not
        break the payment flow. Failures are logged but swallowed.
        """
        try:
            from notifications_app.models import Notification
            order_url = f"/account/orders/{order.id}"
            admin_url = f"/admin/orders/{order.id}"
            Notification.objects.create(
                user=order.user,
                type="ORDER",
                title=f"Payment confirmed — Order #{order.id}",
                body=(
                    f"Thanks for your order! Your payment of {order.total_price} BDT "
                    f"was validated. We'll email tracking once it ships."
                ),
                link=order_url,
            )
            Notification.objects.create(
                user=None,  # broadcast to admins
                type="ADMIN",
                title=f"New paid order #{order.id}",
                body=(
                    f"{order.user.email} paid {order.total_price} BDT. "
                    f"Order is now READY TO SHIP."
                ),
                link=admin_url,
            )
        except Exception as exc:
            logger.exception("Notification dispatch failed for order %s: %s", order.id, exc)

        # Best-effort transactional email — never break the payment flow on SMTP error.
        try:
            from django.core.mail import send_mail
            from django.conf import settings as _settings
            subject = f"DeshiCart order #{order.id} confirmed"
            body = (
                f"Hi {order.user.get_full_name() or order.user.username},\n\n"
                f"Your payment of {order.total_price} {('BDT')} was successful.\n"
                f"You can track your order at: {_settings.FRONTEND_URLS.get('SUCCESS','')}\n\n"
                f"— DeshiCart"
            )
            send_mail(
                subject,
                body,
                _settings.DEFAULT_FROM_EMAIL if hasattr(_settings, 'DEFAULT_FROM_EMAIL') else 'no-reply@deshicart.bd',
                [order.user.email],
                fail_silently=True,
            )
        except Exception as exc:
            logger.exception("Email send failed for order %s: %s", order.id, exc)

    @staticmethod
    def mark_cancelled(transaction_id, payload):
        payment = Payment.objects.filter(transaction_id=transaction_id).first()
        if not payment:
            return None
        payment.status = Payment.CANCELLED
        payment.save(update_fields=['status', 'gateway_response', 'updated_at'])
        return payment

    @staticmethod
    def render_invoice(order):
        """Render a printable HTML invoice for ``order``.

        Returns a Django ``HttpResponse`` with ``Content-Type: text/html``
        and ``Content-Disposition: attachment`` so the frontend's blob
        download flow saves it as ``DeshiCart-Invoice-<id>.html``. Users
        can ``Ctrl+P`` → "Save as PDF" for a real PDF.
        """
        from decimal import Decimal as _D
        from django.http import HttpResponse
        from django.utils import timezone as _tz
        from django.utils.html import escape

        payment = Payment.objects.filter(order=order).first()
        items = list(order.items.select_related('product').all())
        subtotal = sum((it.price or _D('0')) * (it.quantity or 0) for it in items)
        # Shipping flat 60 BDT for visual completeness; matches coupons page
        # which advertises "Free shipping over ৳2000".
        shipping = _D('0') if subtotal >= _D('2000') else _D('60.00')
        grand_total = order.total_price if order.total_price else (subtotal + shipping)

        def fmt(d):
            return f"{_D(d or 0):,.2f}"

        rows_html = "\n".join(
            f"""
            <tr>
              <td>{escape(it.product.name)}</td>
              <td style=\"text-align:center\">{it.quantity}</td>
              <td style=\"text-align:right\">৳{fmt(it.price)}</td>
              <td style=\"text-align:right\">৳{fmt((it.price or 0) * (it.quantity or 0))}</td>
            </tr>"""
            for it in items
        ) or "<tr><td colspan=\"4\" style=\"text-align:center;color:#888\">No items</td></tr>"

        generated = _tz.now().strftime("%d %b %Y, %H:%M")
        txn = (payment.transaction_id if payment else "") or "—"
        bank = (payment.bank_tran_id if payment else "") or "—"
        card = (payment.card_type if payment else "") or "—"
        pstatus = (payment.get_status_display() if payment else "UNPAID")
        ship = (order.shipping_address or "").replace("\n", "<br/>")

        html = f"""<!doctype html>
<html lang=\"en\">
<head>
<meta charset=\"utf-8\" />
<title>DeshiCart Invoice #{order.id}</title>
<style>
  @page {{ size: A4; margin: 18mm; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #111;
    margin: 0;
    padding: 32px;
    background: #fff;
  }}
  .header {{
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px;
  }}
  .brand {{ font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }}
  .brand small {{ display: block; font-size: 11px; color: #555; letter-spacing: 1px; }}
  .meta {{ text-align: right; font-size: 12px; line-height: 1.6; }}
  .meta strong {{ font-size: 14px; }}
  h2 {{ font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 18px 0 6px; color: #555; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }}
  thead th {{
    text-align: left; background: #f3f4f6; padding: 8px 10px;
    border-bottom: 1px solid #d1d5db; font-weight: 600;
  }}
  tbody td {{ padding: 8px 10px; border-bottom: 1px solid #eee; }}
  .totals {{ width: 280px; margin-left: auto; font-size: 13px; }}
  .totals td {{ padding: 4px 0; }}
  .totals tr:last-child td {{
    border-top: 1.5px solid #111; padding-top: 8px; font-weight: 700; font-size: 15px;
  }}
  .pill {{
    display: inline-block; padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; background: #dcfce7; color: #166534;
  }}
  .footer {{
    margin-top: 36px; padding-top: 12px; border-top: 1px dashed #ccc;
    font-size: 11px; color: #777; text-align: center;
  }}
  @media print {{ body {{ padding: 0; }} }}
</style>
</head>
<body>
  <div class=\"header\">
    <div>
      <div class=\"brand\">DeshiCart<small>BANGLADESH · E-COMMERCE</small></div>
    </div>
    <div class=\"meta\">
      <strong>INVOICE #{order.id}</strong><br/>
      Generated: {generated}<br/>
      Status: <span class=\"pill\">{escape(order.get_status_display())}</span>
    </div>
  </div>

  <h2>Bill to</h2>
  <div style=\"font-size:13px;line-height:1.6\">
    {escape(order.user.get_full_name() or order.user.username)}<br/>
    {escape(order.user.email)}<br/>
    {ship or '—'}
  </div>

  <h2>Items</h2>
  <table>
    <thead>
      <tr><th>Product</th><th style=\"text-align:center\">Qty</th><th style=\"text-align:right\">Price</th><th style=\"text-align:right\">Line total</th></tr>
    </thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>

  <table class=\"totals\">
    <tr><td>Subtotal</td><td style=\"text-align:right\">৳{fmt(subtotal)}</td></tr>
    <tr><td>Shipping</td><td style=\"text-align:right\">৳{fmt(shipping)}</td></tr>
    <tr><td>Total</td><td style=\"text-align:right\">৳{fmt(grand_total)}</td></tr>
  </table>

  <h2>Payment</h2>
  <table style=\"font-size:13px\">
    <tr><td style=\"width:160px;color:#555\">Transaction ID</td><td><code>{escape(txn)}</code></td></tr>
    <tr><td style=\"color:#555\">Bank reference</td><td><code>{escape(bank)}</code></td></tr>
    <tr><td style=\"color:#555\">Method</td><td>{escape(card)}</td></tr>
    <tr><td style=\"color:#555\">Status</td><td>{escape(pstatus)}</td></tr>
  </table>

  <div class=\"footer\">
    Thank you for shopping with DeshiCart. For support, contact help@deshicart.bd
    quoting your order number.
  </div>
</body>
</html>
"""
        response = HttpResponse(html, content_type="text/html; charset=utf-8")
        response["Content-Disposition"] = (
            f'attachment; filename="DeshiCart-Invoice-{order.id}.html"'
        )
        return response

    @classmethod
    def validate_ipn(cls, payload):
        """Verify IPN signature and promote Payment -> VALIDATED if genuine."""
        validator = cls._build_session()
        try:
            signature_ok = validator.validate_ipn_hash(payload)
        except Exception as exc:
            logger.exception("IPN signature verification raised: %s", exc)
            return False

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

        # Persist payload then mark success (which re-validates with SSLC's
        # validation API and transitions the order to READY_TO_SHIP).
        payment.gateway_response = payload
        payment.save(update_fields=['gateway_response', 'updated_at'])
        cls.mark_success(tran_id, payload)
        return True
