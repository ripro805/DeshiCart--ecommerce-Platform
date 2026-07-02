"""Customer notification routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CustomerNotificationViewSet

router = DefaultRouter()
router.register("notifications", CustomerNotificationViewSet, basename="customer-notifications")

urlpatterns = [
    path("", include(router.urls)),
]
