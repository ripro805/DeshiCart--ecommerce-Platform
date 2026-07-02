from django.contrib import admin
from .models import ActivityLog, StaffProfile


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("user", "action", "target_type", "target_id", "created_at")
    list_filter = ("action", "target_type")
    search_fields = ("user__email", "target_type", "target_id", "description")
    readonly_fields = ("created_at",)


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "is_active", "hired_at")
    list_filter = ("role", "is_active")
    search_fields = ("user__email",)
