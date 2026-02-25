import os
import sys
import django
import datetime
from decimal import Decimal

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from brand.models import Order, Inventory
from finance.models import FinancialTransaction
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate
from django.utils import timezone

def test_dashboard():
    print("--- Starting Dashboard Debug ---")
    try:
        filters = {'status': Order.OrderStatus.PAID}
        
        print("1. Calculating Revenue...")
        revenue = Order.objects.filter(**filters).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')
        print(f"Revenue: {revenue}")

        print("2. Calculating Expenses...")
        expense_filters = {
            'module': FinancialTransaction.ModuleType.BRAND,
            'type__in': [FinancialTransaction.TransactionType.EXPENSE, FinancialTransaction.TransactionType.TRANSFER_TO_BRAND]
        }
        expenses = FinancialTransaction.objects.filter(**expense_filters).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        print(f"Expenses: {expenses}")

        print("3. Calculating Trends...")
        trend_filters = {'status': Order.OrderStatus.PAID}
        trend_filters['created_at__date__gte'] = timezone.now().date() - datetime.timedelta(days=7)
        
        trend_data = Order.objects.filter(**trend_filters).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            revenue=Sum('total_price')
        ).order_by('date')
        print(f"Trend Data Count: {len(trend_data)}")

        print("4. Calculating Top Products...")
        top_products = [
            {
                'name': i['items__product__name'],
                'sku': i['items__product__sku'],
                'quantity': i['total_qty'],
                'revenue': i['total_rev_correct']
            }
            for i in Order.objects.filter(items__isnull=False, **filters).values(
                'items__product__name', 'items__product__sku'
            ).annotate(
                total_qty=Sum('items__quantity'),
                total_rev_correct=Sum(F('items__quantity') * F('items__unit_price'))
            ).order_by('-total_rev_correct')[:5]
        ]
        print(f"Top Products: {top_products}")
        
        print("--- SUCCESS: No Errors Found ---")

    except Exception as e:
        print(f"\n!!! ERROR DETECTED !!!")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_dashboard()
