import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from brand.models import Location

def ensure_warehouse():
    print("Checking for Warehouse...")
    warehouse = Location.objects.filter(type=Location.LocationType.WAREHOUSE).first()
    
    if warehouse:
        print(f"✅ Warehouse Found: {warehouse.name} (ID: {warehouse.id})")
    else:
        print("❌ No Warehouse Found! Creating one now...")
        warehouse = Location.objects.create(
            name="Main Warehouse",
            type=Location.LocationType.WAREHOUSE,
            address="Primary Storage Facility"
        )
        print(f"✅ Created Warehouse: {warehouse.name} (ID: {warehouse.id})")

if __name__ == "__main__":
    ensure_warehouse()
