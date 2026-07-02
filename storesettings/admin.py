from django.contrib import admin
from .models import StoreSettings, FAQItem


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ("store_name", "currency", "tax_rate", "updated_at")


@admin.register(FAQItem)
class FAQItemAdmin(admin.ModelAdmin):
    list_display = ("question", "category", "order", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("question", "answer")
