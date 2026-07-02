"""Public store settings routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PublicStoreSettingsView

router = DefaultRouter()
router.register("settings", PublicStoreSettingsView, basename="public-store-settings")

urlpatterns = [
    path("", include(router.urls)),
]