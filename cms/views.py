"""CMS views: admin pages + public published pages."""
from rest_framework import status as drf_status, viewsets
from rest_framework.permissions import AllowAny

from api.permissions import IsAdmin
from api.responses import api_response

from .models import Page
from .serializers import PageSerializer


class AdminPageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [IsAdmin]
    search_fields = ("title", "slug", "body")
    filterset_fields = ("is_published",)


class PublicPageViewSet(viewsets.ReadOnlyModelViewSet):
    """Public, anonymous access to published pages only."""
    serializer_class = PageSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Page.objects.filter(is_published=True)

    def list(self, request, *args, **kwargs):
        return api_response(PageSerializer(self.get_queryset(), many=True, context={"request": request}).data)

    def retrieve(self, request, *args, **kwargs):
        page = self.get_object()
        return api_response(PageSerializer(page, context={"request": request}).data)

# Create your views here.
