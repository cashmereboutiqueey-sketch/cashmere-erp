import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from brand.models import Product, Location, Inventory, Order

@pytest.mark.django_db
def test_shopify_order_webhook():
    client = APIClient()
    
    # 1. Setup Data
    product = Product.objects.create(name="Test Item", sku="TEST-SKU", retail_price=100)
    location = Location.objects.create(name="Online Store", type=Location.LocationType.ONLINE)
    Inventory.objects.create(product=product, location=location, quantity=10)
    
    # 2. Payload
    payload = {
        "id": 123456,
        "order_number": "1001",
        "email": "customer@example.com",
        "total_price": "200.00",
        "line_items": [
            {
                "sku": "TEST-SKU",
                "quantity": 2,
                "price": "100.00"
            }
        ]
    }
    
    # 3. POST Webhook
    response = client.post('/api/webhooks/shopify/orders/create/', payload, format='json')
    
    assert response.status_code == 200
    
    # 4. Verify DB
    order = Order.objects.get(order_number="1001")
    assert order.customer_email == "customer@example.com"
    assert order.items.count() == 1
    
    # 5. Verify Inventory Deduction
    inv = Inventory.objects.get(product=product, location=location)
    assert inv.quantity == 8 # 10 - 2
