"""Admin panel serializers."""
from rest_framework import serializers

from users.models import User
from .models import StaffProfile, ActivityLog


class StaffUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_blocked",
            "date_joined",
            "last_login",
        )
        read_only_fields = ("id", "full_name", "role", "date_joined", "last_login")

    def get_full_name(self, obj):
        return obj.get_full_name()


class StaffProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = StaffProfile
        fields = ("id", "user", "user_email", "title", "permissions", "is_active", "hired_at", "notes")
        read_only_fields = ("id", "user_email", "hired_at")


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source="user.email", read_only=True, default=None)

    class Meta:
        model = ActivityLog
        fields = ("id", "user", "actor_email", "action", "target_type", "target_id", "description", "metadata", "ip_address", "created_at")
        read_only_fields = fields 
