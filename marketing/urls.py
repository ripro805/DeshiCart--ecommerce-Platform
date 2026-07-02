"""Admin marketing routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AdminBannerViewSet, AdminCampaignViewSet, AdminNewsletterViewSet

router = DefaultRouter()
router.register("banners", AdminBannerViewSet, basename="admin-banners")
router.register("campaigns", AdminCampaignViewSet, basename="admin-campaigns")
router.register("newsletter", AdminNewsletterViewSet, basename="admin-newsletter")

urlpatterns = [
    path("", include(router.urls)),
]
