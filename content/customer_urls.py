"""Content customer/public routes."""
from django.urls import path

from .views import ContentHomeView

urlpatterns = [
    path("home/", ContentHomeView.as_view(), name="content-home-public"),
]
 
