"""Store settings serializers."""
from rest_framework import serializers

from .models import StoreSettings


class StoreSettingsSerializer(serializers.ModelSerializer):
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
            "social_facebook",
            "social_instagram",
            "social_twitter",
            "social_youtube",
            "maintenance_mode",
            "updated_at",
        )
        read_only_fields = ("id", "updated_at")