"""Notifications serializers."""
from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = (
            "id",
            "user",
            "user_email",
            "type",
            "title",
            "body",
            "link",
            "is_read",
            "created_at",
        )
        read_only_fields = ("id", "user_email", "created_at")


class BroadcastSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=Notification.TYPE_CHOICES, default="SYSTEM")
    title = serializers.CharField(max_length=180)
    body = serializers.CharField(required=False, allow_blank=True, default="")
    link = serializers.CharField(required=False, allow_blank=True, default="")
