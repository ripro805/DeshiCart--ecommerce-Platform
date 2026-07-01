from django.db import models
import uuid
from users.models import User
from product.models import Product

class Cart(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Cart of {self.user.email}"

class CartItem(models.Model):
	cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
	product = models.ForeignKey(Product, on_delete=models.CASCADE)
	quantity = models.PositiveIntegerField(default=1)

	class Meta:
		unique_together = ('cart', 'product')  # Ensure one entry per product in the cart

	def __str__(self):
		return f"{self.quantity} x {self.product.name} in {self.cart.user.email}'s cart"


# Order and OrderItem models
class Order(models.Model):
	NOT_PAID = 'NOT PAID'
	READY_TO_SHIP = 'READY TO SHIP'
	SHIPPED = 'SHIPPED'
	DELIVERED = 'DELIVERED'
	CANCELLED = 'CANCELLED'

	STATUS_CHOICES = [
		(NOT_PAID, 'Not Paid'),
		(READY_TO_SHIP, 'Ready to Ship'),
		(SHIPPED, 'Shipped'),
		(DELIVERED, 'Delivered'),
		(CANCELLED, 'Cancelled'),
	]
	# id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='order')
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=NOT_PAID)
	total_price = models.DecimalField(max_digits=10, decimal_places=2)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Order #{self.id} by {self.user.email}"

class OrderItem(models.Model):
	order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
	product = models.ForeignKey(Product, on_delete=models.CASCADE)
	quantity = models.PositiveIntegerField(default=1)
	price = models.DecimalField(max_digits=10, decimal_places=2)

	def __str__(self):
		return f"{self.quantity} x {self.product.name} in Order #{self.order.id}"


class Payment(models.Model):
    """SSLCommerz payment record attached to an Order."""
    PENDING = 'PENDING'
    SUCCESS = 'SUCCESS'
    FAILED = 'FAILED'
    CANCELLED = 'CANCELLED'
    VALIDATED = 'VALIDATED'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (SUCCESS, 'Success'),
        (FAILED, 'Failed'),
        (CANCELLED, 'Cancelled'),
        (VALIDATED, 'Validated'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    transaction_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    bank_tran_id = models.CharField(max_length=255, blank=True, null=True)
    card_type = models.CharField(max_length=50, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='BDT')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    gateway_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} for Order #{self.order_id} - {self.status}"
