from rest_framework import serializers
from .models import FinancialTransaction, Treasury

class TreasurySerializer(serializers.ModelSerializer):
    class Meta:
        model = Treasury
        fields = '__all__'

class FinancialTransactionSerializer(serializers.ModelSerializer):
    treasury_name = serializers.CharField(source='treasury.name', read_only=True)
    
    class Meta:
        model = FinancialTransaction
        fields = '__all__'
