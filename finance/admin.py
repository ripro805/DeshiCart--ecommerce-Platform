from django.contrib import admin
from .models import Expense, Transaction


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("category", "amount", "date", "created_by", "created_at")
    list_filter = ("category", "date")
    search_fields = ("note",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("type", "amount", "order", "description", "created_at")
    list_filter = ("type",)
    search_fields = ("description", "reference")
