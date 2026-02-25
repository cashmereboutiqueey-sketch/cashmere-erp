import os
import sys
import django
from django.db.models import Count

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from factory.models import ProductionJob
from django.utils import timezone
import datetime

print(f"Current Time: {timezone.now()}")

print("\n--- Job Counts by Status ---")
counts = ProductionJob.objects.values('status').annotate(total=Count('id'))
for c in counts:
    print(f"{c['status']}: {c['total']}")

print("\n--- Completed Jobs (Last 30 Days) ---")
last_30 = timezone.now().date() - datetime.timedelta(days=30)
completed = ProductionJob.objects.filter(status='COMPLETED', end_date__gte=last_30)
print(f"Filter: status='COMPLETED', end_date >= {last_30}")

if completed.exists():
    for job in completed:
        print(f"Job: {job.name} | Date: {job.end_date} | Qty: {job.quantity}")
else:
    print("NO completed jobs found in this period.")

print("\n--- Data Integrity Check ---")
# Check for jobs that are completed but missing end_date
invalid = ProductionJob.objects.filter(status='COMPLETED', end_date__isnull=True)
if invalid.exists():
    print(f"WARNING: {invalid.count()} jobs are COMPLETED but have NO end_date! This is likely the bug.")
    for job in invalid:
        print(f" - {job.name} (ID: {job.id})")
else:
    print("All completed jobs have valid end_dates.")
