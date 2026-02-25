import pytest
from unittest.mock import MagicMock, patch
from rest_framework.test import APIRequestFactory
from brand.views import ShopifyViewSet
from brand.models import Product, ShopifyConfig

@pytest.mark.django_db
def test_full_sync_flow():
    print("🚀 Starting Full Sync Simulation...")
    
    # 1. Setup Config
    ShopifyConfig.objects.all().delete()
    ShopifyConfig.objects.create(shop_url="test.myshopify.com", access_token="shpat_test")
    
    # 2. Mock Shopify Response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "products": [
            {
                "id": 101,
                "title": "Simulation T-Shirt",
                "body_html": "<strong>Best T-Shirt</strong>",
                "variants": [
                    {"id": 201, "sku": "SIM-TS-S", "price": "20.00", "title": "Small"},
                    {"id": 202, "sku": "SIM-TS-M", "price": "20.00", "title": "Medium"}
                ]
            }
        ]
    }
    
    # 3. Simulate View Call with Patch
    factory = APIRequestFactory()
    request = factory.post('/api/brand/shopify/sync_products/')
    view = ShopifyViewSet.as_view({'post': 'sync_products'})
    
    print("🔄 Calling Sync Endpoint (Simulated)...")
    
    with patch('requests.get', return_value=mock_response):
        response = view(request)
        
    # 4. Analyze Results
    print(f"📡 API Response: {response.data}")
    
    if response.status_code == 200 and response.data.get('imported') == 2:
        print("✅ API reported success (2 imported).")
    else:
        pytest.fail(f"❌ API reported failure or wrong count: {response.data}")

    # 5. Verify Database Grouping
    products = Product.objects.filter(style="Simulation T-Shirt")
    count = products.count()
    
    print(f"📦 Database Check: Found {count} products with style 'Simulation T-Shirt'")
    for p in products:
        print(f"   - SKU: {p.sku} | Name: {p.name}")
        
    assert count == 2, "❌ FAILURE: Grouping did not work as expected."
    print("🎉 SUCCESS: Full flow verified! Grouping works.")
