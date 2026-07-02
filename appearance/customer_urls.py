"""Appearance customer/public routes."""
from django.urls import path

from .views import PublicAppearanceView

urlpatterns = [
    path("appearance/", PublicAppearanceView.as_view({"get": "list"}), name="public-appearance"),
]
 
