from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PnLView, FinancialTransactionViewSet, TreasuryViewSet, MetricsViewSet

router = DefaultRouter()
router.register(r'transactions', FinancialTransactionViewSet)
router.register(r'treasury', TreasuryViewSet)
router.register(r'metrics', MetricsViewSet, basename='metrics')

urlpatterns = [
    path('', include(router.urls)),
    path('pnl/', PnLView.as_view(), name='pnl-summary'),
]
