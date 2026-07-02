from django.contrib import admin
from .models import ShippingZone, ShippingRate, TrackingUpdate


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ("zone", "name", "min_weight", "max_weight", "price", "courier", "is_active")
    list_filter = ("zone", "courier", "is_active")


@admin.register(TrackingUpdate)
class TrackingUpdateAdmin(admin.ModelAdmin):
    list_display = ("order", "status", "location", "created_at")
    list_filter = ("status",)
    search_fields = ("order__id", "location")
