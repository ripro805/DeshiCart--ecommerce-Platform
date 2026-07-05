"""Order routes.

The viewsets in ``order.views`` already scope their querysets based on
``request.user.is_staff``, so a single router registration is enough.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet, OrderItemViewSet, PaymentViewSet


router = DefaultRouter()
router.register("admin/orders", OrderViewSet, basename="admin-orders")
router.register("admin/order-items", OrderItemViewSet, basename="admin-order-items")
router.register("admin/payments", PaymentViewSet, basename="admin-payments")


urlpatterns = [
    path("", include(router.urls)),
]
