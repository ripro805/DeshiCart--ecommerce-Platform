from django.contrib import admin
from .models import Coupon, CouponUsage


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "value", "is_active", "is_flash_sale", "used_count", "valid_from", "valid_to")
    list_filter = ("is_active", "is_flash_sale", "discount_type")
    search_fields = ("code", "description")


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ("coupon", "user", "order", "discount_amount", "used_at")
    list_filter = ("coupon",)
    search_fields = ("user__email", "coupon__code")
