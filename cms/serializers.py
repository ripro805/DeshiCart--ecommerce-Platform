"""CMS serializers."""
from rest_framework import serializers

from .models import Page


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = (
            "id",
            "slug",
            "title",
            "body",
            "is_published",
            "meta_title",
            "meta_description",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
