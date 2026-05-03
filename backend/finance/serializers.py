from rest_framework import serializers
from .models import FinancialTransaction, Treasury, ProductCosting, FactoryOverhead


class TreasurySerializer(serializers.ModelSerializer):
    class Meta:
        model = Treasury
        fields = '__all__'


class FinancialTransactionSerializer(serializers.ModelSerializer):
    treasury_name = serializers.CharField(source='treasury.name', read_only=True)

    class Meta:
        model = FinancialTransaction
        fields = '__all__'


class ProductCostingSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    raw_material_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    true_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    transfer_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductCosting
        fields = '__all__'


class FactoryOverheadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FactoryOverhead
        fields = '__all__'
