"""Reports routes."""
from django.urls import path

from .views import (
    SalesReportView,
    InventoryReportView,
    CustomerReportView,
)

urlpatterns = [
    path("sales/", SalesReportView.as_view(), name="report-sales"),
    path("inventory/", InventoryReportView.as_view(), name="report-inventory"),
    path("customers/", CustomerReportView.as_view(), name="report-customers"),
] 
