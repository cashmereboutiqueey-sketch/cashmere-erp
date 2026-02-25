import pytest
from unittest.mock import patch
from rest_framework.test import APIRequestFactory
from brand.views import ShopifyViewSet
from brand.models import Product

@pytest.mark.django_db
def test_image_sync():
    print("🖼️ Testing Image Sync Logic...")
    
    # 1. Mock Shopify Data with Image
    mock_products = [
        {
            "id": 888,
            "title": "Imagine Dragon T-Shirt",
            "body_html": "<p>Cool</p>",
            "image": {
                "src": "https://cdn.shopify.com/s/files/1/0000/0000/products/test.jpg"
            },
            "variants": [
                {
                    "sku": "IMG-001",
                    "price": "500.00",
                    "title": "Default",
                    "inventory_quantity": 10
                }
            ]
        }
    ]
    
    # 2. Simulate View Call
    factory = APIRequestFactory()
    request = factory.post('/api/brand/shopify/sync_products/')
    view = ShopifyViewSet.as_view({'post': 'sync_products'})
    
    print("🔄 Calling Sync Endpoint (Simulated)...")
    
    with patch('brand.shopify_service.ShopifyService') as MockService:
        instance = MockService.return_value
        instance.fetch_products.return_value = mock_products
        
        response = view(request)
        
    print(f"📡 API Response: {response.data}")
    
    # 3. Verify Database
    try:
        product = Product.objects.get(sku="IMG-001")
        print(f"✅ Product Created: {product.name}")
        print(f"🖼️ Image URL: {product.image_url}")
        
        assert product.image_url == "https://cdn.shopify.com/s/files/1/0000/0000/products/test.jpg", \
            f"❌ FAILURE: Expected valid URL, got {product.image_url}"
        
        print("🎉 SUCCESS: Image URL synced correctly!")
            
    except Product.DoesNotExist:
        pytest.fail("❌ FAILURE: Product not found.")
