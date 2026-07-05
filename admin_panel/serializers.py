"""Admin panel serializers."""
from rest_framework import serializers

from users.models import User
from .models import StaffProfile, ActivityLog


class StaffUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    staff_role = serializers.CharField(source="staff_profile.role", read_only=True, default=None)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "staff_role",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_blocked",
            "date_joined",
            "last_login",
        )
        read_only_fields = ("id", "full_name", "staff_role", "date_joined", "last_login")

    def get_full_name(self, obj):
        return obj.get_full_name()


class StaffProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = (
            "id",
            "user",
            "user_email",
            "full_name",
            "role",
            "permissions",
            "is_active",
            "hired_at",
            "notes",
        )
        read_only_fields = ("id", "user_email", "full_name", "hired_at")

    def get_full_name(self, obj):
        try:
            return obj.user.get_full_name() or obj.user.email
        except Exception:
            return obj.user.email


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source="user.email", read_only=True, default=None)

    class Meta:
        model = ActivityLog
        fields = ("id", "user", "actor_email", "action", "target_type", "target_id", "description", "metadata", "ip_address", "created_at")
        read_only_fields = fields 
