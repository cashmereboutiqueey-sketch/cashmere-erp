import uuid
import datetime
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F
from django.db import transaction
from decimal import Decimal
from .models import FinancialTransaction, Treasury
from .serializers import FinancialTransactionSerializer, TreasurySerializer
from core.permissions import HasFinanceAccess


class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer
    permission_classes = [IsAuthenticated, HasFinanceAccess]

    @action(detail=False, methods=['post'])
    def transfer_to_main(self, request):
        amount = Decimal(request.data.get('amount', '0.00'))
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=400)

        with transaction.atomic():
            # Lock both rows to prevent concurrent transfer race conditions
            daily_treasury = Treasury.objects.select_for_update().filter(
                type=Treasury.TreasuryType.DAILY
            ).first()
            main_treasury = Treasury.objects.select_for_update().filter(
                type=Treasury.TreasuryType.MAIN
            ).first()

            if not daily_treasury:
                return Response({'error': 'Daily Treasury not configured'}, status=400)
            if not main_treasury:
                return Response({'error': 'Main Treasury not configured'}, status=400)
            if daily_treasury.balance < amount:
                return Response({'error': 'Insufficient funds in Daily Treasury'}, status=400)

            base_ref = f'TRF-{uuid.uuid4().hex[:8].upper()}'
            daily_treasury.balance -= amount
            daily_treasury.save()
            FinancialTransaction.objects.create(
                type=FinancialTransaction.TransactionType.INTERNAL_TRANSFER,
                module=FinancialTransaction.ModuleType.BRAND,
                category='Transfer to Main',
                treasury=daily_treasury,
                amount=-amount,
                reference_id=f'{base_ref}-OUT',
                description=f"Transfer to {main_treasury.name}"
            )

            main_treasury.balance += amount
            main_treasury.save()
            FinancialTransaction.objects.create(
                type=FinancialTransaction.TransactionType.INTERNAL_TRANSFER,
                module=FinancialTransaction.ModuleType.BRAND,
                category='Received from Daily',
                treasury=main_treasury,
                amount=amount,
                reference_id=f'{base_ref}-IN',
                description=f"Transfer from {daily_treasury.name}"
            )

        return Response({'status': 'success', 'new_daily_balance': daily_treasury.balance})


class FinancialTransactionViewSet(viewsets.ModelViewSet):
    queryset = FinancialTransaction.objects.all().order_by('-created_at')
    serializer_class = FinancialTransactionSerializer
    filterset_fields = ['type', 'module', 'treasury']
    permission_classes = [IsAuthenticated, HasFinanceAccess]

    def perform_create(self, serializer):
        item = serializer.save()
        if item.treasury:
            TT = FinancialTransaction.TransactionType
            if item.type in (TT.EXPENSE, TT.INTERNAL_TRANSFER, TT.INTERCOMPANY_PAYMENT):
                item.treasury.balance -= item.amount
            elif item.type in (TT.SALE_REVENUE, TT.TRANSFER_TO_BRAND):
                item.treasury.balance += item.amount
            item.treasury.save()


