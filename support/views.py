"""Support views: contact messages + tickets + replies."""
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated

from api.permissions import IsAdmin
from api.responses import api_response

from .models import ContactMessage, SupportTicket, TicketReply
from .serializers import (
    ContactMessageSerializer,
    SupportTicketSerializer,
    TicketReplySerializer,
)


class AdminContactViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ("is_resolved",)
    search_fields = ("name", "email", "subject", "message")

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request, pk=None):
        msg = self.get_object()
        msg.is_resolved = True
        msg.save(update_fields=["is_resolved"])
        return api_response(ContactMessageSerializer(msg).data, message="Marked resolved.")


class AdminTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all().select_related("user").prefetch_related("replies")
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ("status", "priority")
    search_fields = ("subject", "message", "user__email")

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get("message", "").strip()
        if not message:
            return api_response(None, message="Message required.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        r = TicketReply.objects.create(ticket=ticket, user=request.user, message=message, is_staff_reply=True)
        if ticket.status == "OPEN":
            ticket.status = "IN_PROGRESS"
            ticket.save(update_fields=["status"])
        return api_response(TicketReplySerializer(r).data, message="Reply sent.", http_status=drf_status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = "CLOSED"
        ticket.save(update_fields=["status"])
        return api_response(SupportTicketSerializer(ticket).data, message="Ticket closed.")


class CustomerTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user).prefetch_related("replies")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get("message", "").strip()
        if not message:
            return api_response(None, message="Message required.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        r = TicketReply.objects.create(ticket=ticket, user=request.user, message=message, is_staff_reply=False)
        return api_response(TicketReplySerializer(r).data, message="Reply added.", http_status=drf_status.HTTP_201_CREATED)


class PublicContactView(viewsets.ViewSet):
    """Anonymous contact form submission."""
    permission_classes = [AllowAny]
    serializer_class = ContactMessageSerializer

    def create(self, request):
        s = ContactMessageSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return api_response(s.data, message="Message received.", http_status=drf_status.HTTP_201_CREATED)

# Create your views here.
