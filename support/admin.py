from django.contrib import admin
from .models import ContactMessage, SupportTicket, TicketReply


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "is_resolved", "created_at")
    list_filter = ("is_resolved",)
    search_fields = ("name", "email", "subject", "message")


class TicketReplyInline(admin.TabularInline):
    model = TicketReply
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "user", "status", "priority", "updated_at")
    list_filter = ("status", "priority")
    search_fields = ("subject", "user__email")
    inlines = [TicketReplyInline]
