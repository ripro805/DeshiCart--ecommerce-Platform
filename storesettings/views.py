"""Store settings views — singleton CRUD + public read."""
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from api.permissions import IsAdmin
from api.responses import api_response

from .models import StoreSettings
from .serializers import StoreSettingsSerializer


def _get_singleton() -> StoreSettings:
    obj, _ = StoreSettings.objects.get_or_create(pk=1)
    return obj


class AdminStoreSettingsViewSet(viewsets.ViewSet):
    """Singleton viewset: list/retrieve/update the single settings row."""
    permission_classes = [IsAdmin]
    serializer_class = StoreSettingsSerializer

    def list(self, request):
        return api_response(StoreSettingsSerializer(_get_singleton()).data)

    def retrieve(self, request, pk=None):
        obj = _get_singleton()
        return api_response(StoreSettingsSerializer(obj).data)

    def partial_update(self, request, pk=None):
        obj = _get_singleton()
        s = StoreSettingsSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return api_response(s.data, message="Settings updated.")

    def update(self, request, pk=None):
        obj = _get_singleton()
        s = StoreSettingsSerializer(obj, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return api_response(s.data, message="Settings updated.")

    @action(detail=False, methods=["post"], url_path="toggle-maintenance")
    def toggle_maintenance(self, request):
        obj = _get_singleton()
        obj.is_maintenance_mode = not obj.is_maintenance_mode
        obj.save(update_fields=["is_maintenance_mode", "updated_at"])
        return api_response(StoreSettingsSerializer(obj).data, message=f"Maintenance mode {'on' if obj.is_maintenance_mode else 'off'}.")


class PublicStoreSettingsView(viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = StoreSettingsSerializer

    def list(self, request):
        return api_response(StoreSettingsSerializer(_get_singleton()).data)

# Create your views here.
