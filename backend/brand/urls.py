from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, LocationViewSet, InventoryViewSet, OrderViewSet, CustomerViewSet, AnalyticsViewSet, ShopifyViewSet, CustomerInteractionViewSet, CategoryViewSet, ShippingManifestViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'interactions', CustomerInteractionViewSet)
router.register(r'analytics', AnalyticsViewSet, basename='brand-analytics')
router.register(r'shopify', ShopifyViewSet, basename='shopify')
router.register(r'categories', CategoryViewSet)
router.register(r'shipping-manifests', ShippingManifestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
