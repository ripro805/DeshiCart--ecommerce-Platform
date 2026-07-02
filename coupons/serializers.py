"""Coupons serializers."""
from rest_framework import serializers

from .models import Coupon, CouponUsage


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "description",
            "discount_type",
            "value",
            "min_order",
            "max_uses",
            "used_count",
            "valid_from",
            "valid_to",
            "is_active",
            "is_flash_sale",
            "is_valid",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "used_count", "is_valid", "created_at", "updated_at")


class CouponUsageSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = CouponUsage
        fields = ("id", "coupon", "coupon_code", "user", "user_email", "order", "discount_amount", "used_at")
        read_only_fields = ("id", "used_at", "coupon_code", "user_email")


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=40)
    order_total = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0)
