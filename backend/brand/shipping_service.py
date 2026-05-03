import logging

logger = logging.getLogger(__name__)


class ShippingService:
    """
    Stub for external courier integration. Returns mock responses until
    a real API (Bosta, Aramex, etc.) is configured via settings.
    """

    def send_order(self, order):
        payload = {
            "external_order_id": order.order_number,
            "customer": {
                "name": order.customer.name if order.customer else order.customer_email,
                "phone": order.customer.phone if order.customer else None,
                "email": order.customer_email or (order.customer.email if order.customer else None),
            },
            "items": [
                {
                    "sku": item.product.sku,
                    "name": item.product.name,
                    "quantity": item.quantity,
                    "price": float(item.unit_price),
                }
                for item in order.items.all()
            ],
            "total_price": float(order.total_price),
            "cod_amount": (
                float(order.total_price) - float(order.amount_paid)
                if order.payment_method == "CASH"
                else 0.0
            ),
        }

        logger.info("Shipping API stub: order %s payload=%s", order.order_number, payload)

        return {
            "success": True,
            "tracking_number": f"MOCK-TRACK-{order.order_number}",
            "message": "Mock: replace ShippingService.send_order() with real courier API.",
        }
