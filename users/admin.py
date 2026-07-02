from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Address


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("email", "is_staff", "is_superuser", "is_blocked", "is_active", "date_joined")
    list_filter = ("is_staff", "is_superuser", "is_active", "is_blocked")
    search_fields = ("email", "first_name", "last_name", "phone_number", "phone")
    ordering = ("-date_joined",)
    fieldsets = UserAdmin.fieldsets + (
        ("Profile", {"fields": ("phone_number", "phone", "address", "avatar", "date_of_birth", "last_seen_at", "is_blocked")}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "line1", "city", "country", "is_default_billing", "is_default_shipping")
    list_filter = ("country", "is_default_billing", "is_default_shipping")
    search_fields = ("user__email", "line1", "city", "postal_code")