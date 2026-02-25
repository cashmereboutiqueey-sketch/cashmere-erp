import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from brand.models import Location

def check_locations():
    locations = Location.objects.all()
    print(f"Total Locations: {locations.count()}")
    found = False
    for loc in locations:
        print(f"- ID: {loc.id}, Name: '{loc.name}', Type: {loc.type}")
        if loc.name == "Main Warehouse":
            found = True

    if not found:
        print("\n'Main Warehouse' not found. Creating it...")
        Location.objects.create(
            name="Main Warehouse",
            type="WAREHOUSE",
            address="Primary Storage"
        )
        print("Created 'Main Warehouse'.")
    else:
        print("\n'Main Warehouse' already exists.")

if __name__ == '__main__':
    check_locations()
