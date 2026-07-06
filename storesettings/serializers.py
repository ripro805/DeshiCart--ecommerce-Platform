"""Store settings serializers."""
from rest_framework import serializers

from .models import StoreSettings


class StoreSettingsSerializer(serializers.ModelSerializer):
    """Full StoreSettings admin payload including SMTP + security fields.

    smtp_password is write_only=True so the GET response never leaks it back.
    """

    smtp_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = StoreSettings
        fields = (
            "id",
            "store_name",
            "store_email",
            "store_phone",
            "store_address",
            "currency",
            "currency_symbol",
            "tax_rate",
            "smtp_host",
            "smtp_port",
            "smtp_user",
            "smtp_password",
            "smtp_use_tls",
            "smtp_from_email",
            "social_facebook",
            "social_instagram",
            "social_twitter",
            "social_youtube",
            "security_2fa_required",
            "session_timeout_minutes",
            "maintenance_mode",
            "updated_at",
        )
        read_only_fields = ("id", "updated_at")