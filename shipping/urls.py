"""Admin shipping routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminZoneViewSet, AdminRateViewSet, AdminTrackingViewSet

router = DefaultRouter()
router.register("zones", AdminZoneViewSet, basename="admin-zones")
router.register("rates", AdminRateViewSet, basename="admin-rates")
router.register("tracking", AdminTrackingViewSet, basename="admin-tracking")

urlpatterns = [
    path("", include(router.urls)),
]