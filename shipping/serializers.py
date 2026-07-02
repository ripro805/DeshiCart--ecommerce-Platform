"""Shipping serializers."""
from rest_framework import serializers

from .models import ShippingZone, ShippingRate, TrackingUpdate


class ShippingRateSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source="zone.name", read_only=True)

    class Meta:
        model = ShippingRate
        fields = ("id", "zone", "zone_name", "name", "min_weight", "max_weight", "min_order_total", "price", "eta_days", "is_active")
        read_only_fields = ("id", "zone_name")


class ShippingZoneSerializer(serializers.ModelSerializer):
    rates = ShippingRateSerializer(many=True, read_only=True)

    class Meta:
        model = ShippingZone
        fields = ("id", "name", "countries", "is_active", "rates")
        read_only_fields = ("id", "rates")


class TrackingUpdateSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)

    class Meta:
        model = TrackingUpdate
        fields = ("id", "order", "order_id", "carrier", "tracking_number", "status", "shipped_at", "delivered_at", "history")
        read_only_fields = ("id", "order_id", "shipped_at")