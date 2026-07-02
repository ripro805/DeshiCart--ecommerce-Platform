"""Admin store settings routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminStoreSettingsViewSet

router = DefaultRouter()
router.register("settings", AdminStoreSettingsViewSet, basename="admin-store-settings")

urlpatterns = [
    path("", include(router.urls)),
]