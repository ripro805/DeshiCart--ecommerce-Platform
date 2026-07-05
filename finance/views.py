"""Finance views: expenses + transactions + summary dashboard."""
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.permissions import IsAdmin
from api.responses import api_response

from .models import Expense, Transaction
from .serializers import ExpenseSerializer, TransactionSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ("category",)
    search_fields = ("note",)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ("type",)
    search_fields = ("description", "reference")


class FinanceSummaryView(viewsets.ViewSet):
    permission_classes = [IsAdmin]

    def list(self, request):
        now = timezone.now()
        start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_week = now - timedelta(days=7)
        income_qs = Transaction.objects.filter(type="INCOME")
        expense_qs = Transaction.objects.filter(type="EXPENSE")
        refund_qs = Transaction.objects.filter(type="REFUND")
        income_total = float(income_qs.aggregate(s=Sum("amount"))["s"] or 0)
        expense_total = float(expense_qs.aggregate(s=Sum("amount"))["s"] or 0)
        refund_total = float(refund_qs.aggregate(s=Sum("amount"))["s"] or 0)
        net_profit = income_total - expense_total
        return api_response(
            {
                # Frontend-friendly aliases
                "total_revenue": income_total,
                "total_payouts": expense_total,
                "total_refunds": refund_total,
                "net_profit": net_profit,
                # Detailed breakdown
                "income_total": income_total,
                "expense_total": expense_total,
                "refund_total": refund_total,
                "net": net_profit,
                "month_income": float(income_qs.filter(created_at__gte=start_month).aggregate(s=Sum("amount"))["s"] or 0),
                "week_income": float(income_qs.filter(created_at__gte=start_week).aggregate(s=Sum("amount"))["s"] or 0),
                "expenses_by_category": list(
                    Expense.objects.values("category").annotate(total=Sum("amount")).order_by("-total")
                ),
            }
        )

# Create your views here.
