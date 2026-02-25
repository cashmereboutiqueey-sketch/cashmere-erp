from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import json

class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    shopify_collection_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    last_synced_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Product(models.Model):
    """
    Finished Goods meant for sale.
    Linked to a Factory BOM (Recipe).
    """
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, help_text="Stock Keeping Unit")
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True, help_text="Barcode / EAN")
    description = models.TextField(blank=True)
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.TextField(blank=True, null=True, help_text="Shopify Image URL")
    
    # Grouping
    style = models.CharField(max_length=255, blank=True, null=True, help_text="Group Name (e.g. T-Shirt) for variants")
    
    # Variants
    size = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    
    # Financials
    retail_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    standard_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Factory Sell Price (Materials + Labor + Factory Margin)"
    )
    
    # Factory Pricing Components
    factory_margin = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Factory Profit Margin %")
    
    # Brand Pricing Components
    brand_overhead = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Marketing & Ops Overhead per unit")
    brand_profit_margin = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Brand Profit Margin %")

    # Shopify Sync
    shopify_product_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    shopify_variant_id = models.CharField(max_length=100, blank=True, null=True)
    last_synced_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.barcode:
            # Simple unique generation: Timestamp-ish or just ID based (needs ID first)
            # If no ID, save first then update? Or use random?
            # Let's use a random 8 digit number for simplicity and check uniqueness, or 
            # just use SKU if numeric.
            # Cashmere-specific: "200" + SKU or generated ID.
            # Using random for now to ensure we populate it.
            import random
            self.barcode = "".join([str(random.randint(0, 9)) for _ in range(12)]) 
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        variant_info = f" - {self.size}/{self.color}" if self.size or self.color else ""
        return f"{self.name} ({self.sku}){variant_info}"

class Location(models.Model):
    """
    Physical or logical locations for stock.
    e.g. Main Warehouse, Alexandria Showroom.
    """
    class LocationType(models.TextChoices):
        WAREHOUSE = 'WAREHOUSE', _('Warehouse')
        SHOWROOM = 'SHOWROOM', _('Showroom')
        ONLINE = 'ONLINE', _('Online/Virtual')
        EVENT = 'EVENT', _('Event / Pop-up')

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=LocationType.choices)
    address = models.TextField(blank=True)
    shopify_location_id = models.CharField(max_length=100, blank=True, help_text="Shopify API ID")

    def __str__(self) -> str:
        return self.name

