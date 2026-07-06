"""Analytics endpoints for the admin dashboard."""
from datetime import timedelta

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
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
        total_revenue = orders.aggregate(s=Sum("total_price"))["s"] or 0
        total_orders = orders.count()
        avg_order_value = (total_revenue / total_orders) if total_orders else 0
        daily = (
            orders.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total_price"), orders=Count("id"))
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
            .values("product__id", "product__name")
            .annotate(units_sold=Sum("quantity"), revenue=Sum(F("quantity") * F("price")))
            .order_by("-units_sold")[:limit]
        )
        return api_response({
            "days": days,
            "top": [
                {
                    "product_id": r["product__id"],
                    "name": r["product__name"],
                    "units_sold": int(r["units_sold"] or 0),
                    "revenue": float(r["revenue"] or 0),
                }
                for r in top
            ],
        })


class CustomerAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        start, end, days = _date_range(request)
        new_customers = User.objects.filter(date_joined__gte=start, date_joined__lte=end, is_staff=False).count()
        total_customers = User.objects.filter(is_staff=False).count()
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
            .values("payment__card_type")
            .annotate(count=Count("id"), total=Sum("total_price"))
            .order_by("-count")
        )
        return api_response({
            "days": days,
            "breakdown": [
                {"method": b["payment__card_type"] or "UNKNOWN", "count": b["count"], "total": float(b["total"] or 0)}
                for b in breakdown
            ],
        })


class OverviewView(APIView):
    """Aggregate everything the admin dashboard needs in one call."""
    permission_classes = [IsAdmin]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        end = timezone.now()
        start = end - timedelta(days=days)

        orders_qs = Order.objects.filter(created_at__gte=start, created_at__lte=end)
        total_orders = orders_qs.count()
        revenue = orders_qs.aggregate(s=Sum("total_price"))["s"] or 0
        avg_order_value = (revenue / total_orders) if total_orders else 0

        by_status = dict(orders_qs.values_list("status").annotate(c=Count("id")))

        seven = end - timedelta(days=7)
        orders_7d = orders_qs.filter(created_at__gte=seven).count()
        revenue_7d = orders_qs.filter(created_at__gte=seven).aggregate(s=Sum("total_price"))["s"] or 0

        new_customers = User.objects.filter(
            date_joined__gte=start, date_joined__lte=end, is_staff=False
        ).count()
        total_customers = User.objects.filter(is_staff=False).count()

        low_stock_qs = Product.objects.filter(is_active=True, stock__lte=5)
        low_stock_count = low_stock_qs.count()
        low_stock_products = []
        for p in low_stock_qs.order_by("stock")[:8]:
            img = None
            if p.image_external_url:
                img = p.image_external_url
            elif p.image:
                try:
                    img = p.image.url
                except Exception:
                    img = None
            low_stock_products.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock,
                "image_url": img,
            })
        out_of_stock = Product.objects.filter(is_active=True, stock=0).count()

        top_products_raw = list(
            OrderItem.objects.filter(order__created_at__gte=start, order__created_at__lte=end)
            .values("product__id", "product__name")
            .annotate(units_sold=Sum("quantity"), revenue=Sum(F("quantity") * F("price")))
            .order_by("-revenue")[:6]
        )
        top_products = [
            {
                "id": r["product__id"],
                "name": r["product__name"],
                "units_sold": int(r["units_sold"] or 0),
                "revenue": float(r["revenue"] or 0),
            }
            for r in top_products_raw
        ]

        top_categories_raw = list(
            Product.objects.values("category__name").annotate(count=Count("id")).order_by("-count")[:6]
        )
        top_categories = [
            {"name": r["category__name"] or "Uncategorized", "count": r["count"]}
            for r in top_categories_raw
        ]

        recent_orders = []
        for o in orders_qs.select_related("user").order_by("-created_at")[:8]:
            recent_orders.append({
                "id": o.id,
                "user_email": getattr(o.user, "email", None),
                "status": o.status,
                "total_price": float(o.total_price or 0),
                "created_at": o.created_at.isoformat(),
            })

        daily_raw = list(
            orders_qs.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total_price"), orders=Count("id"))
            .order_by("day")
        )
        daily_series = [
            {"date": d["day"].isoformat(), "revenue": float(d["revenue"] or 0), "orders": d["orders"]}
            for d in daily_raw
        ]

        return api_response({
            "days": days,
            "revenue": float(revenue),
            "revenue_30d": float(revenue),
            "revenue_7d": float(revenue_7d),
            "orders": total_orders,
            "orders_30d": total_orders,
            "orders_7d": orders_7d,
            "avg_order_value": float(avg_order_value),
            "new_customers": new_customers,
            "total_customers": total_customers,
            "orders_by_status": by_status,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock,
            "low_stock_products": low_stock_products,
            "top_products": top_products,
            "top_categories": top_categories,
            "recent_orders": recent_orders,
            "daily": daily_series,
        })


