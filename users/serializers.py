"""
Serializers for the users app.

The User serializer used by DJOSER registration and login flow is defined
here. AddressSerializer handles the customer's address book.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Address

User = get_user_model()


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "label",
            "line1",
            "line2",
            "city",
            "state",
            "postal_code",
            "country",
            "phone",
            "is_default_billing",
            "is_default_shipping",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["user"] = request.user if request else validated_data.get("user")
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of the User, including role helpers."""

    is_admin_user = serializers.BooleanField(read_only=True)
    is_super_admin = serializers.BooleanField(read_only=True)
    is_staff_admin = serializers.BooleanField(read_only=True)
    role = serializers.CharField(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "avatar",
            "date_of_birth",
            "last_seen_at",
            "is_active",
            "is_blocked",
            "is_staff",
            "is_superuser",
            "date_joined",
            "is_admin_user",
            "is_super_admin",
            "is_staff_admin",
            "role",
            "addresses",
        )
        # Only ``is_superuser`` stays read-only here; staff / active / blocked
        # are intentionally writable so the admin panel can toggle them.
        read_only_fields = (
            "id",
            "last_seen_at",
            "is_superuser",
            "date_joined",
            "is_admin_user",
            "is_super_admin",
            "is_staff_admin",
            "role",
        )


class UserCreateSerializer(serializers.ModelSerializer):
    """Used by DJOSER for self-service registration."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    re_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "password",
            "re_password",
        )

    def validate(self, attrs):
        if attrs.get("password") != attrs.pop("re_password", None):
            raise serializers.ValidationError({"re_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Used for self-service profile edits."""

    class Meta:
        model = User
        fields = ("first_name", "last_name", "phone", "avatar", "date_of_birth")


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
