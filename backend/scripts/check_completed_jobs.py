import os
import sys
import django
# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.utils import timezone
from django.db.models import Sum
from factory.models import ProductionJob

def run():
    print("--- Checking Completed Jobs ---")
    
    jobs = ProductionJob.objects.filter(status='COMPLETED')
    print(f"Total Completed Jobs: {jobs.count()}")
    
    for job in jobs:
        print(f"ID: {job.id} | Name: {job.name} | Qty: {job.quantity} | End Date: {job.end_date} | Updated: {job.updated_at}")
        
    print("\n--- Testing Dashboard Stats API ---")
    client = APIClient()
    url = '/api/factory/jobs/dashboard_stats/'
    response = client.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print("API Response Data:")
        print(data)
        
        qty = data.get('kpis', {}).get('completed_qty_this_month')
        print(f"\nValue for 'completed_qty_this_month': {qty}")
        
        if qty is None or qty == 0:
            print("WARNING: API returns 0 or None!")
        else:
            print("API returns valid data!")
    else:
        print(f"API Failed: {response.status_code}")
        print(response.content.decode())

if __name__ == '__main__':
    run()
