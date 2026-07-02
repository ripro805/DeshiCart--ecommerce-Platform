from django.contrib import admin
from .models import (
    Category, SubCategory, Brand, Attribute, Tag, Product, Review, StockLog,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_featured", "order")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "slug", "order")
    list_filter = ("category",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "color")
    prepopulated_fields = {"slug": ("name",)}


class StockLogInline(admin.TabularInline):
    model = StockLog
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "brand", "price", "discounted_price", "stock", "is_active", "is_featured")
    list_filter = ("category", "brand_ref", "is_active", "is_featured")
    search_fields = ("name", "sku", "brand")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [StockLogInline]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("name", "product", "ratings", "status", "created_at")
    list_filter = ("status", "ratings")
    search_fields = ("name", "comment")
