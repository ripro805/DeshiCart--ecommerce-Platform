"""Appearance views."""
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.permissions import IsSuperAdminOnly
from api.responses import api_response

from .models import Appearance
from .serializers import AppearanceSerializer


def _get_singleton() -> Appearance:
    obj = Appearance.objects.first()
    if obj is None:
        obj = Appearance.objects.create()
    return obj


class AdminAppearanceViewSet(viewsets.ModelViewSet):
    serializer_class = AppearanceSerializer
    permission_classes = [IsSuperAdminOnly]

    def list(self, request, *args, **kwargs):
        obj = _get_singleton()
        return api_response(AppearanceSerializer(obj).data)

    def retrieve(self, request, pk=None, *args, **kwargs):
        # Appearance is a singleton — only the existing row's PK is valid.
        # Reject anything else with 404 so the route's PK semantics are honest.
        obj = _get_singleton()
        if pk is not None and int(pk) != obj.pk:
            return api_response(
                {"detail": "Appearance is a singleton; only the existing row is addressable."},
                http_status=drf_status.HTTP_404_NOT_FOUND,
            )
        return api_response(AppearanceSerializer(obj).data)

    def update(self, request, pk=None, *args, **kwargs):
        obj = _get_singleton()
        if pk is not None and int(pk) != obj.pk:
            return api_response(
                {"detail": "Appearance is a singleton; only the existing row is addressable."},
                http_status=drf_status.HTTP_404_NOT_FOUND,
            )
        ser = AppearanceSerializer(obj, data=request.data, partial=False)
        ser.is_valid(raise_exception=True)
        ser.save()
        return api_response(ser.data, message="Appearance updated.")

    def partial_update(self, request, pk=None, *args, **kwargs):
        obj = _get_singleton()
        if pk is not None and int(pk) != obj.pk:
            return api_response(
                {"detail": "Appearance is a singleton; only the existing row is addressable."},
                http_status=drf_status.HTTP_404_NOT_FOUND,
            )
        ser = AppearanceSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return api_response(ser.data, message="Appearance updated.")


class PublicAppearanceView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        obj = _get_singleton()
        return Response(AppearanceSerializer(obj).data)  
