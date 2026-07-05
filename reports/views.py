"""On-demand report generation endpoints (CSV)."""
from datetime import timedelta

from django.db.models import Sum, Count, F, DecimalField
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView

from api.permissions import IsSuperAdminOnly
from order.models import Order, OrderItem
from product.models import Product
from users.models import User


def _csv_response(filename: str, header: list[str], rows: list[list[str]]):
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response.write(",".join(header) + "\r\n")
    for row in rows:
        response.write(",".join(f'"{str(v).replace(chr(34), chr(34)*2)}"' if v is not None else "" for v in row) + "\r\n")
    return response


def _parse_days(request, default: int = 30) -> int:
    try:
        days = int(request.query_params.get("days", default))
        return max(1, min(days, 365))
    except (TypeError, ValueError):
        return default


class SalesReportView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        days = _parse_days(request)
        since = timezone.now() - timedelta(days=days)
        qs = (
            Order.objects.filter(created_at__gte=since, status__in=["DELIVERED", "SHIPPED", "READY TO SHIP"])
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(
                orders=Count("id"),
                revenue=Sum("total_price"),
            )
            .order_by("day")
        )
        rows = [
            [r["day"].isoformat() if r["day"] else "", r["orders"], str(r["revenue"] or 0)]
            for r in qs
        ]
        return _csv_response(
            f"sales-report-{days}d.csv",
            ["date", "orders", "revenue"],
            rows,
        )


class InventoryReportView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        qs = Product.objects.annotate(
            sold=Sum("orderitem__quantity", filter=None),
        ).values("id", "title", "stock", "price")
        rows = [
            [r["id"], r["title"], r["stock"], str(r["price"]), r["sold"] or 0]
            for r in qs
        ]
        return _csv_response(
            "inventory-report.csv",
            ["id", "title", "stock", "price", "units_sold"],
            rows,
        )


class CustomerReportView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        qs = User.objects.filter(is_staff=False, is_superuser=False).annotate(
            orders_count=Count("order", distinct=True),
        ).values("id", "email", "date_joined", "orders_count")
        rows = [
            [r["id"], r["email"], r["date_joined"].isoformat() if r["date_joined"] else "", r["orders_count"]]
            for r in qs
        ]
        return _csv_response(
            "customers-report.csv",
            ["id", "email", "date_joined", "orders_count"],
            rows,
        )
 
