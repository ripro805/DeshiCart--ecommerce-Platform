from django.contrib import admin
from .models import ReturnRequest, ReturnItem


class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 0


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "user", "status", "refund_amount", "created_at")
    list_filter = ("status",)
    search_fields = ("order__id", "user__email")
    inlines = [ReturnItemInline]
