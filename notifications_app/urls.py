"""Admin notification routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminNotificationViewSet

router = DefaultRouter()
router.register("notifications", AdminNotificationViewSet, basename="admin-notifications")

urlpatterns = [
    path("", include(router.urls)),
]
