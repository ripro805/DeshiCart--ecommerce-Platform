"""Wishlist serializers."""
from rest_framework import serializers

from .models import Wishlist, WishlistItem
from product.serializers import ProductSerializer


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ("id", "product", "product_id", "added_at")
        read_only_fields = ("id", "added_at")


class _UserLiteSerializer(serializers.Serializer):
    """Minimal user info embedded in wishlist responses."""
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    user_detail = _UserLiteSerializer(source="user", read_only=True)

    class Meta:
        model = Wishlist
        fields = (
            "id", "user", "user_email", "user_name", "user_detail",
            "items", "created_at",
        )
        read_only_fields = ("id", "user", "user_email", "user_name", "user_detail", "items", "created_at")

    def get_user_email(self, obj):
        u = getattr(obj, "user", None)
        return getattr(u, "email", None) if u else None

    def get_user_name(self, obj):
        u = getattr(obj, "user", None)
        if not u:
            return None
        full = f"{getattr(u, 'first_name', '') or ''} {getattr(u, 'last_name', '') or ''}".strip()
        return full or getattr(u, "email", None)
