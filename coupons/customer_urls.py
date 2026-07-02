"""Customer-facing coupon routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CustomerCouponViewSet

router = DefaultRouter()
router.register("coupons", CustomerCouponViewSet, basename="customer-coupons")

urlpatterns = [
    path("", include(router.urls)),
]
