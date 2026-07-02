"""Analytics endpoints for the admin dashboard."""
from datetime import timedelta

from django.db.models import Count, F, Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import IsAdmin
from api.responses import api_response
from order.models import Order, OrderItem
from product.models import Product
from users.models import User


def _date_range(request):
    days = int(request.query_params.get("days", 30))
    end = timezone.now()
    start = end - timedelta(days=days)
    return start, end, days


class SalesAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        start, end, days = _date_range(request)
        orders = Order.objects.filter(created_at__gte=start, created_at__lte=end)
        total_revenue = orders.aggregate(s=Sum("total_amount"))["s"] or 0
        total_orders = orders.count()
        avg_order_value = (total_revenue / total_orders) if total_orders else 0
        # Daily sales
        from django.db.models.functions import TruncDate
        daily = (
            orders.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total_amount"), orders=Count("id"))
            .order_by("day")
        )
        return api_response({
            "days": days,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "total_revenue": float(total_revenue),
            "total_orders": total_orders,
            "avg_order_value": float(avg_order_value),
            "daily": [
                {"date": d["day"].isoformat(), "revenue": float(d["revenue"] or 0), "orders": d["orders"]}
                for d in daily
            ],
        })


class TopProductsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        start, end, days = _date_range(request)
        limit = int(request.query_params.get("limit", 10))
        top = (
            OrderItem.objects.filter(order__created_at__gte=start, order__created_at__lte=end)
            .values("product__id", "product__title")
            .annotate(units_sold=Sum("quantity"), revenue=Sum(F("quantity") * F("price")))
            .order_by("-units_sold")[:limit]
        )
        return api_response({
            "days": days,
            "top": [
                {"product_id": r["product__id"], "title": r["product__title"], "units_sold": int(r["units_sold"] or 0), "revenue": float(r["revenue"] or 0)}
                for r in top
            ],
        })


class CustomerAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        start, end, days = _date_range(request)
        new_customers = User.objects.filter(created_at__gte=start, created_at__lte=end, role="CUSTOMER").count()
        total_customers = User.objects.filter(role="CUSTOMER").count()
        # Repeat vs one-time
        ordering_users = Order.objects.values("user").annotate(c=Count("id"))
        repeat = sum(1 for o in ordering_users if o["c"] > 1)
        one_time = sum(1 for o in ordering_users if o["c"] == 1)
        return api_response({
            "days": days,
            "new_customers": new_customers,
            "total_customers": total_customers,
            "repeat_customers": repeat,
            "one_time_customers": one_time,
        })


class PaymentBreakdownView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        start, end, days = _date_range(request)
        breakdown = (
            Order.objects.filter(created_at__gte=start, created_at__lte=end)
            .values("payment_method")
            .annotate(count=Count("id"), total=Sum("total_amount"))
            .order_by("-count")
        )
        return api_response({
            "days": days,
            "breakdown": [
                {"method": b["payment_method"] or "UNKNOWN", "count": b["count"], "total": float(b["total"] or 0)}
                for b in breakdown
            ],
        })
