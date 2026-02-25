import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class ShippingService:
    """
    Service to handle integration with external shipping company (Sherket El Sha7n).
    Currently implemented as a Mock integration.
    """
    
    def __init__(self):
        # In a real scenario, we would load API keys from settings here
        # self.api_url = settings.SHIPPING_API_URL
        # self.api_key = settings.SHIPPING_API_KEY
        pass

    def send_order(self, order):
        """
        Sends order details to the shipping company.
        
        Args:
            order (Order): The order instance to ship.
            
        Returns:
            dict: Response from the shipping API or mock response.
        """
        try:
            # Construct Payload
            payload = {
                "external_order_id": order.order_number,
                "customer": {
                    "name": order.customer.name if order.customer else order.customer_email,
                    "phone": order.customer.phone if order.customer else None,
                    "email": order.customer_email or (order.customer.email if order.customer else None),
                    # "address": ... (Add address field if available in Order/Location)
                },
                "items": [
                    {
                        "sku": item.product.sku,
                        "name": item.product.name,
                        "quantity": item.quantity,
                        "price": float(item.unit_price)
                    } for item in order.items.all()
                ],
                "total_price": float(order.total_price),
                "cod_amount": float(order.total_price) - float(order.amount_paid) if order.payment_method == 'CASH' else 0.0
            }

            # TODO: Replace with actual API call when details are provided
            # response = requests.post(self.api_url, json=payload, headers={"Authorization": self.api_key})
            # response.raise_for_status()
            
            # Mock Success
            logger.info(f"Shipping API Mock: Sent Order {order.order_number} with payload: {payload}")
            print(f"--- MOCK SHIPPING API CALL ---\nPayload: {payload}\n------------------------------")
            
            return {
                "success": True,
                "tracking_number": f"MOCK-TRACK-{order.order_number}",
                "message": "Order successfully registered with shipping provider"
            }

        except Exception as e:
            logger.error(f"Failed to send order {order.order_number} to shipping: {str(e)}")
            raise e
