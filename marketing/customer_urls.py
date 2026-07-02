"""Customer/public marketing routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NewsletterSubscribeView, PublicBannerViewSet

router = DefaultRouter()
router.register("newsletter", NewsletterSubscribeView, basename="customer-newsletter")
router.register("banners", PublicBannerViewSet, basename="public-banners")

urlpatterns = [
    path("", include(router.urls)),
]
