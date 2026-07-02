"""Returns serializers."""
from rest_framework import serializers

from .models import ReturnItem, ReturnRequest


class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="order_item.product.name", read_only=True)

    class Meta:
        model = ReturnItem
        fields = ("id", "return_request", "order_item", "product_name", "quantity", "condition")
        read_only_fields = ("id", "product_name")


class ReturnRequestSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = ReturnRequest
        fields = (
            "id",
            "order",
            "order_id",
            "user",
            "user_email",
            "reason",
            "status",
            "refund_amount",
            "admin_note",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "user_email", "created_at", "updated_at")


class ReturnDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["APPROVED", "REJECTED", "RECEIVED", "REFUNDED"])
    admin_note = serializers.CharField(required=False, allow_blank=True, default="")
    refund_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