class PnLView(APIView):
    permission_classes = [IsAuthenticated, HasFinanceAccess]

    def get(self, request):
        TT = FinancialTransaction.TransactionType
        MT = FinancialTransaction.ModuleType

        # Inter-company: amount factory charged brand for finished goods (= brand COGS)
        cogs = FinancialTransaction.objects.filter(
            type=TT.TRANSFER_TO_BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Brand revenue from direct sales only (excludes FACTORY inter-company entries)
        brand_revenue = FinancialTransaction.objects.filter(
            type=TT.SALE_REVENUE,
            module=MT.BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Operating expenses (rent, salaries, marketing, etc.)
        total_expenses = FinancialTransaction.objects.filter(
            type=TT.EXPENSE
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        gross_profit = brand_revenue - cogs
        net_profit = gross_profit - total_expenses

        return Response({
            "factory": {
                "revenue": float(cogs),
                "cogs": float(cogs),
            },
            "brand": {
                "revenue": float(brand_revenue),
                "cogs": float(cogs),
                "gross_profit": float(gross_profit),
            },
            "group": {
                "net_profit": float(net_profit),
                "total_expenses": float(total_expenses),
            }
        })


class MetricsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, HasFinanceAccess]

    @action(detail=False, methods=['get'])
    def brand(self, request):
        TT = FinancialTransaction.TransactionType
        MT = FinancialTransaction.ModuleType

        today = datetime.date.today()
        first_of_month = today.replace(day=1)
        # Last month range
        if today.month == 1:
            first_of_last_month = today.replace(year=today.year - 1, month=12, day=1)
            last_of_last_month = today.replace(day=1) - datetime.timedelta(days=1)
        else:
            first_of_last_month = today.replace(month=today.month - 1, day=1)
            last_of_last_month = first_of_month - datetime.timedelta(days=1)

        total_revenue = FinancialTransaction.objects.filter(
            type=TT.SALE_REVENUE, module=MT.BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        current_month_revenue = FinancialTransaction.objects.filter(
            type=TT.SALE_REVENUE, module=MT.BRAND, date__gte=first_of_month
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        last_month_revenue = FinancialTransaction.objects.filter(
            type=TT.SALE_REVENUE, module=MT.BRAND,
            date__gte=first_of_last_month, date__lte=last_of_last_month
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        cogs = FinancialTransaction.objects.filter(
            type=TT.TRANSFER_TO_BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        marketing_spend = FinancialTransaction.objects.filter(
            type=TT.EXPENSE, category='Marketing'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        from brand.models import Customer, Order, Inventory
        thirty_days_ago = today - datetime.timedelta(days=30)
        new_customers = Customer.objects.filter(created_at__date__gte=thirty_days_ago).count()
        total_orders = Order.objects.filter(status__in=['PAID', 'FULFILLED']).count()
        returned_orders = Order.objects.filter(status='RETURNED').count()

        cac = float(marketing_spend / new_customers) if new_customers > 0 else 0
        roas = float(total_revenue / marketing_spend) if marketing_spend > 0 else 0
        aov = float(total_revenue / total_orders) if total_orders > 0 else 0

        # Revenue growth % vs last month
        if last_month_revenue > 0:
            rev_growth = float((current_month_revenue - last_month_revenue) / last_month_revenue * 100)
            rev_growth_str = f"{rev_growth:+.1f}%"
            rev_trend = "up" if rev_growth >= 0 else "down"
        else:
            rev_growth_str = "N/A"
            rev_trend = "neutral"

        # Gross profit margin
        if total_revenue > 0:
            gpm = float((total_revenue - cogs) / total_revenue * 100)
            gpm_str = f"{gpm:.1f}%"
        else:
            gpm_str = "N/A"

        # Average LTV (average total_spent across all customers)
        from django.db.models import Avg
        avg_ltv = Customer.objects.aggregate(avg=Avg('total_spent'))['avg'] or Decimal('0.00')

        # Return rate
        if total_orders > 0:
            return_rate = float(returned_orders / (total_orders + returned_orders) * 100)
            return_rate_str = f"{return_rate:.1f}%"
        else:
            return_rate_str = "N/A"

        brand_inventory_value = Inventory.objects.aggregate(
            total=Sum(F('quantity') * F('product__standard_cost'))
        )['total'] or Decimal('0.00')

        metrics = [
            {"title": "Total Revenue", "value": f"EGP {total_revenue:,.2f}", "category": "Financial Performance", "trend": "up"},
            {"title": "Revenue Growth", "value": rev_growth_str, "subtext": "vs Last Month", "category": "Financial Performance", "trend": rev_trend},
            {"title": "Gross Profit Margin", "value": gpm_str, "subtext": "Revenue minus COGS", "category": "Profitability", "trend": "neutral"},
            {"title": "Inventory Value", "value": f"EGP {brand_inventory_value:,.2f}", "subtext": "Unsold Finished Goods", "category": "Financial Position", "trend": "neutral"},
            {"title": "CAC", "value": f"EGP {cac:,.2f}", "subtext": "Cost per Acquisition (30d)", "category": "Growth & Marketing", "trend": "down"},
            {"title": "Avg LTV", "value": f"EGP {avg_ltv:,.2f}", "subtext": "Avg Customer Lifetime Value", "category": "Growth & Marketing", "trend": "up"},
            {"title": "ROAS", "value": f"{roas:.1f}x" if roas else "N/A", "subtext": "Return on Ad Spend", "category": "Growth & Marketing", "trend": "up"},
            {"title": "AOV", "value": f"EGP {aov:,.2f}", "subtext": "Avg Order Value", "category": "Sales Efficiency", "trend": "up"},
            {"title": "Conversion Rate", "value": "N/A", "subtext": "Requires web analytics", "category": "Sales Efficiency", "trend": "neutral"},
            {"title": "Return Rate", "value": return_rate_str, "subtext": "Orders Returned", "category": "Customer Satisfaction", "trend": "down"},
            {"title": "NPS", "value": "N/A", "subtext": "Requires survey data", "category": "Customer Satisfaction", "trend": "neutral"},
        ]

        return Response(metrics)

    @action(detail=False, methods=['get'])
    def intercompany_summary(self, request):
        TT = FinancialTransaction.TransactionType

        # Total value factory produced and transferred to brand (brand's accumulated COGS/payable)
        total_produced = FinancialTransaction.objects.filter(
            type=TT.TRANSFER_TO_BRAND,
            module=FinancialTransaction.ModuleType.BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Total brand has auto-paid factory when selling
        total_settled = FinancialTransaction.objects.filter(
            type=TT.INTERCOMPANY_PAYMENT,
            module=FinancialTransaction.ModuleType.BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        net_owed = total_produced - total_settled

        return Response({
            'total_produced_value': float(total_produced),
            'total_settled': float(total_settled),
            'brand_owes_factory': float(net_owed),
        })

    @action(detail=False, methods=['get'])
    def factory(self, request):
        TT = FinancialTransaction.TransactionType
        MT = FinancialTransaction.ModuleType

        raw_materials = FinancialTransaction.objects.filter(
            module=MT.FACTORY, category='Raw Material'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        labor = FinancialTransaction.objects.filter(
            module=MT.FACTORY, category='Salaries'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        total_cogs = raw_materials + labor

        opex = FinancialTransaction.objects.filter(
            module=MT.FACTORY, type=TT.EXPENSE
        ).exclude(category__in=['Raw Material', 'Salaries']).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        from factory.models import ProductionJob, RawMaterial
        units_produced = ProductionJob.objects.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('quantity'))['total'] or 0

        rejected_units = ProductionJob.objects.filter(
            qc_status='REJECT'
        ).aggregate(total=Sum('quantity'))['total'] or 0

        unit_cost = float(total_cogs / units_produced) if units_produced > 0 else 0
        defect_rate = float(rejected_units / units_produced * 100) if units_produced > 0 else 0

        inventory_value = RawMaterial.objects.aggregate(
            total=Sum(F('current_stock') * F('cost_per_unit'))
        )['total'] or Decimal('0.00')

        labor_pct = float(labor / total_cogs * 100) if total_cogs > 0 else 0

        # Inventory turnover = COGS / inventory_value
        if inventory_value > 0 and total_cogs > 0:
            inv_turnover = float(total_cogs / inventory_value)
            days_on_hand = float(365 / inv_turnover) if inv_turnover > 0 else 0
            inv_turnover_str = f"{inv_turnover:.1f}"
            days_on_hand_str = f"{days_on_hand:.0f}"
        else:
            inv_turnover_str = "N/A"
            days_on_hand_str = "N/A"

        metrics = [
            {"title": "COGS", "value": f"EGP {total_cogs:,.2f}", "subtext": "Materials + Labor", "category": "Cost Structure", "trend": "neutral"},
            {"title": "Unit Cost", "value": f"EGP {unit_cost:,.2f}", "subtext": "Per Item Produced", "category": "Cost Structure", "trend": "down"},
            {"title": "Labor Cost %", "value": f"{labor_pct:.1f}%", "subtext": "% of Total COGS", "category": "Cost Structure", "trend": "neutral"},
            {"title": "Defect Rate", "value": f"{defect_rate:.1f}%", "subtext": "Target: <1%", "category": "Quality Control", "trend": "down"},
            {"title": "OEE", "value": "N/A", "subtext": "Requires equipment sensors", "category": "Operational Efficiency", "trend": "neutral"},
            {"title": "Capacity Utilization", "value": "N/A", "subtext": "Requires capacity baseline", "category": "Operational Efficiency", "trend": "neutral"},
            {"title": "Inv Value", "value": f"EGP {inventory_value:,.2f}", "subtext": "Raw Material Assets", "category": "Inventory Health", "trend": "neutral"},
            {"title": "Inv Turnover", "value": inv_turnover_str, "subtext": "Turns per Year", "category": "Inventory Health", "trend": "up"},
            {"title": "Days on Hand", "value": days_on_hand_str, "subtext": "Avg Inventory Age", "category": "Inventory Health", "trend": "neutral"},
        ]

        return Response(metrics)
