from django.contrib import admin
from .models import Banner, NewsletterSubscriber, Campaign


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "position", "is_active", "order", "starts_at", "ends_at")
    list_filter = ("position", "is_active")
    search_fields = ("title", "subtitle")


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "is_active", "subscribed_at")
    list_filter = ("is_active",)
    search_fields = ("email",)


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "starts_at", "ends_at", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
