"""Public CMS routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PublicPageViewSet

router = DefaultRouter()
router.register("pages", PublicPageViewSet, basename="public-pages")

urlpatterns = [
    path("", include(router.urls)),
]
