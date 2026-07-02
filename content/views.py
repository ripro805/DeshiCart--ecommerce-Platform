"""Content aggregator endpoints."""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from cms.models import Page
from storesettings.models import FAQItem


class ContentHomeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        pages = list(
            Page.objects.filter(status="published").values("id", "title", "slug")[:20]
        )
        faqs = list(
            FAQItem.objects.filter(is_active=True).values("id", "question", "answer")[:20]
        )
        return Response({"pages": pages, "faqs": faqs})
  
