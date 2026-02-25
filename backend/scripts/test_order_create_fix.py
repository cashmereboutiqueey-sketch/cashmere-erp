import pytest
from decimal import Decimal
from brand.models import Order, Customer

@pytest.mark.django_db
def test_order_creation():
    print("Testing Order Creation Fix...")
    
    # 1. Create Dummy Customer
    customer, _ = Customer.objects.get_or_create(
        phone="01000000000",
        defaults={'name': "Test Customer"}
    )
    
    # 2. Try to create Order with fixed arguments
    try:
        # Cleanup mock order if exists
        Order.objects.filter(shopify_order_id="TEST_SHOPIFY_123").delete()
        
        order = Order.objects.create(
            shopify_order_id="TEST_SHOPIFY_123",
            order_number="#TEST-123",
            customer=customer,
            customer_email="test@example.com",
            total_price=Decimal("1500.00"),
            status=Order.OrderStatus.PAID,
            payment_method=Order.PaymentMethod.VISA
        )
        print(f"✅ PASSED: Order created successfully: {order}")
        
    except Exception as e:
        pytest.fail(f"❌ FAILED: Order creation failed: {e}")
