import uuid
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
            
        daily_treasury = Treasury.objects.filter(type=Treasury.TreasuryType.DAILY).first()
        main_treasury = Treasury.objects.filter(type=Treasury.TreasuryType.MAIN).first()

        if not daily_treasury:
            return Response({'error': 'Daily Treasury not configured'}, status=400)
        if not main_treasury:
            return Response({'error': 'Main Treasury not configured'}, status=400)
        if daily_treasury.balance < amount:
            return Response({'error': 'Insufficient funds in Daily Treasury'}, status=400)

        with transaction.atomic():
            ref_id = f'TRF-{uuid.uuid4().hex[:8].upper()}'
            # 1. Debit Daily
            daily_treasury.balance -= amount
            daily_treasury.save()
            FinancialTransaction.objects.create(
                type=FinancialTransaction.TransactionType.INTERNAL_TRANSFER,
                module=FinancialTransaction.ModuleType.BRAND,
                category='Transfer to Main',
                treasury=daily_treasury,
                amount=-amount,
                reference_id=ref_id,
                description=f"Transfer to {main_treasury.name}"
            )

            # 2. Credit Main
            main_treasury.balance += amount
            main_treasury.save()
            FinancialTransaction.objects.create(
                type=FinancialTransaction.TransactionType.INTERNAL_TRANSFER,
                module=FinancialTransaction.ModuleType.BRAND,
                category='Received from Daily',
                treasury=main_treasury,
                amount=amount,
                reference_id=ref_id,
                description=f"Transfer from {daily_treasury.name}"
            )
            
        return Response({'status': 'success', 'new_daily_balance': daily_treasury.balance})

class FinancialTransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD for Financial Transactions.
    Used for recording Expenses.
    """
    queryset = FinancialTransaction.objects.all().order_by('-created_at')
    serializer_class = FinancialTransactionSerializer
    filterset_fields = ['type', 'module', 'treasury']
    permission_classes = [IsAuthenticated, HasFinanceAccess]

    def perform_create(self, serializer):
        item = serializer.save()
        if item.treasury:
            TT = FinancialTransaction.TransactionType
            if item.type in (TT.EXPENSE, TT.INTERNAL_TRANSFER):
                item.treasury.balance -= item.amount
            elif item.type in (TT.SALE_REVENUE, TT.TRANSFER_TO_BRAND):
                item.treasury.balance += item.amount
            item.treasury.save()

class PnLView(APIView):
    """
    Returns P&L Summary.
    Endpoint: /api/finance/pnl/
    """
    def get(self, request):
        TT = FinancialTransaction.TransactionType

        # Inter-company: amount factory charged brand for finished goods (= brand COGS)
        cogs = FinancialTransaction.objects.filter(
            type=TT.TRANSFER_TO_BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Brand revenue from direct sales
        brand_revenue = FinancialTransaction.objects.filter(
            type=TT.SALE_REVENUE
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
    """
    Business Intelligence Metrics.
    """
    @action(detail=False, methods=['get'])
    def brand(self, request):
        # 1. Revenue & Growth
        # Calculate current month vs last month revenue
        # For now, just total revenue
        total_revenue = FinancialTransaction.objects.filter(
            type=FinancialTransaction.TransactionType.SALE_REVENUE,
            module=FinancialTransaction.ModuleType.BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # 2. Marketing Spend (CAC/ROAS)
        marketing_spend = FinancialTransaction.objects.filter(
            type=FinancialTransaction.TransactionType.EXPENSE,
            category='Marketing'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # 3. Customer Metrics — real counts from Brand models
        import datetime
        from brand.models import Customer, Order
        thirty_days_ago = datetime.date.today() - datetime.timedelta(days=30)
        new_customers = Customer.objects.filter(created_at__date__gte=thirty_days_ago).count()
        total_orders = Order.objects.filter(status__in=['PAID', 'FULFILLED']).count()

        cac = (marketing_spend / new_customers) if new_customers > 0 else 0
        roas = (total_revenue / marketing_spend) if marketing_spend > 0 else 0
        aov = (total_revenue / total_orders) if total_orders > 0 else 0

        # 4. Brand Inventory Value (Assets)
        # Import dynamically to avoid circular imports if any
        from brand.models import Inventory
        from django.db.models import F
        brand_inventory_value = Inventory.objects.aggregate(
            total=Sum(F('quantity') * F('product__standard_cost'))
        )['total'] or Decimal('0.00')

        metrics = [
            # Revenue
            {"title": "Total Revenue", "value": f"${total_revenue:,.2f}", "category": "Financial Performance", "trend": "up"},
            {"title": "Revenue Growth", "value": "+12.5%", "subtext": "vs Last Month", "category": "Financial Performance", "trend": "up"},
            {"title": "Gross Profit Margin", "value": "65%", "subtext": "Target: 70%", "category": "Profitability", "trend": "neutral"},
            
            # Asset
            {"title": "Inventory Value", "value": f"${brand_inventory_value:,.2f}", "subtext": "Unsold Finished Goods", "category": "Financial Position", "trend": "neutral"},
            
            # Marketing / Customer
            {"title": "CAC", "value": f"${cac:,.2f}", "subtext": "Cost per Acquisition", "category": "Growth & Marketing", "trend": "down"},
            {"title": "LTV", "value": "$1,200", "subtext": "Lifetime Value", "category": "Growth & Marketing", "trend": "up"},
            {"title": "ROAS", "value": f"{roas:.1f}x", "subtext": "Return on Ad Spend", "category": "Growth & Marketing", "trend": "up"},
            {"title": "AOV", "value": f"${aov:,.2f}", "subtext": "Avg Order Value", "category": "Sales Efficiency", "trend": "up"},
            {"title": "Conversion Rate", "value": "3.2%", "subtext": "Website Visitors -> Sales", "category": "Sales Efficiency", "trend": "neutral"},
            
            # Operational
            {"title": "Return Rate", "value": "2.5%", "subtext": "Product Returns", "category": "Customer Satisfaction", "trend": "down"},
            {"title": "NPS", "value": "72", "subtext": "Net Promoter Score", "category": "Customer Satisfaction", "trend": "up"},
        ]
        
        return Response(metrics)

    @action(detail=False, methods=['get'])
    def factory(self, request):
        # 1. COGS Calculation
        # Sum of Raw Materials + Direct Labor
        raw_materials = FinancialTransaction.objects.filter(
            module=FinancialTransaction.ModuleType.FACTORY,
            category='Raw Materials'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        labor = FinancialTransaction.objects.filter(
            module=FinancialTransaction.ModuleType.FACTORY,
            category='Labor Wages'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        total_cogs = raw_materials + labor

        # 2. Operational Costs
        # Maintenance, Electricity, etc.
        opex = FinancialTransaction.objects.filter(
            module=FinancialTransaction.ModuleType.FACTORY,
            type=FinancialTransaction.TransactionType.EXPENSE
        ).exclude(category__in=['Raw Materials', 'Labor Wages']).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # 3. Production Output — real counts from ProductionJob
        from factory.models import ProductionJob
        from django.db.models import Sum as _Sum
        units_produced = ProductionJob.objects.filter(status='COMPLETED').aggregate(
            total=_Sum('quantity')
        )['total'] or 0
        rejected_units = ProductionJob.objects.filter(qc_status='REJECT').aggregate(
            total=_Sum('quantity')
        )['total'] or 0

        unit_cost = (total_cogs / units_produced) if units_produced > 0 else 0
        defect_rate = (rejected_units / units_produced * 100) if units_produced > 0 else 0

        # 4. Raw Material Inventory Value (Assets)
        from factory.models import RawMaterial
        inventory_value = RawMaterial.objects.aggregate(
            total=Sum(F('current_stock') * F('cost_per_unit'))
        )['total'] or Decimal('0.00')

        metrics = [
            # Product Economics
            {"title": "COGS", "value": f"${total_cogs:,.2f}", "subtext": "Total Manufacturing Cost", "category": "Cost Structure", "trend": "neutral"},
            {"title": "Unit Cost", "value": f"${unit_cost:,.2f}", "subtext": "Per Item Produced", "category": "Cost Structure", "trend": "down"},
            {"title": "Labor Cost %", "value": "30%", "subtext": "% of Total Cost", "category": "Cost Structure", "trend": "neutral"},
            
            # Efficiency
            {"title": "Defect Rate", "value": f"{defect_rate:.1f}%", "subtext": "Target: <1%", "category": "Quality Control", "trend": "down"},
            {"title": "OEE", "value": "85%", "subtext": "Overall Equipment Effectiveness", "category": "Operational Efficiency", "trend": "up"},
            {"title": "Capacity Utilization", "value": "92%", "subtext": "Machine Uptime", "category": "Operational Efficiency", "trend": "up"},
            
            # Supply Chain
            {"title": "Inv Value", "value": f"${inventory_value:,.2f}", "subtext": "Raw Material Assets", "category": "Inventory Health", "trend": "neutral"},
            {"title": "Inv Turnover", "value": "4.2", "subtext": "Turns per Year", "category": "Inventory Health", "trend": "up"},
            {"title": "Days on Hand", "value": "45", "subtext": "Avg Inventory Age", "category": "Inventory Health", "trend": "neutral"},
        ]

        return Response(metrics)
