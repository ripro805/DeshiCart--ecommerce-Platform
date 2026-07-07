"""Marketing viewsets — banners, campaigns, newsletter."""
from django.db.models import Q
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
        """
        Active banners within their display window.

        Date filtering is pushed down to the database via Q() so expired /
        not-yet-started banners are excluded by SQL (rather than loaded into
        Python and filtered by the caller). A banner with NULL starts_at or
        NULL ends_at is treated as "always valid" for that bound.
        """
        now = timezone.now()
        return (
            Banner.objects.filter(is_active=True)
            .filter(
                Q(starts_at__isnull=True) | Q(starts_at__lte=now),
                Q(ends_at__isnull=True) | Q(ends_at__gte=now),
            )
            .order_by("position", "order", "-created_at")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return api_response(
            BannerSerializer(qs, many=True, context={"request": request}).data
        )


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
