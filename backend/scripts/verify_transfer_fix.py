
import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from factory.models import ProductionJob
from brand.models import Product, Location, Inventory

def verify_fix():
    print("Verifying QC Transfer Fix...")
    
    # 1. Setup Test Data
    product, _ = Product.objects.get_or_create(name="Test Product", sku="TEST-SKU-999")
    location, _ = Location.objects.get_or_create(name="Main Warehouse", type=Location.LocationType.WAREHOUSE)
    
    # Ensure inventory is 0
    Inventory.objects.filter(product=product, location=location).delete()
    
    # 2. Create Job
    job = ProductionJob.objects.create(
        name="JOB-TEST-TRANSFER",
        product=product,
        quantity=10,
        status=ProductionJob.JobStatus.QC,
        qc_status=ProductionJob.QCStatus.PASS
    )
    print(f"Created Job: {job} with quantity {job.quantity}")

    # 3. Complete Production (Trigger Transfer)
    print("Completing Production...")
    job.complete_production()
    
    # 4. Verify Inventory
    inv = Inventory.objects.get(product=product, location=location)
    print(f"Inventory Quantity: {inv.quantity}")
    
    if inv.quantity == 10:
        print("SUCCESS: Inventory updated correctly!")
    else:
        print(f"FAILURE: Expected 10, got {inv.quantity}")

if __name__ == '__main__':
    try:
        verify_fix()
    except Exception as e:
        print(f"Error: {e}")
