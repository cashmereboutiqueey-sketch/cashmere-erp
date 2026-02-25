import pytest
import traceback
from factory.models import ProductionJob
from brand.models import Product, Location
from django.utils import timezone

@pytest.mark.django_db
def test_complete_job_logic():
    print("--- Test Complete Job ---")
    
    # Ensure Warehouse Exists
    Location.objects.get_or_create(name="Main Warehouse", defaults={'type': 'WAREHOUSE'})
    
    # 1. Find a candidate job (QC or IN_PROGRESS)
    job = ProductionJob.objects.filter(status__in=['QC', 'IN_PROGRESS']).first()
    
    if not job:
        print("No active job found. Creating a DUMMY job...")
        try:
            prod = Product.objects.first()
            if not prod:
                prod = Product.objects.create(name="Dummy Product", sku="DUMMY-002", retail_price=10)

            job = ProductionJob.objects.create(
                name=f"TEST-JOB-{timezone.now().timestamp()}",
                product=prod,
                quantity=10,
                status='QC',
                qc_status='PASS'
            )
            print(f"Created Dummy Job: {job}")
        except Exception as e:
            pytest.fail(f"Failed to create dummy job: {e}")

    print(f"Target Job: {job} (ID: {job.id}, Status: {job.status})")
    
    # 2. Attempt Complete
    try:
        print("Calling complete_production()...")
        job.complete_production()
        print("SUCCESS! Job completed.")
    except Exception as e:
        traceback.print_exc()
        pytest.fail(f"Error: {e}")
