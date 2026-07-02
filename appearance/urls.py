"""Appearance admin routes."""
from django.urls import path

from .views import AdminAppearanceViewSet

admin_appearance_list = AdminAppearanceViewSet.as_view({"get": "list", "put": "update", "patch": "partial_update"})
admin_appearance_detail = AdminAppearanceViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update"})

urlpatterns = [
    path("appearance/", admin_appearance_list, name="admin-appearance"),
    path("appearance/<int:pk>/", admin_appearance_detail, name="admin-appearance-detail"),
]
  
