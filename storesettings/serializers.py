"""Store settings serializers."""
from rest_framework import serializers

from .models import StoreSettings


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = (
            "id",
            "site_name",
            "site_tagline",
            "logo_url",
            "favicon_url",
            "support_email",
            "support_phone",
            "address",
            "currency",
            "currency_symbol",
            "tax_rate",
            "low_stock_threshold",
            "is_maintenance_mode",
            "maintenance_message",
            "social_facebook",
            "social_instagram",
            "social_twitter",
            "social_youtube",
            "meta_title",
            "meta_description",
            "meta_keywords",
            "updated_at",
        )
        read_only_fields = ("id", "updated_at")