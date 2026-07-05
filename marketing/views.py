"""Marketing viewsets — banners, campaigns, newsletter."""
from django.utils import timezone
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.permissions import IsSuperAdminOnly
from api.responses import api_response

from .models import Banner, Campaign, NewsletterSubscriber
from .serializers import (
    BannerSerializer,
    CampaignSerializer,
    NewsletterSubscriberSerializer,
)


class AdminBannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsSuperAdminOnly]
    filterset_fields = ("position", "is_active")


class AdminCampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsSuperAdminOnly]
    filterset_fields = ("is_active",)


class AdminNewsletterViewSet(viewsets.ModelViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [IsSuperAdminOnly]
    filterset_fields = ("is_active",)
    search_fields = ("email",)


class PublicBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """Public, no-auth banners for homepage rendering."""
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        now = timezone.now()
        return Banner.objects.filter(is_active=True).filter(
            **{}
        ).filter(
            # Always-valid if starts_at/ends_at is null
        ).order_by("position", "order", "-created_at")

    def list(self, request, *args, **kwargs):
        now = timezone.now()
        qs = self.get_queryset()
        valid = []
        for b in qs:
            if b.starts_at and b.starts_at > now:
                continue
            if b.ends_at and b.ends_at < now:
                continue
            valid.append(b)
        return api_response(BannerSerializer(valid, many=True, context={"request": request}).data)


class NewsletterSubscribeView(viewsets.ViewSet):
    """Anonymous newsletter signup."""
    permission_classes = [AllowAny]
    serializer_class = NewsletterSubscriberSerializer

    def create(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return api_response(None, message="Email is required.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        sub, created = NewsletterSubscriber.objects.get_or_create(email=email, defaults={"is_active": True})
        if not created and not sub.is_active:
            sub.is_active = True
            sub.save(update_fields=["is_active"])
        return api_response(NewsletterSubscriberSerializer(sub).data, message="Subscribed.", http_status=drf_status.HTTP_201_CREATED)

# Create your views here.
