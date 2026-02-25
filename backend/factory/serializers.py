from rest_framework import serializers
from .models import Supplier, RawMaterial, BOM, BOMItem, ProductionJob, MaterialPurchase, SupplierPayment, Worker, WorkerAttendance, ProductionLog

class FinancialMaskMixin:
    """
    Mixin to hide financial fields for non-privileged users.
    """
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            return self.mask_fields(data)

        # Allowed roles
        allowed_groups = ['Admin', 'Accountant', 'General Manager']
        user_groups = request.user.groups.values_list('name', flat=True)
        
        if request.user.is_superuser or any(g in allowed_groups for g in user_groups):
            return data
            
        return self.mask_fields(data)

    def mask_fields(self, data):
        # Fields to always mask if unauthorized
        SENSITIVE_FIELDS = [
            'hourly_rate', 'total_pay', 'amount', 'amount_paid', 'total_cost', 
            'cost_per_unit', 'cost'
        ]
        
        for field in SENSITIVE_FIELDS:
            if field in data:
                data[field] = None
        return data

class WorkerSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = '__all__'

class WorkerAttendanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)
    
    class Meta:
        model = WorkerAttendance
        fields = ['id', 'worker', 'worker_name', 'date', 'hours_worked', 'notes', 'created_at']

class ProductionLogSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)
    job_name = serializers.CharField(source='job.name', read_only=True)
    
    class Meta:
        model = ProductionLog
        fields = ['id', 'worker', 'worker_name', 'job', 'job_name', 'quantity', 'date', 'created_at']

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class MaterialPurchaseSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    raw_material_name = serializers.CharField(source='raw_material.name', read_only=True)
    
    class Meta:
        model = MaterialPurchase
        fields = '__all__'
        read_only_fields = ['total_cost']

class SupplierPaymentSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = SupplierPayment
        fields = '__all__'

class RawMaterialSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = RawMaterial
        fields = '__all__'

class BOMItemSerializer(FinancialMaskMixin, serializers.ModelSerializer):
    raw_material_name = serializers.CharField(source='raw_material.name', read_only=True)
    unit = serializers.CharField(source='raw_material.unit', read_only=True)
    cost = serializers.DecimalField(source='raw_material.cost_per_unit', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = BOMItem
        fields = ['id', 'raw_material', 'raw_material_name', 'quantity', 'waste_percentage', 'unit', 'cost']

class BOMSerializer(serializers.ModelSerializer):
    items = BOMItemSerializer(many=True)

    class Meta:
        model = BOM
        fields = ['id', 'product', 'items', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        bom = BOM.objects.create(**validated_data)
        for item_data in items_data:
            BOMItem.objects.create(bom=bom, **item_data)
        return bom

class ProductionJobSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    source_order_number = serializers.CharField(source='source_order.order_number', read_only=True)

    class Meta:
        model = ProductionJob
        fields = '__all__'
