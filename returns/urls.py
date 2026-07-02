"""Admin return routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminReturnViewSet

router = DefaultRouter()
router.register("returns", AdminReturnViewSet, basename="admin-returns")

urlpatterns = [
    path("", include(router.urls)),
]
