"""Notification viewsets — admin broadcast + customer inbox."""
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from api.permissions import IsAdmin
from api.responses import api_response

from .models import Notification
from .serializers import BroadcastSerializer, NotificationSerializer


class AdminNotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAdmin]
    search_fields = ("title", "body")
    filterset_fields = ("type", "is_read")

    @action(detail=False, methods=["post"], url_path="broadcast")
    def broadcast(self, request):
        s = BroadcastSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        n = Notification.objects.create(
            user=None,
            type=s.validated_data["type"],
            title=s.validated_data["title"],
            body=s.validated_data.get("body", ""),
            link=s.validated_data.get("link", ""),
        )
        return api_response(NotificationSerializer(n).data, message="Broadcast queued.", http_status=drf_status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        n = Notification.objects.filter(pk=pk).first()
        if not n:
            return api_response(None, message="Not found.", success=False, http_status=drf_status.HTTP_404_NOT_FOUND)
        n.is_read = True
        n.save(update_fields=["is_read"])
        return api_response(NotificationSerializer(n).data, message="Marked as read.")

    @action(detail=True, methods=["post"], url_path="mark_unread")
    def mark_unread(self, request, pk=None):
        n = Notification.objects.filter(pk=pk).first()
        if not n:
            return api_response(None, message="Not found.", success=False, http_status=drf_status.HTTP_404_NOT_FOUND)
        n.is_read = False
        n.save(update_fields=["is_read"])
        return api_response(NotificationSerializer(n).data, message="Marked as unread.")

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        updated = Notification.objects.filter(is_read=False).update(is_read=True)
        return api_response({"updated": updated}, message="All notifications marked as read.")


class CustomerNotificationViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def list(self, request):
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")
        unread = request.query_params.get("unread") in ("1", "true", "True")
        if unread:
            qs = qs.filter(is_read=False)
        return api_response(NotificationSerializer(qs[:100], many=True).data)

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        n = Notification.objects.filter(pk=pk, user=request.user).first()
        if not n:
            return api_response(None, message="Not found.", success=False, http_status=drf_status.HTTP_404_NOT_FOUND)
        n.is_read = True
        n.save(update_fields=["is_read"])
        return api_response(NotificationSerializer(n).data, message="Marked as read.")

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return api_response(None, message="All marked as read.")

# Create your views here.
