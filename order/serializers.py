"""Order, Cart, and Payment serializers."""
from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from order.models import Cart, CartItem, Order, OrderItem, Payment
from order.services import OrderService
from product.models import Product
from users.models import Address

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = (
            "id", "cart", "product", "product_name", "product_image",
            "quantity", "line_total",
        )
        read_only_fields = ("id", "cart",)

    def get_product_image(self, item):
        product = item.product
        if not product:
            return None
        if getattr(product, "image_external_url", None):
            return product.image_external_url
        if not getattr(product, "image", None):
            return None
        request = self.context.get("request")
        url = product.image.url
        return request.build_absolute_uri(url) if request else url

    def get_line_total(self, item):
        if not item.product:
            return "0.00"
        return str(Decimal(str(item.product.price)) * int(item.quantity))

    def validate_quantity(self, value):
        if value is None or int(value) < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return int(value)


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product not found.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        """Create or increment a CartItem for the current cart."""
        cart_id = self.context.get("cart_id")
        cart = get_object_or_404(Cart, pk=cart_id)
        product = Product.objects.get(pk=validated_data["product_id"])
        quantity = int(validated_data.get("quantity") or 1)

        item, created = CartItem.objects.select_for_update().get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity = int(item.quantity) + quantity
            item.save(update_fields=["quantity"])
        return item


class UpdateCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ("quantity",)

    def validate_quantity(self, value):
        if value is None or int(value) < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return int(value)

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id", "user", "items", "total_items", "total_price",
            "created_at",
        )
        read_only_fields = ("id", "user", "created_at")

    def get_total_items(self, cart):
        return sum((item.quantity for item in cart.items.all()), 0)

    def get_total_price(self, cart):
        total = Decimal("0")
        for item in cart.items.all():
            if not item.product:
                continue
            total += Decimal(str(item.product.price)) * int(item.quantity)
        return f"{total:.2f}"


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "id", "order", "product", "product_name",
            "quantity", "price", "line_total",
        )
        read_only_fields = ("id", "order", "price")

    def get_line_total(self, item):
        return str(Decimal(str(item.price)) * int(item.quantity))

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(source="user.email", read_only=True)
    payment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id", "user", "customer_email", "items", "total_price",
            "status", "shipping_address", "notes", "address",
            "payment", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "user", "customer_email", "total_price", "status",
            "shipping_address", "created_at", "updated_at",
        )

    def get_payment(self, order):
        payment = Payment.objects.filter(order=order).order_by("-id").first()
        if not payment:
            return None
        return PaymentSerializer(payment, context=self.context).data


class CreateOrderSerializer(serializers.Serializer):
    # Cart PK is a UUID in this project; accept either form.
    cart_id = serializers.CharField(required=False, allow_null=True)
    address_id = serializers.IntegerField(required=False, allow_null=True)
    shipping_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not attrs.get("cart_id"):
            cart = Cart.objects.filter(user=user).first()
            if not cart:
                raise serializers.ValidationError({"cart_id": "No cart found. Add an item before checking out."})
            attrs["cart_id"] = cart.id
        if attrs.get("address_id"):
            if not Address.objects.filter(pk=attrs["address_id"], user=user).exists():
                raise serializers.ValidationError({"address_id": "Address not found for this user."})
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        return OrderService.create_order(
            user_id=user.id,
            cart_id=validated_data["cart_id"],
            shipping_address=validated_data.get("shipping_address") or "",
            notes=validated_data.get("notes") or "",
            address_id=validated_data.get("address_id"),
        )


class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status", "notes", "shipping_address")


class EmptySerializer(serializers.Serializer):
    pass

class InitiatePaymentSerializer(serializers.Serializer):
    """Two-shape serializer used by ``PaymentViewSet.checkout``.

    Either:
    * ``{"order_id": <int>}`` — pay for an existing order owned by the user.
    * ``{"cart_id"?: <int>, "address_id"?: <int>, "shipping_address"?: str,
        "notes"?: str}`` — convert the user's cart into a fresh order and
        immediately initiate payment. When ``cart_id`` is omitted the user's
        current cart is auto-selected.
    """
    order_id = serializers.IntegerField(required=False)
    # Cart PK is a UUID in this project; accept either form.
    cart_id = serializers.CharField(required=False, allow_null=True)
    address_id = serializers.IntegerField(required=False, allow_null=True)
    shipping_address = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    notes = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    # Optional coupon code to apply at order creation. Validated by
    # `OrderService.create_order` against the Coupons app; invalid / expired
    # / below-minimum codes raise a `ValidationError` with a user-friendly
    # message that the checkout page surfaces as a toast.
    coupon_code = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=40
    )

    def validate_order_id(self, value):
        user = self.context["request"].user
        qs = Order.objects.filter(pk=value)
        if not user.is_staff:
            qs = qs.filter(user=user)
        if not qs.exists():
            raise serializers.ValidationError("Order not found.")
        return value

    def validate(self, attrs):
        # At least one of order_id or cart_id must resolve.
        if not attrs.get("order_id") and not attrs.get("cart_id"):
            user = self.context["request"].user
            cart = Cart.objects.filter(user=user).first()
            if not cart:
                raise serializers.ValidationError(
                    {"detail": "Provide order_id or add an item to your cart before checkout."}
                )
            attrs["cart_id"] = cart.id
        # If a cart_id was supplied, verify it belongs to the caller.
        if attrs.get("cart_id"):
            user = self.context["request"].user
            if not Cart.objects.filter(pk=attrs["cart_id"], user=user).exists():
                raise serializers.ValidationError({"cart_id": "Cart not found."})
        # If an address_id was supplied, verify it belongs to the caller.
        if attrs.get("address_id"):
            user = self.context["request"].user
            if not Address.objects.filter(pk=attrs["address_id"], user=user).exists():
                raise serializers.ValidationError({"address_id": "Address not found for this user."})
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id", "order", "amount", "currency", "status",
            "transaction_id", "gateway_response", "created_at", "updated_at",
        )
        read_only_fields = fields


class IPNPayloadSerializer(serializers.Serializer):
    tran_id = serializers.CharField(required=False, allow_blank=True)
    val_id = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)

    def to_internal_value(self, data):
        return dict(data or {})
