"""URL routing for users app."""

from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AddressViewSet, MeViewSet, UserViewSet

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="addresses")
router.register("users", UserViewSet, basename="users")

customer_me = MeViewSet.as_view({"get": "list", "patch": "partial_update"})
customer_password = MeViewSet.as_view({"post": "change_password"})
customer_dashboard = MeViewSet.as_view({"get": "dashboard"})

urlpatterns = [
    path("me/", customer_me, name="me-detail"),
    path("me/change-password/", customer_password, name="me-change-password"),
    path("me/dashboard/", customer_dashboard, name="me-dashboard"),
    path("", include(router.urls)),
]
