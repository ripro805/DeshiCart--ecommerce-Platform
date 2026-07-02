"""Customer shipping routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CustomerTrackingViewSet, PublicRateCalculatorView

router = DefaultRouter()
router.register("tracking", CustomerTrackingViewSet, basename="customer-tracking")
router.register("rates", PublicRateCalculatorView, basename="public-rates")

urlpatterns = [
    path("", include(router.urls)),
]