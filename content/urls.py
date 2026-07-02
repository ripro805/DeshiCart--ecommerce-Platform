"""Content routes (admin)."""
from django.urls import path

from .views import ContentHomeView

urlpatterns = [
    path("home/", ContentHomeView.as_view(), name="content-home"),
]
  
