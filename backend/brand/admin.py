from django.contrib import admin
from .models import Product, Category, Location, Inventory, Order, OrderItem, Customer, ShopifyConfig, CustomerInteraction

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'retail_price', 'category', 'shopify_product_id', 'last_synced_at')
    search_fields = ('name', 'sku', 'barcode')
    list_filter = ('category', 'created_at')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'shopify_collection_id', 'last_synced_at')

@admin.register(ShopifyConfig)
class ShopifyConfigAdmin(admin.ModelAdmin):
    list_display = ('shop_url', 'is_active', 'last_sync_at')
    
admin.site.register(Location)
admin.site.register(Inventory)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Customer)
admin.site.register(CustomerInteraction)
