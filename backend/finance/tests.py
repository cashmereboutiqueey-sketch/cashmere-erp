import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from finance.models import FinancialTransaction

@pytest.mark.django_db
def test_pnl_view():
    client = APIClient()
    
    # 1. Create Data
    FinancialTransaction.objects.create(
        type=FinancialTransaction.TransactionType.TRANSFER_TO_BRAND,
        reference_id="JOB-TEST",
        amount=Decimal('500.00'),
        description="Test Transfer"
    )
    
    # 2. Call API
    response = client.get('/api/finance/pnl/')
    data = response.json()
    
    # 3. Verify
    assert response.status_code == 200
    assert data['factory']['revenue'] == 500.00
    assert data['brand']['cogs'] == 500.00
