from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status as drf_status
from rest_framework.exceptions import PermissionDenied
from rest_framework.mixins import (
    CreateModelMixin,
    RetrieveModelMixin,
    DestroyModelMixin,
    ListModelMixin,
)
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action

from api.permissions import IsAdmin, IsNotStaff
from order import serializers as orderSz
from order.models import Cart, CartItem, Order, OrderItem, Payment
from order.serializers import (
    CartSerializer,
    CartItemSerializer,
    AddCartItemSerializer,
    UpdateCartItemSerializer,
    InitiatePaymentSerializer,
    PaymentSerializer,
)
from order.services import OrderService
from django.http import HttpResponseRedirect


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
class CartViewSet(ListModelMixin, CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet):
    """Per-user cart. POST is idempotent: returns the existing cart if one exists."""

    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Cart.objects.prefetch_related("items__product")
            .filter(user=self.request.user)
        )

    def create(self, request, *args, **kwargs):
        """Idempotent cart creation — never raise IntegrityError on duplicates."""
        cart, _created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=drf_status.HTTP_200_OK if not _created else drf_status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        # get_or_create above already handles this; keep the hook for symmetry.
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """A user has at most one cart — return it (or [])."""
        cart = Cart.objects.filter(user=request.user).first()
        if cart is None:
            return Response([])
        serializer = self.get_serializer(cart)
        return Response([serializer.data])


