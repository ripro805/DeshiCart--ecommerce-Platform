"""Finance serializers."""
from rest_framework import serializers

from .models import Expense, Transaction


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "category",
            "amount",
            "note",
            "date",
            "created_by",
            "created_by_email",
            "created_at",
        )
        read_only_fields = ("id", "created_by_email", "created_at")


class TransactionSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)

    class Meta:
        model = Transaction
        fields = (
            "id",
            "order",
            "order_id",
            "type",
            "amount",
            "description",
            "reference",
            "created_at",
        )
        read_only_fields = ("id", "order_id", "created_at")
