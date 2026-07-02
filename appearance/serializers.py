"""Appearance serializers."""
from rest_framework import serializers

from .models import Appearance


class AppearanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appearance
        fields = (
            "id",
            "logo_url",
            "favicon_url",
            "primary_color",
            "accent_color",
            "ink_color",
            "bg_color",
            "hero_title",
            "hero_subtitle",
            "hero_image_url",
            "hero_cta_label",
            "hero_cta_link",
            "footer_text",
            "updated_at",
        )
        read_only_fields = ("id", "updated_at") 
