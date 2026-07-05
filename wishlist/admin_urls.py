"""Staff/admin wishlist routes (mounted at /api/wishlist/)."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import WishlistViewSet

admin_router = DefaultRouter()
admin_router.register("wishlists", WishlistViewSet, basename="admin-wishlists")

urlpatterns = [
    path("", include(admin_router.urls)),
]
