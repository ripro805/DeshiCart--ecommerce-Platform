"""Marketing serializers."""
from rest_framework import serializers

from .models import Banner, Campaign, NewsletterSubscriber


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = (
            "id",
            "title",
            "subtitle",
            "image",
            "link",
            "position",
            "is_active",
            "order",
            "starts_at",
            "ends_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = (
            "id",
            "name",
            "description",
            "starts_at",
            "ends_at",
            "is_active",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ("id", "email", "is_active", "subscribed_at")
        read_only_fields = ("id", "subscribed_at")
