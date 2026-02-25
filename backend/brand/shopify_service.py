import requests
from django.conf import settings
from .models import ShopifyConfig

class ShopifyService:
    def __init__(self):
        self.config = ShopifyConfig.objects.first()
        if not self.config:
            raise Exception("Shopify Configuration not found")
        
        # Clean URL (remove protocol if present)
        shop_url = self.config.shop_url.replace("https://", "").replace("http://", "").strip("/")
        
        self.base_url = f"https://{shop_url}/admin/api/2024-01"
        self.headers = {
            "X-Shopify-Access-Token": self.config.access_token,
            "Content-Type": "application/json"
        }

    def verify_credentials(self):
        """Test connection to Shopify."""
        url = f"{self.base_url}/shop.json"
        response = requests.get(url, headers=self.headers)
        if response.status_code != 200:
            raise Exception(f"Connection Failed ({response.status_code}): {response.text}")
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
             # Fail softly as this might be a permission issue or not used
             print(f"Marketing API warning: {response.text}")
             return []
        return response.json().get('marketing_events', [])
