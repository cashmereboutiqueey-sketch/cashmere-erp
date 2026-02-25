import pytest
import time
from rest_framework.test import APIRequestFactory
from brand.views import OrderViewSet
from brand.models import Product, Order, OrderItem, Location, Inventory

@pytest.mark.django_db
def test_return_process():
    print("🔄 Testing Returns Process...")
    
    # 1. Setup Data
    # Ensure Product and Stock
    product, _ = Product.objects.get_or_create(sku="RET-TEST-001", defaults={'name': 'Return Test Item', 'retail_price': 100})
    loc, _ = Location.objects.get_or_create(name="Main Warehouse", defaults={'type': 'WAREHOUSE'})
    
    # Set initial Stock = 10
    Inventory.objects.update_or_create(product=product, location=loc, defaults={'quantity': 10})
    
    # 2. Create an Order (Qty: 2)
    timestamp = int(time.time())
    order = Order.objects.create(
        order_number=f"ORD-RET-{product.id}-{timestamp}",
        location=loc,
        total_price=200,
        status='PAID'
    )
    item = OrderItem.objects.create(
        order=order,
        product=product,
        quantity=2,
        unit_price=100
    )
    print(f"📦 Created Order {order.order_number} with 2x {product.sku}")
    
    # 3. Process Return (Qty: 1)
    print("🔙 processing Return for 1 Item (with Restock)...")
    
    factory = APIRequestFactory()
    payload = {
        'items': [{'id': item.id, 'quantity': 1}],
        'restock': True
    }
    request = factory.post(f'/api/brand/orders/{order.id}/return_items/', payload, format='json')
    view = OrderViewSet.as_view({'post': 'return_items'})
    
    response = view(request, pk=order.id)
    print(f"📡 API Response: {response.data}")
    
    # 4. Verify Results
    
    # Check Item State
    item.refresh_from_db()
    
    # Check Stock
    inv = Inventory.objects.get(product=product, location=loc)
    
    assert response.status_code == 200, f"Return Failed: {response.data}"
    
    print(f"✅ Return Successful. Refund: {response.data.get('refund_amount')}")
    
    assert item.returned_quantity == 1, f"Item returned_quantity incorrect: {item.returned_quantity}"
    assert inv.quantity == 11, f"Inventory check failed. Expected 11, got {inv.quantity}"
    print(f"✅ Inventory Restocked Correctly (11)")
