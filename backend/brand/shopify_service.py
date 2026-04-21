import requests
from django.conf import settings
from .models import ShopifyConfig, Product, Category

class ShopifyService:
    def __init__(self):
        self.config = ShopifyConfig.objects.first()
        if not self.config:
            raise Exception("Shopify Configuration not found")
        if not self.config.is_active:
            raise Exception("Shopify integration is not active.")

        shop_url = self.config.shop_url.replace("https://", "").replace("http://", "").strip("/")

        self.base_url = f"https://{shop_url}/admin/api/2024-01"
        self.headers = {
            "X-Shopify-Access-Token": self.config.access_token,
            "Content-Type": "application/json"
        }

    def test_connection(self):
        """Test connection and return shop info dict."""
        url = f"{self.base_url}/shop.json"
        response = requests.get(url, headers=self.headers)
        if response.status_code != 200:
            raise Exception(f"Connection Failed ({response.status_code}): {response.text}")
        return response.json()['shop']

    def verify_credentials(self):
        """Test connection to Shopify (returns True on success)."""
        self.test_connection()
        return True

    def fetch_products(self):
        """Fetch all products from Shopify."""
        url = f"{self.base_url}/products.json?limit=250"
        products = []
        
        while url:
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch products ({response.status_code}): {response.text}")
                
            data = response.json()
            products.extend(data.get('products', []))
            
            # Pagination
            link_header = response.headers.get('Link')
            url = None
            if link_header:
                links = link_header.split(',')
                for link in links:
                    if 'rel="next"' in link:
                        url = link.split(';')[0].strip('<> ')
        
        return products

    def fetch_orders(self, since=None):
        """Fetch orders since a given datetime."""
        url = f"{self.base_url}/orders.json?status=any&limit=250"
        if since:
            url += f"&created_at_min={since.isoformat()}"
            
        orders = []
        
        while url:
            # Note: Pagination logic is same as products
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch orders ({response.status_code}): {response.text}")
                
            data = response.json()
            orders.extend(data.get('orders', []))
            
            link_header = response.headers.get('Link')
            url = None
            if link_header:
                links = link_header.split(',')
                for link in links:
                    if 'rel="next"' in link:
                        url = link.split(';')[0].strip('<> ')
                        
        return orders

    def fetch_marketing_events(self):
        """Fetch marketing events (Ads) from Shopify."""
        url = f"{self.base_url}/marketing_events.json"
        response = requests.get(url, headers=self.headers)
        if response.status_code != 200:
            print(f"Marketing API warning: {response.text}")
            return []
        return response.json().get('marketing_events', [])

    def create_product(self, product: 'Product'):
        """Push a local Product to Shopify and save back the shopify_product_id."""
        url = f"{self.base_url}/products.json"
        payload = {
            "product": {
                "title": product.name,
                "body_html": getattr(product, 'description', ''),
                "vendor": "CASHMERE",
                "product_type": product.category.name if product.category else "General",
                "variants": [
                    {
                        "price": str(product.retail_price),
                        "sku": product.sku,
                        "barcode": product.barcode,
                        "inventory_management": "shopify",
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
        if getattr(product, 'image_url', None):
            payload["product"]["images"] = [{"src": product.image_url}]

        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 201:
            data = response.json()['product']
            product.shopify_product_id = str(data['id'])
            product.shopify_variant_id = str(data['variants'][0]['id'])
            from django.utils import timezone
            product.last_synced_at = timezone.now()
            product.save()
            return data
        raise Exception(f"Failed to create product: {response.text}")

    def create_collection(self, category: 'Category'):
        """Create a Shopify custom collection for a local Category."""
        url = f"{self.base_url}/custom_collections.json"
        payload = {
            "custom_collection": {
                "title": category.name,
                "body_html": getattr(category, 'description', ''),
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
        raise Exception(f"Failed to create collection: {response.text}")

    def add_product_to_collection(self, shopify_product_id, shopify_collection_id):
        """Link a Shopify product to a collection (ignores 422 duplicate errors)."""
        url = f"{self.base_url}/collects.json"
        payload = {
            "collect": {
                "product_id": int(shopify_product_id),
                "collection_id": int(shopify_collection_id)
            }
        }
        requests.post(url, headers=self.headers, json=payload)
