import pytest
from unittest.mock import patch
from rest_framework.test import APIRequestFactory
from brand.views import ShopifyViewSet
from brand.models import Product, Inventory

@pytest.mark.django_db
def test_inventory_sync():
    print("🧪 Testing Inventory Sync Logic...")
    
    # 1. Mock Shopify Data
    mock_products = [
        {
            "id": 999,
            "title": "Stock Test Product",
            "body_html": "<p>Test</p>",
            "variants": [
                {
                    "sku": "STOCK-TEST-001",
                    "price": "100.00",
                    "title": "Default",
                    "inventory_quantity": 42 # The Magic Number
                }
            ]
        }
    ]
    
    # 2. Simulate View Call
    factory = APIRequestFactory()
    request = factory.post('/api/brand/shopify/sync_products/')
    view = ShopifyViewSet.as_view({'post': 'sync_products'})
    
    print("🔄 Calling Sync Endpoint (Simulated)...")
    
    # Mock ShopifyService inside the view
    with patch('brand.shopify_service.ShopifyService') as MockService:
        instance = MockService.return_value
        instance.fetch_products.return_value = mock_products
        
        response = view(request)
        
    print(f"📡 API Response: {response.data}")
    
    # 3. Verify Database
    try:
        product = Product.objects.get(sku="STOCK-TEST-001")
        print(f"✅ Product Created: {product.name}")
        
        # Check Inventory
        inventory = Inventory.objects.get(product=product, location__name="Main Warehouse")
        print(f"📦 Inventory Record Found at {inventory.location.name}")
        print(f"🔢 Quantity: {inventory.quantity}")
        
        assert inventory.quantity == 42, f"❌ FAILURE: Expected 42, got {inventory.quantity}"
        print("🎉 SUCCESS: Inventory synced correctly!")
            
    except Product.DoesNotExist:
        pytest.fail("❌ FAILURE: Product not found.")
    except Inventory.DoesNotExist:
        pytest.fail("❌ FAILURE: Inventory record not created.")
    except Exception as e:
        pytest.fail(f"❌ ERROR: {e}")
