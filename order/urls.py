"""Order routes.

Customer-facing routes:
    /api/carts/                       â€” POST (idempotent), GET, DELETE
    /api/carts/<cart_pk>/items/       â€” POST, GET, PATCH, DELETE  (CartItemViewSet, nested)
    /api/payment/checkout/            â€” POST  (PaymentViewSet action)
    /api/payment/success/             â€” POST  (gateway callback)
    /api/payment/fail/                â€” POST  (gateway callback)
    /api/payment/cancel/              â€” POST  (gateway callback)
    /api/payment/ipn/                 â€” POST  (gateway callback)

Admin-facing routes:
    /api/admin/orders/                â€” OrderViewSet
    /api/admin/order-items/           â€” OrderItemViewSet
    /api/admin/payments/              â€” PaymentViewSet  (list only)

The nested cart-items URL is hand-rolled to avoid pulling in
``drf-nested-router`` as a dependency. ``CartItemViewSet.get_queryset``
reads ``self.kwargs['cart_pk']`` and ``.get_serializer_context``
propagates the same key into the serializer â€” wired through the
custom URL pattern below.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CartViewSet,
    CartItemViewSet,
    OrderViewSet,
    OrderItemViewSet,
    PaymentViewSet,
    CustomerOrderViewSet,
    CustomerPaymentViewSet,
)


router = DefaultRouter()
router.register("carts", CartViewSet, basename="carts")
router.register("admin/orders", OrderViewSet, basename="admin-orders")
router.register("admin/order-items", OrderItemViewSet, basename="admin-order-items")
router.register("admin/payments", PaymentViewSet, basename="admin-payments")


# Nested cart items: dispatch to the underlying CartItemViewSet manually so we
# don't have to add ``drf-nested-router`` to requirements.txt. The viewset
# expects ``cart_pk`` in ``self.kwargs`` â€” same kwarg is injected via the
# URL pattern below.


# ---------------------------------------------------------------------------
# Customer-facing routers (only the order / payment slice)
# ---------------------------------------------------------------------------
customer_router = DefaultRouter()
customer_router.register("orders", CustomerOrderViewSet, basename="customer-orders")
customer_router.register("payments", CustomerPaymentViewSet, basename="customer-payments")

cart_item_list = CartItemViewSet.as_view({"get": "list", "post": "create"})
cart_item_detail = CartItemViewSet.as_view({
    "get": "retrieve",
    "patch": "partial_update",
    "put": "update",
    "delete": "destroy",
})

urlpatterns = [
    path("", include(router.urls)),
    path(
        "carts/<uuid:cart_pk>/items/",
        cart_item_list,
        name="cart-item-list",
    ),
    path(
        "carts/<uuid:cart_pk>/items/<int:pk>/",
        cart_item_detail,
        name="cart-item-detail",
    ),
]


urlpatterns += [
    path("customer/", include(customer_router.urls)),
    # Customer-facing payment gateway actions. ``PaymentViewSet`` is a
    # ``GenericViewSet`` whose endpoints are custom ``@action(detail=False)``
    # methods, so we wire them up explicitly instead of mounting it via a
    # router (which would only generate list/detail routes we don't want).
    path(
        "payment/checkout/",
        PaymentViewSet.as_view({"post": "checkout"}),
        name="payment-checkout",
    ),
    path(
        "payment/success/",
        PaymentViewSet.as_view({"post": "success", "get": "success"}),
        name="payment-success",
    ),
    path(
        "payment/fail/",
        PaymentViewSet.as_view({"post": "fail", "get": "fail"}),
        name="payment-fail",
    ),
    path(
        "payment/cancel/",
        PaymentViewSet.as_view({"post": "cancel", "get": "cancel"}),
        name="payment-cancel",
    ),
    path(
        "payment/ipn/",
        PaymentViewSet.as_view({"post": "ipn"}),
        name="payment-ipn",
    ),
    path(
        "payment/status/",
        PaymentViewSet.as_view({"get": "status"}),
        name="payment-status",
    ),
    path(
        "customer/orders/<int:pk>/invoice/",
        CustomerOrderViewSet.as_view({"get": "invoice"}),
        name="customer-order-invoice",
    ),
]
