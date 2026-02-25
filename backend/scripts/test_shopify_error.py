import pytest
from brand.shopify_service import ShopifyService
from brand.models import ShopifyConfig as ConfigModel

@pytest.mark.django_db
def test_shopify_error():
    """
    Test ShopifyService error handling when configuration is invalid.
    """
    print("Testing Shopify Error Handling...")
    
    # ensure no config or bad config
    ConfigModel.objects.all().delete()
    ConfigModel.objects.create(
        shop_url="test-store.myshopify.com",
        access_token="invalid_token_123"
    )
    
    # Test 1: verify_credentials should fail
    try:
        service = ShopifyService()
        print(f"Service initialized with URL: {service.base_url}")
        
        print("Attempting to verify credentials (should fail)...")
        service.verify_credentials()
        pytest.fail("verify_credentials should have raised an exception but didn't.")
        
    except Exception as e:
        print(f"✅ PASSED: Caught expected exception: {e}")

    # Test 2: fetch_products should fail
    try:
        print("Attempting to fetch products (should fail)...")
        service.fetch_products()
        pytest.fail("fetch_products should have raised an exception but didn't.")
    except Exception as e:
        print(f"✅ PASSED: Caught expected exception: {e}")
