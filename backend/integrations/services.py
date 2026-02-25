from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from brand.models import Order, OrderItem, Product, Inventory, Location

class ShopifyService:
    @staticmethod
    @transaction.atomic
    def process_order_webhook(payload: dict):
        """
        Processes a Shopify 'orders/create' webhook.
        Creates Order, Items, and updates Inventory.
        """
        shopify_id = str(payload.get('id'))
        order_number = str(payload.get('order_number'))
        email = payload.get('email')
        total_price = payload.get('total_price')

        # 1. Create or Update Order (Idempotency)
        order, created = Order.objects.get_or_create(
            shopify_order_id=shopify_id,
            defaults={
                'order_number': order_number,
                'customer_email': email,
                'total_price': total_price,
                'status': Order.OrderStatus.PENDING
            }
        )
        
        if not created:
            # Idempotency check: If order exists, maybe update status?
            # For now, just return existing to avoid duplication.
            return order

        # 2. Resolve "Online" Location for deduction
        # In a real app, this might come from the webhook's location_id map
        online_location = Location.objects.filter(type=Location.LocationType.ONLINE).first()
        if not online_location:
            # Fallback to any, or create one?
            # Let's assume one exists or fail.
            raise ObjectDoesNotExist("No 'Online' location configured for inventory deduction.")

        # 3. Process Line Items
        for item in payload.get('line_items', []):
            sku = item.get('sku')
            quantity = item.get('quantity')
            price = item.get('price')

            try:
                product = Product.objects.get(sku=sku)
            except Product.DoesNotExist:
                # Log error or skip? 
                # For strict data integrity, we should probably fail or flag "Unknown Product"
                # Raising error rolls back transaction.
                raise ObjectDoesNotExist(f"Product with SKU {sku} not found.")

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=price
            )

            # 4. Deduct Inventory (Real-time sync)
            # Find inventory at the source location
            inventory = Inventory.objects.filter(product=product, location=online_location).first()
            if inventory:
                inventory.quantity -= quantity
                inventory.save()
            else:
                # Stock record doesn't exist -> Create negative stock? 
                # Or assume 0 and go negative.
                Inventory.objects.create(
                    product=product,
                    location=online_location,
                    quantity=-quantity
                )

        return order
