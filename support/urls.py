"""Admin support routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminContactViewSet, AdminTicketViewSet

router = DefaultRouter()
router.register("contact", AdminContactViewSet, basename="admin-contact")
router.register("tickets", AdminTicketViewSet, basename="admin-tickets")

urlpatterns = [
    path("", include(router.urls)),
]
