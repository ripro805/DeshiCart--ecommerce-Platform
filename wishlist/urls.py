"""Wishlist routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import WishlistViewSet

router = DefaultRouter()
router.register("", WishlistViewSet, basename="wishlists")

urlpatterns = [
    path("", include(router.urls)),
]