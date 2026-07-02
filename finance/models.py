from django.conf import settings
from django.db import models


class Expense(models.Model):
    CATEGORY_CHOICES = (
        ("RENT", "Rent"),
        ("SALARY", "Salary"),
        ("MARKETING", "Marketing"),
        ("LOGISTICS", "Logistics"),
        ("UTILITIES", "Utilities"),
        ("MISC", "Misc"),
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="MISC")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True, default="")
    date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="expenses",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.category}: {self.amount}"


class Transaction(models.Model):
    TYPE_CHOICES = (
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
        ("REFUND", "Refund"),
    )
    order = models.ForeignKey(
        "order.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="INCOME")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, default="")
    reference = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} {self.amount}"