class Inventory(models.Model):
    """
    Finished Goods stock at a specific location.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='stock')
    quantity = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('product', 'location')
        verbose_name_plural = "Inventory"

    def __str__(self) -> str:
        return f"{self.product.sku} @ {self.location.name}: {self.quantity}"

class Customer(models.Model):
    """
    Retail Customers.
    """
    class Tier(models.TextChoices):
        STANDARD = 'STANDARD', _('Standard')
        VIP = 'VIP', _('VIP')
        VVIP = 'VVIP', _('VVIP')
        ELITE = 'ELITE', _('Elite')

    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    
    # Clienteling Fields
    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.STANDARD)
    sizing_profile = models.JSONField(default=dict, blank=True, help_text="e.g. {'top': 'M', 'shoe': '42'}")
    style_preferences = models.TextField(blank=True, help_text="Comma-separated tags e.g. 'Streetwear, Minimalist'")
    birth_date = models.DateField(null=True, blank=True)
    ltv_score = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Lifetime Value")
    
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    current_debt = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.phone}) [{self.tier}]"

class CustomerInteraction(models.Model):
    """
    Log of interactions with a customer (Call, Visit, Message).
    """
    class InteractionType(models.TextChoices):
        CALL = 'CALL', _('Phone Call')
        WHATSAPP = 'WHATSAPP', _('WhatsApp')
        VISIT = 'VISIT', _('Store Visit')
        PURCHASE = 'PURCHASE', _('Purchase')
        OTHER = 'OTHER', _('Other')

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='interactions')
    type = models.CharField(max_length=20, choices=InteractionType.choices, default=InteractionType.OTHER)
    notes = models.TextField(blank=True)
    staff_member = models.CharField(max_length=100, help_text="Name of staff who interacted")
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.get_type_display()} with {self.customer.name} on {self.date.strftime('%Y-%m-%d')}"

class ShippingManifest(models.Model):
    """
    A daily batch of orders handed over to a courier.
    """
    courier = models.CharField(max_length=50, choices=[('BOSTA', 'Bosta'), ('ARAMEX', 'Aramex'), ('QUIGO', 'QuiGo'), ('OTHER', 'Other')], default='QUIGO')
    date = models.DateTimeField(auto_now_add=True)
    driver_name = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='manifests/', blank=True, null=True, help_text="Photo of signed manifest")
    
    def __str__(self):
        return f"Manifest #{self.id} - {self.courier} - {self.date.strftime('%Y-%m-%d')}"

class Order(models.Model):
    """
    Sales Orders from Shopify, POS, or Manual.
    """
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        PENDING_PRODUCTION = 'PENDING_PRODUCTION', _('Pending Production')
        READY = 'READY', _('Ready')
        PAID = 'PAID', _('Paid')
        FULFILLED = 'FULFILLED', _('Fulfilled')
        RETURNED = 'RETURNED', _('Returned')
        CANCELLED = 'CANCELLED', _('Cancelled')
        
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', _('Cash')
        VISA = 'VISA', _('Visa')
        INSTAPAY = 'INSTAPAY', _('Instapay')
        DEPOSIT = 'DEPOSIT', _('Deposit/Credit')

    class ShippingCompany(models.TextChoices):
        PENDING = 'PENDING', _('Pending/None')
        BOSTA = 'BOSTA', _('Bosta')
        ARAMEX = 'ARAMEX', _('Aramex')
        MYLERZ = 'MYLERZ', _('Mylerz')
        MANUAL = 'MANUAL', _('Private Rep')
        OTHER = 'OTHER', _('Other')

    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    shopify_order_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    order_number = models.CharField(max_length=50, unique=True)
    customer_email = models.EmailField(blank=True, null=True)
    
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Global Order Discount")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Global Order Discount")
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)
    
    # Shipping / Logistics
    class DetailedStatus(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        READY_TO_SHIP = 'READY_TO_SHIP', _('Ready to Ship')
        SHIPPED = 'SHIPPED', _('Shipped')
        DELIVERED = 'DELIVERED', _('Delivered')
        RETURNED = 'RETURNED', _('Returned')
        PARTIAL_DELIVERY = 'PARTIAL_DELIVERY', _('Partial Delivery')
        REFUSED = 'REFUSED', _('Refused')
        LOST = 'LOST', _('Lost')

    detailed_status = models.CharField(max_length=30, choices=DetailedStatus.choices, default=DetailedStatus.DRAFT)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Actual cost charged by courier")
    manifest = models.ForeignKey(ShippingManifest, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    # Copilot: Payment Details
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    is_fully_paid = models.BooleanField(default=False)
    
    # Fulfillment Details
    shipping_company = models.CharField(max_length=20, choices=ShippingCompany.choices, default=ShippingCompany.PENDING)
    notes = models.TextField(blank=True, help_text="Order notes (from POS or Manager)")
    
    # Internal Flags
    inventory_deducted = models.BooleanField(default=False, help_text="True if stock has been removed")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random
            import string
            suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            self.order_number = f"ORD-{suffix}"
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Order #{self.order_number}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    item_discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Discount per line (total)")
    returned_quantity = models.PositiveIntegerField(default=0, help_text="Quantity returned by customer")

    def __str__(self) -> str:
        return f"{self.quantity}x {self.product.sku} in #{self.order.order_number}"

class ShopifyConfig(models.Model):
    """
    Singleton configuration for Shopify Integration.
    """
    shop_url = models.CharField(max_length=255, help_text="e.g. my-store.myshopify.com")
    access_token = models.CharField(max_length=255, help_text="Admin API Access Token (shpat_...)")
    is_active = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.pk and ShopifyConfig.objects.exists():
            # If we try to save a new one but one exists, prevent it? 
            # Or simplified: just return existing? 
            # Better: This is a restriction logic, fine for now.
            pass 
        return super(ShopifyConfig, self).save(*args, **kwargs)

    def __str__(self):
        return f"Shopify Config for {self.shop_url}"

