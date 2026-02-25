
import os
import django
import sys

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from factory.models import Worker
from decimal import Decimal

def run():
    print("Seeding Factory Workers...")
    
    workers = [
        {'name': 'Ahmed Mohamed', 'role': 'Cutter', 'rate': 50},
        {'name': 'Sara Ali', 'role': 'Tailor', 'rate': 60},
        {'name': 'Mahmoud Hassan', 'role': 'Finisher', 'rate': 45},
        {'name': 'Khaled Ibrahim', 'role': 'Quality Control', 'rate': 70}
    ]

    count = 0
    for w in workers:
        worker, created = Worker.objects.get_or_create(
            name=w['name'],
            defaults={
                'role': w['role'],
                'hourly_rate': Decimal(w['rate']),
                'active': True
            }
        )
        if created:
            print(f"Created: {worker.name}")
            count += 1
        else:
            print(f"Exists: {worker.name}")

    print(f"Done. Added {count} new workers.")

if __name__ == '__main__':
    run()
