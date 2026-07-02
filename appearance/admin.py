from django.contrib import admin
from .models import Appearance


@admin.register(Appearance)
class AppearanceAdmin(admin.ModelAdmin):
    list_display = ("primary_color", "accent_color", "updated_at")
