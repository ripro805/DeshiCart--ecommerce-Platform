"""Admin CMS routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminPageViewSet

router = DefaultRouter()
router.register("pages", AdminPageViewSet, basename="admin-pages")

urlpatterns = [
    path("", include(router.urls)),
]
