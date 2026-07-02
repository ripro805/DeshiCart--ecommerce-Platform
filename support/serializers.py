"""Support serializers."""
from rest_framework import serializers

from .models import ContactMessage, SupportTicket, TicketReply


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("id", "name", "email", "subject", "message", "is_resolved", "created_at")
        read_only_fields = ("id", "is_resolved", "created_at")


class TicketReplySerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default=None)

    class Meta:
        model = TicketReply
        fields = ("id", "ticket", "user", "user_email", "message", "is_staff_reply", "created_at")
        read_only_fields = ("id", "user", "user_email", "is_staff_reply", "created_at")


class SupportTicketSerializer(serializers.ModelSerializer):
    replies = TicketReplySerializer(many=True, read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            "id",
            "user",
            "user_email",
            "subject",
            "message",
            "status",
            "priority",
            "replies",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "user_email", "replies", "created_at", "updated_at")