class CartItemViewSet(ModelViewSet):
    """CRUD against items inside a cart owned by ``request.user``."""

    http_method_names = ["get", "post", "patch", "delete"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AddCartItemSerializer
        if self.request.method == "PATCH":
            return UpdateCartItemSerializer
        return CartItemSerializer

    def get_serializer_context(self):
        return {"cart_id": self.kwargs["cart_pk"], "request": self.request}

    def get_queryset(self):
        # Scope to the caller's own cart — never let one user touch another's cart.
        return CartItem.objects.select_related("product").filter(
            cart_id=self.kwargs["cart_pk"],
            cart__user=self.request.user,
        )


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
class OrderViewSet(ModelViewSet):
    http_method_names = ["get", "post", "delete", "patch", "head", "options"]

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        OrderService.cancel_order(order=order, user=request.user)
        return Response({"status": "Order canceled"})

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = orderSz.UpdateOrderSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": f"Order status updated to {request.data['status']}"})

    def get_permissions(self):
        if self.action in ["update_status", "destroy", "update", "partial_update"]:
            # Only role-based admin may mutate others' orders.
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "cancel":
            return orderSz.EmptySerializer
        if self.action == "create":
            return orderSz.CreateOrderSerializer
        if self.action in ["update_status", "update", "partial_update"]:
            return orderSz.UpdateOrderSerializer
        return orderSz.OrderSerializer

    def get_serializer_context(self):
        return {"user_id": self.request.user.id, "user": self.request.user}

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.prefetch_related("items__product").all()
        return Order.objects.prefetch_related("items__product").filter(user=self.request.user)


class OrderItemViewSet(ModelViewSet):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    serializer_class = orderSz.OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return OrderItem.objects.select_related("product", "order").all()
        return OrderItem.objects.select_related("product", "order").filter(order__user=self.request.user)


# ---------------------------------------------------------------------------
# Payments (SSLCommerz)
# ---------------------------------------------------------------------------
class PaymentViewSet(GenericViewSet):
    """SSLCommerz payment gateway endpoints."""

    serializer_class = InitiatePaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """SSLC gateway callbacks MUST be reachable without authentication.

        Only ``checkout`` requires a logged-in customer. The rest
        (``success``, ``fail``, ``cancel``, ``ipn``, ``status``) are
        hit directly by the SSLC sandbox/live gateway and must answer
        publicly.
        """
        if self.action in {"success", "fail", "cancel", "ipn", "status"}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.select_related("order").all()
        return Payment.objects.select_related("order").filter(order__user=self.request.user)

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        """Initiate an SSLCommerz session for an order owned by ``request.user``.

        Accepts two payload shapes:
        * ``{"order_id": <int>}`` — pay for an existing order.
        * ``{"cart_id"?, "address_id"?, "shipping_address"?, "notes"?}`` —
          convert the user's cart into a fresh order, then pay.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Branch A: existing order. Fetch and ownership-check, then initiate.
        # Branch B: no order yet — convert cart to order first.
        if data.get("order_id"):
            order = get_object_or_404(
                Order.objects.select_related("user"),
                pk=data["order_id"],
            )
            if order.user_id != request.user.id and not request.user.is_staff:
                raise PermissionDenied(
                    {"detail": "You can only pay for your own orders."}
                )
        else:
            try:
                order = OrderService.create_order(
                    user_id=request.user.id,
                    cart_id=data["cart_id"],
                    shipping_address=data.get("shipping_address") or "",
                    notes=data.get("notes") or "",
                    address_id=data.get("address_id"),
                )
            except PermissionDenied:
                raise
            except Exception as exc:
                # Surface the validation/empty-cart/etc. error message verbatim
                # so the frontend can render a useful toast.
                detail = getattr(exc, "detail", None) or str(exc) or "Failed to create order from cart."
                return Response(
                    {"detail": detail},
                    status=drf_status.HTTP_400_BAD_REQUEST,
                )

        try:
            result = OrderService.initiate_payment(order=order, request=request)
        except PermissionDenied:
            raise
        except Exception as exc:  # surface a sane 400 instead of a 500
            return Response(
                {"detail": str(exc) or "Payment gateway initialization failed."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        # Stitch the order id into the payload so the frontend's
        # `response.id` / `response.order_id` reads work in both branches.
        result.setdefault("order_id", order.id)
        result.setdefault("id", order.id)
        result.setdefault("status", "PENDING")
        return Response(result)

    @action(detail=False, methods=["post", "get"], permission_classes=[AllowAny])
    def success(self, request):
        """SSLC browser callback. PUBLIC — no JWT. Always redirects to the
        frontend success page so the user never sees a JSON/HTML API response."""
        from django.conf import settings

        # SSLC POSTs form-encoded body, but also accepts GET on some flows.
        # We treat both the same way: read whatever fields it sent, and
        # always issue a 302 redirect to the frontend.
        payload = dict(request.data) if hasattr(request, "data") else {}
        if not payload:
            payload = {k: request.query_params.get(k) for k in request.query_params}

        tran_id = payload.get("tran_id")
        order_id = None
        if tran_id:
            payment = OrderService.mark_success(
                transaction_id=tran_id, payload=payload
            )
            if payment:
                order_id = payment.order_id

        # Always redirect — browser never sees raw JSON/HTML for this endpoint.
        target = settings.FRONTEND_URLS["SUCCESS"]
        if order_id:
            target = f"{target}?order={order_id}&tran_id={tran_id or ''}"
        return HttpResponseRedirect(target)

    @action(detail=False, methods=["post", "get"], permission_classes=[AllowAny])
    def fail(self, request):
        """SSLC fail-callback. PUBLIC. Marks payment FAILED, redirects to FE."""
        from django.conf import settings

        payload = dict(request.data) if hasattr(request, "data") else {}
        if not payload:
            payload = {k: request.query_params.get(k) for k in request.query_params}

        tran_id = payload.get("tran_id")
        order_id = None
        if tran_id:
            payment = OrderService.mark_failed(
                transaction_id=tran_id, payload=payload
            )
            if payment:
                order_id = payment.order_id

        target = settings.FRONTEND_URLS["FAIL"]
        if order_id:
            target = f"{target}?order={order_id}&tran_id={tran_id or ''}"
        return HttpResponseRedirect(target)

    @action(detail=False, methods=["post", "get"], permission_classes=[AllowAny])
    def cancel(self, request):
        """SSLC cancel-callback. PUBLIC. Marks payment CANCELLED, redirects."""
        from django.conf import settings

        payload = dict(request.data) if hasattr(request, "data") else {}
        if not payload:
            payload = {k: request.query_params.get(k) for k in request.query_params}

        tran_id = payload.get("tran_id")
        order_id = None
        if tran_id:
            payment = OrderService.mark_cancelled(
                transaction_id=tran_id, payload=payload
            )
            if payment:
                order_id = payment.order_id

        target = settings.FRONTEND_URLS["CANCEL"]
        if order_id:
            target = f"{target}?order={order_id}&tran_id={tran_id or ''}"
        return HttpResponseRedirect(target)

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def ipn(self, request):
        """SSLC server-to-server Instant Payment Notification. PUBLIC.
        Validates the IPN signature, then promotes Payment → VALIDATED."""
        valid = OrderService.validate_ipn(payload=dict(request.data))
        # SSLC's IPN endpoint expects a plain-text acknowledgement.
        from django.http import HttpResponse
        return HttpResponse("OK" if valid else "FAIL", status=200 if valid else 400)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def status(self, request):
        """Public lookup of payment status by tran_id.

        Useful for the frontend's post-redirect polling — after SSLC redirects
        the user to /order/success, the page can poll this endpoint to know
        whether the server has finished server-side validation.
        """
        from django.shortcuts import get_object_or_404
        tran_id = request.query_params.get("tran_id")
        if not tran_id:
            return Response({"detail": "tran_id required"}, status=400)
        payment = get_object_or_404(Payment, transaction_id=tran_id)
        return Response({
            "tran_id": payment.transaction_id,
            "order_id": payment.order_id,
            "status": payment.status,
            "amount": str(payment.amount),
            "currency": payment.currency,
            "order_status": payment.order.status,
            "validated": payment.status == Payment.VALIDATED,
        })

# ---------------------------------------------------------------------------
# Customer-facing order & payment viewsets (block staff / admin)
# ---------------------------------------------------------------------------
class CustomerOrderViewSet(ReadOnlyModelViewSet):
    """Authenticated customer can list and retrieve only their own orders.

    Staff and admins are explicitly rejected so they cannot shop or
    impersonate customers via this surface.
    """
    serializer_class = orderSz.OrderSerializer
    permission_classes = [IsAuthenticated, IsNotStaff]

    def get_queryset(self):
        return (
            Order.objects.select_related("address", "payment")
            .prefetch_related("items__product")
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        OrderService.cancel_order(order=order, user=request.user)
        return Response({"status": "Order canceled", "id": order.id})

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        return Response({
            "total": qs.count(),
            "pending": qs.filter(status="NOT_PAID").count(),
            "paid": qs.filter(status__in=["READY_TO_SHIP", "SHIPPED", "DELIVERED"]).count(),
            "completed": qs.filter(status="COMPLETED").count(),
            "cancelled": qs.filter(status="CANCELLED").count(),
        })

    @action(detail=True, methods=["get"], url_path="invoice", url_name="invoice")
    def invoice(self, request, pk=None):
        """Render a printable HTML invoice for ``pk``.

        Owned by the authenticated customer; staff are blocked by
        ``IsNotStaff``. Returns ``text/html`` with a content-disposition
        attachment so the frontend's ``responseType: 'blob'`` triggers a
        download. The user can print-to-PDF in their browser.
        """
        order = self.get_object()
        return OrderService.render_invoice(order=order)


class CustomerPaymentViewSet(ReadOnlyModelViewSet):
    """Authenticated customer can list and retrieve only their own payments."""
    serializer_class = orderSz.PaymentSerializer
    permission_classes = [IsAuthenticated, IsNotStaff]

    def get_queryset(self):
        return (
            Payment.objects.select_related("order")
            .filter(order__user=self.request.user)
            .order_by("-created_at")
        )
