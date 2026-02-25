import requests
import json
from django.conf import settings
from brand.models import ShopifyConfig, Product, Category

class ShopifyService:
    def __init__(self):
        config = ShopifyConfig.objects.first()
        if not config or not config.is_active:
            raise Exception("Shopify Integration is not configured or active.")
        
        self.shop_url = config.shop_url.replace("https://", "").rstrip("/")
        self.access_token = config.access_token
        self.base_url = f"https://{self.shop_url}/admin/api/2024-01"
        self.headers = {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }

    def test_connection(self):
        url = f"{self.base_url}/shop.json"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()['shop']
        else:
            raise Exception(f"Connection Failed: {response.text}")

    def create_product(self, product: Product):
        url = f"{self.base_url}/products.json"
        
        # Prepare Variants logic (mapping sizes/colors)
        # simplified for now: 1 variant if no explicit variants logic in model yet
        # But wait, Product model has 'color' and 'size' fields acting as variants.
        # Ideally, we group by 'Style' to make a Shopify Product with variants.
        # For now, let's assume 1:1 sync for Phase 1 or simple variants.
        
        # Payload
        payload = {
            "product": {
                "title": product.name,
                "body_html": product.description,
                "vendor": "CASHMERE",
                "product_type": product.category.name if product.category else "General",
                "variants": [
                    {
                        "price": str(product.retail_price),
                        "sku": product.sku,
                        "barcode": product.barcode,
                        "inventory_management": "shopify", 
                        # We will need to push inventory levels separately to InventoryItem API
                        # or let Shopify track it. For now, let's just set basic info.
                        "option1": product.size or "Default Title",
                        "option2": product.color or "",
                    }
                ],
                "options": [
                    {"name": "Size"},
                    {"name": "Color"}
                ]
            }
        }
        
        if product.image_url:
            payload["product"]["images"] = [{"src": product.image_url}]
            
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code == 201:
            data = response.json()['product']
            product.shopify_product_id = str(data['id'])
            product.shopify_variant_id = str(data['variants'][0]['id']) # basic assumption
            from django.utils import timezone
            product.last_synced_at = timezone.now()
            product.save()
            return data
        else:
            raise Exception(f"Failed to create product: {response.text}")

    def create_collection(self, category: Category):
        url = f"{self.base_url}/custom_collections.json"
        payload = {
            "custom_collection": {
                "title": category.name,
                "body_html": category.description,
                "published": True
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code == 201:
            data = response.json()['custom_collection']
            category.shopify_collection_id = str(data['id'])
            from django.utils import timezone
            category.last_synced_at = timezone.now()
            category.save()
            return data
        else:
            raise Exception(f"Failed to create collection: {response.text}")

    def add_product_to_collection(self, shopify_product_id, shopify_collection_id):
        url = f"{self.base_url}/collects.json"
        payload = {
            "collect": {
                "product_id": int(shopify_product_id),
                "collection_id": int(shopify_collection_id)
            }
        }
        requests.post(url, headers=self.headers, json=payload)
        # We generally ignore if it already exists (422)
