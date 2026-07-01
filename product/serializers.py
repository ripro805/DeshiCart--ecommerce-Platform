from rest_framework import serializers
from django.db.models import Avg
from .models import Product, Category, Review
from decimal import Decimal


# class ProductSerializer(serializers.Serializer):
#     id = serializers.IntegerField(read_only=True)
#     name = serializers.CharField(max_length=200)
#     unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, source='price')
#     price_with_tax = serializers.SerializerMethodField(method_name='calculate_price_with_tax')
#     # category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
#     # category=serializers.StringRelatedField()  # Use the __str__ method of Category for representation
#     category=serializers.HyperlinkedRelatedField(view_name='category-detail', read_only=True)  # Hyperlinked representation
#     def calculate_price_with_tax(self, product):
#         return product.price * Decimal('1.1')  # Assuming 10% tax

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']


class ProductSerializer(serializers.ModelSerializer):
    price_with_tax = serializers.SerializerMethodField(method_name='calculate_price_with_tax')
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'brand',
            'short_description', 'description',
            'price', 'discounted_price',
            'stock', 'image', 'image_external_url', 'image_url',
            'gallery', 'specifications', 'tags',
            'rating', 'total_reviews',
            'category', 'price_with_tax', 'average_rating', 'review_count',
        ]

    def calculate_price_with_tax(self, product):
        return product.price * Decimal('1.1')  # Assuming 10% tax

    def get_image_url(self, product):
        request = self.context.get('request')
        # Prefer the curated external URL (used by seeded products).
        if product.image_external_url:
            return product.image_external_url
        # Otherwise fall back to the locally uploaded image, if any.
        if not product.image:
            return None
        url = product.image.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_average_rating(self, product):
        agg = product.review_set.aggregate(avg=Avg('ratings'))
        avg = agg.get('avg')
        if avg is None:
            return 0
        # Return a plain float rounded to 2dp for the frontend.
        return float(round(avg, 2))

    def get_review_count(self, product):
        return product.review_set.count()

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be positive.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Name cannot be empty.")
        if len(value) < 3:
            raise serializers.ValidationError("Name must be at least 3 characters.")
        return value

    # def validate(self, attrs):
    #     price = attrs.get('price', 0)
    #     stock = attrs.get('stock', 0)
    #     if price > 10000 and stock > 100:
    #         raise serializers.ValidationError("If price is very high, stock should not exceed 100.")
    #     return attrs

    # def create(self, validated_data):
    #     category_id = self.initial_data.get('category')
    #     category = None
    #     if category_id:
    #         category = Category.objects.get(pk=category_id)
    #     product = Product.objects.create(
    #         name=validated_data['name'],
    #         description=validated_data.get('description', ''),
    #         price=validated_data['price'],
    #         stock=validated_data['stock'],
    #         image=validated_data.get('image', None),
    #         category=category
    #     )
    #     return product


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(method_name='get_user')
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'product', 'ratings', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'product']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
            'address': obj.user.address,
            'phone_number': obj.user.phone_number,
        }

    def create(self, validated_data):
        product_id = self.context['product_id']
        return Review.objects.create(product_id=product_id, **validated_data)
