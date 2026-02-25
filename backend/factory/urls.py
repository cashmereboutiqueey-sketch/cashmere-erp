from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet, RawMaterialViewSet, BOMViewSet, ProductionJobViewSet, 
    MaterialPurchaseViewSet, SupplierPaymentViewSet,
    WorkerViewSet, WorkerAttendanceViewSet, ProductionLogViewSet
)

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'materials', RawMaterialViewSet)
router.register(r'boms', BOMViewSet)
router.register(r'jobs', ProductionJobViewSet)
router.register(r'purchases', MaterialPurchaseViewSet)
router.register(r'payments', SupplierPaymentViewSet)
router.register(r'workers', WorkerViewSet)
router.register(r'attendance', WorkerAttendanceViewSet)
router.register(r'production-logs', ProductionLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
