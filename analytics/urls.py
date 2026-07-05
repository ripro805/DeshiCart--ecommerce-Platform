"""Analytics routes."""
from django.urls import path

from .views import (
    OverviewView,
    SalesAnalyticsView,
    TopProductsView,
    CustomerAnalyticsView,
    PaymentBreakdownView,
)

urlpatterns = [
    path("overview/", OverviewView.as_view(), name="analytics-overview"),
    path("sales/", SalesAnalyticsView.as_view(), name="analytics-sales"),
    path("top-products/", TopProductsView.as_view(), name="analytics-top-products"),
    path("customers/", CustomerAnalyticsView.as_view(), name="analytics-customers"),
    path("payments/", PaymentBreakdownView.as_view(), name="analytics-payments"),
]
