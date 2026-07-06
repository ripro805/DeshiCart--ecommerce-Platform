"""Wishlist routes (customer scope, mounted at /api/customer/)."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import WishlistViewSet

router = DefaultRouter()
router.register("wishlists", WishlistViewSet, basename="customer-wishlists")

urlpatterns = [
    path("", include(router.urls)),
]