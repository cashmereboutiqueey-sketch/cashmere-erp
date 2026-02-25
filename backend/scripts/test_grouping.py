import pytest
from brand.models import Product

@pytest.mark.django_db
def test_product_grouping_logic():
    print("Testing Product Grouping Logic...")
    
    # Simulate Shopify Sync Logic
    shopify_title = "Cool T-Shirt"
    variants = [
        {'title': 'Small', 'sku': 'TS-S', 'price': '10.00'},
        {'title': 'Medium', 'sku': 'TS-M', 'price': '10.00'},
    ]
    
    for v in variants:
        title = shopify_title
        name = f"{title} ({v.get('title')})"
        
        product, created = Product.objects.update_or_create(
            sku=v['sku'],
            defaults={
                'name': name,
                'style': title, # This is the key logic
                'retail_price': v['price']
            }
        )
        print(f"Saved: {product.name} -> Style: {product.style}")

    # Verify Database State
    s_variants = Product.objects.filter(style="Cool T-Shirt")
    count = s_variants.count()
    
    assert count == 2, f"❌ FAILED: Expected 2 variants, found {count}"
    print(f"✅ PASSED: Found {count} variants grouped under style 'Cool T-Shirt'")
