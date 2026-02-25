import pytest
from rest_framework.test import APIClient
from factory.models import ProductionJob
from brand.models import Product, Location
from django.utils import timezone

@pytest.mark.django_db
def test_complete_api():
    print("--- Test API Complete Job ---")
    client = APIClient()
    
    # Ensure Warehouse Exists
    Location.objects.get_or_create(name="Main Warehouse", defaults={'type': 'WAREHOUSE'})
    
    # 1. Get/Create Job
    # Check for QC job first.
    job = ProductionJob.objects.filter(status='QC').first()
    if not job:
        print("Creating dummy QC job...")
        try:
             prod = Product.objects.first()
             if not prod:
                 # Create a dummy product if none exists
                 prod = Product.objects.create(name="Dummy Product", sku="DUMMY-001", retail_price=10)
                 
             job = ProductionJob.objects.create(
                name=f"API-TEST-{timezone.now().timestamp()}",
                product=prod,
                quantity=5,
                status='QC',
                qc_status='PASS'
            )
        except Exception as e:
            pytest.fail(f"Error creating job: {e}")
            
    print(f"Testing Job ID: {job.id}")
    
    # 2. Call API
    url = f'/api/factory/jobs/{job.id}/complete/'
    print(f"POST {url}")
    
    try:
        response = client.post(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("SUCCESS")
        else:
             pytest.fail(f"FAILURE - Non-200 Response: {response.content}")
             
    except Exception as e:
        pytest.fail(f"Exception calling API: {e}")
