"""Customer return routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CustomerReturnViewSet

router = DefaultRouter()
router.register("returns", CustomerReturnViewSet, basename="customer-returns")

urlpatterns = [
    path("", include(router.urls)),
]
