from rest_framework import serializers
from .models import Product, Location, Inventory, Order, OrderItem, Customer, ShopifyConfig, CustomerInteraction, Category, ShippingManifest
from django.db import models

class FinancialMaskMixin:
    """
    Mixin to hide financial fields for non-privileged users.
    """
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            return self.mask_fields(data)

        # Allowed roles
        allowed_groups = ['Admin', 'Accountant', 'General Manager']
        user_groups = request.user.groups.values_list('name', flat=True)
        
        if request.user.is_superuser or any(g in allowed_groups for g in user_groups):
            return data
            
        return self.mask_fields(data)

    def mask_fields(self, data):
        # Fields to always mask if unauthorized
        SENSITIVE_FIELDS = [
            'retail_price', 'standard_cost', 'factory_margin', 'brand_overhead', 
            'brand_profit_margin', 'cost_per_unit', 'total_price', 'amount_paid', 
            'unit_price', 'item_discount', 'revenue', 'profit', 'product_cost', 
            'product_price', 'total_rev', 'total_rev_correct', 'shipping_cost', 'discount'
        ]
        
        for field in SENSITIVE_FIELDS:
            if field in data:
                data[field] = None # Or 0, but None is clearer "No Access"
        return data

class ShopifyConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopifyConfig
        fields = ['id', 'shop_url', 'access_token', 'is_active', 'last_sync_at']
        extra_kwargs = {'access_token': {'write_only': True}} # Security

class ShippingManifestSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(source='orders.count', read_only=True)
    
    class Meta:
        model = ShippingManifest
        fields = '__all__'

class CategorySerializer(FinancialMaskMixin, serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    
    items_sold = serializers.IntegerField(read_only=True, default=0)
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)

    class Meta:
        model = Category
        fields = '__all__'

class LiteProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'barcode', 'image']

class ProductSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    # Include inventory details (read-only) to see stock per location in frontend
    inventory = serializers.SerializerMethodField()
    
    # Production Analytics (populated by view annotations)
    total_produced = serializers.IntegerField(read_only=True, default=0)
    total_sold = serializers.IntegerField(read_only=True, default=0)
    stock_remaining = serializers.IntegerField(read_only=True, default=0)

    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

    def get_inventory(self, obj):
        # Return a list of {location_id: X, quantity: Y}
        # Use prefetched objects to avoid N+1 queries
        return [{'location': inv.location_id, 'quantity': inv.quantity} for inv in obj.inventory.all()]

class CustomerInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerInteraction
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    interactions = CustomerInteractionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'

class LocationSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    units_sold = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Location
        fields = '__all__'

class InventorySerializer(FinancialMaskMixin, serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    # Financials for Valuation
    product_cost = serializers.DecimalField(source='product.standard_cost', max_digits=10, decimal_places=2, read_only=True)
    product_price = serializers.DecimalField(source='product.retail_price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = Inventory
        fields = '__all__'

class OrderItemSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'
        extra_kwargs = {'order': {'read_only': True}}

class OrderSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        extra_kwargs = {
            'order_number': {'read_only': True}
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Update Order fields
        instance.status = validated_data.get('status', instance.status)
        instance.total_price = validated_data.get('total_price', instance.total_price)
        instance.amount_paid = validated_data.get('amount_paid', instance.amount_paid)
        instance.is_fully_paid = validated_data.get('is_fully_paid', instance.is_fully_paid)
        instance.payment_method = validated_data.get('payment_method', instance.payment_method)
        instance.customer = validated_data.get('customer', instance.customer)
        instance.location = validated_data.get('location', instance.location)
        instance.save()
        
        # Handle Items Update (Full replacement strategy for simplicity)
        if items_data:
            instance.items.all().delete()
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)
                
        return instance
