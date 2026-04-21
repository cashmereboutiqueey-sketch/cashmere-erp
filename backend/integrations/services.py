import logging
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from brand.models import Order, OrderItem, Product, Inventory, Location

logger = logging.getLogger(__name__)


class ShopifyService:
    @staticmethod
    @transaction.atomic
    def process_order_webhook(payload: dict):
        """
        Processes a Shopify 'orders/create' webhook.
        Creates Order, Items, and updates Inventory.
        Unknown SKUs are skipped (logged). Inventory never goes below zero.
        """
        shopify_id = str(payload.get('id'))
        order_number = str(payload.get('order_number'))
        email = payload.get('email', '')
        total_price = payload.get('total_price', 0)

        # Idempotency: skip if order already exists
        order, created = Order.objects.get_or_create(
            shopify_order_id=shopify_id,
            defaults={
                'order_number': order_number,
                'customer_email': email,
                'total_price': total_price,
                'status': Order.OrderStatus.PENDING,
            }
        )
        if not created:
            return order

        # Resolve Online location — fall back to first available, never crash
        online_location = Location.objects.filter(type=Location.LocationType.ONLINE).first()
        if not online_location:
            online_location = Location.objects.first()
        if not online_location:
            logger.error("No locations configured — cannot deduct inventory for order %s", shopify_id)

        for item in payload.get('line_items', []):
            sku = item.get('sku')
            quantity = int(item.get('quantity') or 0)
            price = item.get('price', 0)

            if not sku:
                logger.warning("Order %s: line item missing SKU, skipping.", shopify_id)
                continue

            try:
                product = Product.objects.get(sku=sku)
            except Product.DoesNotExist:
                logger.warning("Order %s: unknown SKU '%s', skipping line item.", shopify_id, sku)
                continue

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=price,
            )

            if online_location:
                inventory, _ = Inventory.objects.get_or_create(
                    product=product,
                    location=online_location,
                    defaults={'quantity': 0},
                )
                # Never go below zero — deduct only what is available
                deduct = min(quantity, max(inventory.quantity, 0))
                if deduct < quantity:
                    logger.warning(
                        "Insufficient stock for SKU %s at %s: requested %d, available %d",
                        sku, online_location.name, quantity, inventory.quantity
                    )
                inventory.quantity = max(inventory.quantity - quantity, 0)
                inventory.save()

        return order
