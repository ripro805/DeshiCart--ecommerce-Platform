"""Returns viewsets — admin + customer."""
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from api.permissions import IsSuperAdminOnly
from api.responses import api_response

from .models import ReturnItem, ReturnRequest
from .serializers import ReturnDecisionSerializer, ReturnItemSerializer, ReturnRequestSerializer


class AdminReturnViewSet(viewsets.ModelViewSet):
    queryset = ReturnRequest.objects.select_related("order", "user").prefetch_related("items").all()
    serializer_class = ReturnRequestSerializer
    permission_classes = [IsSuperAdminOnly]
    filterset_fields = ("status",)
    search_fields = ("order__id", "user__email", "reason")

    @action(detail=True, methods=["post"], url_path="decide")
    def decide(self, request, pk=None):
        rr = self.get_object()
        s = ReturnDecisionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        new_status = s.validated_data["status"]
        if new_status == "REJECTED" and rr.status not in ("REQUESTED", "APPROVED"):
            return api_response(None, message="Cannot reject now.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        rr.status = new_status
        if s.validated_data.get("admin_note") is not None:
            rr.admin_note = s.validated_data["admin_note"]
        if s.validated_data.get("refund_amount") is not None:
            rr.refund_amount = s.validated_data["refund_amount"]
        rr.save()
        return api_response(ReturnRequestSerializer(rr).data, message=f"Status set to {new_status}.")


class CustomerReturnViewSet(viewsets.ModelViewSet):
    serializer_class = ReturnRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return ReturnRequest.objects.filter(user=self.request.user).prefetch_related("items")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        items = request.data.pop("items", [])
        rr = ReturnRequest.objects.create(
            user=request.user,
            order_id=request.data.get("order"),
            reason=request.data.get("reason", ""),
        )
        for it in items:
            ReturnItem.objects.create(
                return_request=rr,
                order_item_id=it.get("order_item"),
                quantity=it.get("quantity", 1),
                condition=it.get("condition", ""),
            )
        return api_response(ReturnRequestSerializer(rr).data, message="Return request submitted.", http_status=drf_status.HTTP_201_CREATED)

# Create your views here.
