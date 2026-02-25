from django.urls import path
from .views import ShopifyOrderWebhook

urlpatterns = [
    path('shopify/orders/create/', ShopifyOrderWebhook.as_view(), name='shopify_order_webhook'),
]
