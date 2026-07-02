"""Shipping views: zones, rates, tracking + public rate calculator."""
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.permissions import IsAdmin
from api.responses import api_response

from .models import ShippingZone, ShippingRate, TrackingUpdate
from .serializers import (
    ShippingZoneSerializer,
    ShippingRateSerializer,
    TrackingUpdateSerializer,
)


class AdminZoneViewSet(viewsets.ModelViewSet):
    queryset = ShippingZone.objects.all().prefetch_related("rates")
    serializer_class = ShippingZoneSerializer
    permission_classes = [IsAdmin]
    search_fields = ("name",)


class AdminRateViewSet(viewsets.ModelViewSet):
    queryset = ShippingRate.objects.all().select_related("zone")
    serializer_class = ShippingRateSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ("zone", "is_active")


class AdminTrackingViewSet(viewsets.ModelViewSet):
    queryset = TrackingUpdate.objects.all().select_related("order")
    serializer_class = TrackingUpdateSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ("carrier", "status")
    search_fields = ("tracking_number", "order__id")


class CustomerTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TrackingUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from order.models import Order
        return TrackingUpdate.objects.filter(order__user=self.request.user).select_related("order")


class PublicRateCalculatorView(viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = ShippingRateSerializer

    @action(detail=False, methods=["post"], url_path="calculate")
    def calculate(self, request):
        country = (request.data.get("country") or "").upper()
        order_total = float(request.data.get("order_total") or 0)
        weight = float(request.data.get("weight") or 0)
        if not country:
            return api_response(None, message="country required.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        # Find zone containing country
        zones = ShippingZone.objects.filter(is_active=True)
        matched_zone = None
        for z in zones:
            countries = z.countries or []
            if country in [c.upper() for c in countries] or "ALL" in [c.upper() for c in countries]:
                matched_zone = z
                break
        if not matched_zone:
            return api_response({"available": False, "reason": "No shipping zone matches that country."})
        rates = ShippingRate.objects.filter(zone=matched_zone, is_active=True)
        results = []
        for r in rates:
            if r.min_weight is not None and weight < r.min_weight:
                continue
            if r.max_weight is not None and weight > r.max_weight:
                continue
            if r.min_order_total is not None and order_total < float(r.min_order_total):
                continue
            results.append(ShippingRateSerializer(r).data)
        return api_response({"available": bool(results), "zone": matched_zone.name, "rates": results})

