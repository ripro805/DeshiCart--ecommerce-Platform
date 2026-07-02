"""Customer support routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CustomerTicketViewSet, PublicContactView

router = DefaultRouter()
router.register("tickets", CustomerTicketViewSet, basename="customer-tickets")
router.register("contact", PublicContactView, basename="customer-contact")

urlpatterns = [
    path("", include(router.urls)),
]
