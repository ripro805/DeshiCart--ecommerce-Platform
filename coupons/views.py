"""Coupons viewsets for admin + customer endpoints."""
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.permissions import IsAdmin
from api.responses import api_response

from .models import Coupon, CouponUsage
from .serializers import CouponSerializer, CouponUsageSerializer, CouponValidateSerializer


class AdminCouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAdmin]
    search_fields = ("code", "description")
    filterset_fields = ("is_active", "is_flash_sale", "discount_type")

    @action(detail=True, methods=["post"], url_path="toggle-active")
    def toggle_active(self, request, pk=None):
        coupon = self.get_object()
        coupon.is_active = not coupon.is_active
        coupon.save(update_fields=["is_active"])
        return api_response(CouponSerializer(coupon).data, message="Toggled.")


class CustomerCouponViewSet(viewsets.GenericViewSet):
    """Customer-facing: list active coupons, validate a code, view own usage."""
    permission_classes = [IsAuthenticated]
    serializer_class = CouponSerializer

    def get_queryset(self):
        return Coupon.objects.filter(is_active=True)

    def list(self, request):
        now = timezone.now()
        qs = (
            self.get_queryset()
            .filter(Q(valid_from__isnull=True) | Q(valid_from__lte=now))
            .filter(Q(valid_to__isnull=True) | Q(valid_to__gte=now))
        )
        data = []
        for c in qs:
            s = CouponSerializer(c).data
            s["is_valid"] = c.is_valid
            data.append(s)
        return api_response(data)

    @action(detail=False, methods=["post"], url_path="validate")
    def validate_code(self, request):
        s = CouponValidateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            coupon = Coupon.objects.get(code=s.validated_data["code"].upper(), is_active=True)
        except Coupon.DoesNotExist:
            return api_response(None, message="Invalid coupon code.", success=False, http_status=drf_status.HTTP_404_NOT_FOUND)
        if not coupon.is_valid:
            return api_response(None, message="Coupon is no longer valid.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        order_total = Decimal(str(s.validated_data.get("order_total", 0)))
        if order_total < coupon.min_order:
            return api_response(
                None,
                message=f"Minimum order ৳{coupon.min_order} required.",
                success=False,
                http_status=drf_status.HTTP_400_BAD_REQUEST,
            )
        if coupon.discount_type == "PERCENT":
            discount = (order_total * coupon.value) / Decimal("100")
        else:
            discount = coupon.value
        return api_response(
            {
                "coupon": CouponSerializer(coupon).data,
                "discount": float(discount),
                "final_total": float(max(0, order_total - discount)),
            },
            message="Coupon applied.",
        )

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        usages = CouponUsage.objects.filter(user=request.user).select_related("coupon")
        return api_response(CouponUsageSerializer(usages, many=True).data)


# AllowAny probe for the public /validate endpoint used during checkout (pre-auth).
class PublicCouponValidateView(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = CouponValidateSerializer

    def create(self, request):
        return CustomerCouponViewSet().validate_code(request)

# Create your views here.
