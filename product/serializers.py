from rest_framework import serializers
from django.db.models import Avg
from .models import Product, Category, SubCategory, Brand, Attribute, Tag, Review, StockLog
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
        fields = ['id', 'name', 'slug', 'description', 'image',
                  'is_featured', 'is_active', 'order', 'product_count']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Coalesce None -> False so the admin pill renders correctly.
        data['is_active'] = bool(data.get('is_active'))
        data['is_featured'] = bool(data.get('is_featured'))
        return data


class ProductSerializer(serializers.ModelSerializer):
    price_with_tax = serializers.SerializerMethodField(method_name='calculate_price_with_tax')
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    tags = serializers.JSONField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'brand',
            'short_description', 'description',
            'price', 'discounted_price',
            'stock', 'low_stock_threshold',
            'image', 'image_external_url', 'image_url',
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
        agg = product.reviews.aggregate(avg=Avg('ratings'))
        avg = agg.get('avg')
        if avg is None:
            return 0
        # Return a plain float rounded to 2dp for the frontend.
        return float(round(avg, 2))

    def get_review_count(self, product):
        return product.reviews.count()

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

    def validate_gallery(self, value):
        """Gallery must be a list of {url: str, alt: str} objects.

        Defaults to an empty list when the field is absent so callers can
        omit the key entirely instead of sending ``[]``.
        """
        if value in (None, ""):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("gallery must be a list.")
        cleaned = []
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f"gallery[{idx}] must be an object with 'url' and 'alt'."
                )
            url = item.get("url")
            alt = item.get("alt", "")
            if not isinstance(url, str) or not url:
                raise serializers.ValidationError(
                    f"gallery[{idx}].url must be a non-empty string."
                )
            if not isinstance(alt, str):
                raise serializers.ValidationError(
                    f"gallery[{idx}].alt must be a string."
                )
            cleaned.append({"url": url, "alt": alt})
        return cleaned

    def validate_specifications(self, value):
        """Specifications must be an object mapping string keys to JSON-ish
        scalars/objects. Anything else is rejected."""
        if value in (None, ""):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("specifications must be an object.")
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


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ("id", "category", "name", "slug", "order")


class BrandSerializer(serializers.ModelSerializer):
    # Brand model exposes ``logo`` (URLField). A ``logo_url`` alias is
    # provided via SerializerMethodField so DRF never ghosts an attribute
    # that does not exist on the model.
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "slug",
            "logo",
            "logo_url",
            "description",
            "is_active",
        )

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(obj.logo)
        return obj.logo


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "slug", "color")


class AttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        fields = ("id", "name", "slug", "values")


class StockLogSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)

    class Meta:
        model = StockLog
        fields = (
            "id",
            "product",
            "product_name",
            "change",
            "reason",
            "note",
            "created_by",
            "created_by_email",
            "created_at",
        )
        read_only_fields = ("created_by", "created_at")


class AdminProductSerializer(serializers.ModelSerializer):
    """Full product representation for the admin panel."""

    image_url = serializers.SerializerMethodField()
    subcategory = SubCategorySerializer(read_only=True)
    brand_ref = BrandSerializer(read_only=True)
    tags = serializers.JSONField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "brand",
            "brand_ref",
            "category",
            "subcategory",
            "short_description",
            "description",
            "price",
            "cost_price",
            "discounted_price",
            "stock",
            "low_stock_threshold",
            "is_active",
            "is_featured",
            "image",
            "image_external_url",
            "image_url",
            "gallery",
            "specifications",
            "tags",
            "average_rating",
            "review_count",
            "rating",
            "total_reviews",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def get_image_url(self, product):
        if product.image_external_url:
            return product.image_external_url
        if not product.image:
            return None
        request = self.context.get("request")
        url = product.image.url
        return request.build_absolute_uri(url) if request else url

    def get_average_rating(self, product):
        agg = product.reviews.aggregate(avg=Avg("ratings"))
        return float(round(agg.get("avg") or 0, 2))

    def get_review_count(self, product):
        return product.reviews.count()

    def validate_gallery(self, value):
        """Same gallery shape contract as the storefront serializer."""
        if value in (None, ""):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("gallery must be a list.")
        cleaned = []
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f"gallery[{idx}] must be an object with 'url' and 'alt'."
                )
            url = item.get("url")
            alt = item.get("alt", "")
            if not isinstance(url, str) or not url:
                raise serializers.ValidationError(
                    f"gallery[{idx}].url must be a non-empty string."
                )
            if not isinstance(alt, str):
                raise serializers.ValidationError(
                    f"gallery[{idx}].alt must be a string."
                )
            cleaned.append({"url": url, "alt": alt})
        return cleaned

    def validate_specifications(self, value):
        """Same specifications shape contract as the storefront serializer."""
        if value in (None, ""):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("specifications must be an object.")
        return value

class AdminReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_first_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    user_avatar = serializers.CharField(source="user.avatar", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "user_email",
            "user_first_name",
            "user_last_name",
            "user_avatar",
            "product",
            "product_name",
            "product_sku",
            "product_image_url",
            "ratings",
            "comment",
            "status",
            "verified_purchase",
            "helpful_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "user",
            "user_email",
            "user_first_name",
            "user_last_name",
            "user_avatar",
            "product",
            "product_name",
            "product_sku",
            "product_image_url",
            "verified_purchase",
            "helpful_count",
            "created_at",
            "updated_at",
        )

    def get_product_image_url(self, review):
        """Reuse ProductSerializer.get_image_url logic so admin sees the same
        thumbnail the storefront would show."""
        product = review.product
        if not product:
            return None
        if product.image_external_url:
            return product.image_external_url
        if not product.image:
            return None
        request = self.context.get("request")
        url = product.image.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url
