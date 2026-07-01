from django.contrib import admin
from order.models import Cart, CartItem, Order, OrderItem, Payment

# Register your models here.


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'transaction_id', 'amount', 'status', 'created_at']
    list_filter = ['status', 'currency', 'card_type']
    search_fields = ['transaction_id', 'bank_tran_id', 'order__id']
    readonly_fields = ['created_at', 'updated_at', 'gateway_response']


admin.site.register(CartItem)
admin.site.register(OrderItem)