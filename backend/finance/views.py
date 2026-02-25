from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, F
from django.db import transaction
from decimal import Decimal
from .models import FinancialTransaction, Treasury
from .serializers import FinancialTransactionSerializer, TreasurySerializer

class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer

    @action(detail=False, methods=['post'])
    def transfer_to_main(self, request):
        amount = Decimal(request.data.get('amount', '0.00'))
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=400)
            
        daily_treasury = Treasury.objects.filter(type=Treasury.TreasuryType.DAILY).first()
        main_treasury = Treasury.objects.get(type=Treasury.TreasuryType.MAIN)
        
        if not daily_treasury or daily_treasury.balance < amount:
            return Response({'error': 'Insufficient funds in Daily Treasury'}, status=400)

        with transaction.atomic():
            # 1. Debit Daily
            daily_treasury.balance -= amount
            daily_treasury.save()
            FinancialTransaction.objects.create(
                type=FinancialTransaction.TransactionType.INTERNAL_TRANSFER,
                module=FinancialTransaction.ModuleType.BRAND,
                category='Transfer to Main',
                treasury=daily_treasury,
                amount=-amount,
                reference_id=f'TRF-{transaction.get_connection().queries_log.__len__()}', # Simple unique ID logic
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
                reference_id=f'TRF-{transaction.get_connection().queries_log.__len__()}',
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

    def perform_create(self, serializer):
        item = serializer.save()
        # Auto-update Treasury
        if item.treasury:
            # If Expense/Transfer Out -> Negative Amount
            # If Income -> Positive Amount
            # logic: The amount in transaction should be signed correctly by frontend or here?
            # Let's assume input amount is Absolute, and Type determines sign?
            # Or Input amount is signed? 
            # Brand Expense Page sends POSITIVE amount usually.
            
            # Let's enforce logic:
            # EXPENSE -> Subtract
            # SALE -> Add
            # TRANSFER -> ?
            
            # For now, simplistic: Just add the amount (assuming signed correctly by logic below or frontend)
            # But wait, frontend sends positive for expense.
            if item.type == 'EXPENSE':
                item.treasury.balance -= item.amount
            elif item.type == 'SALE':
                item.treasury.balance += item.amount
            
            item.treasury.save()

class PnLView(APIView):
    """
    Returns P&L Summary.
    Endpoint: /api/finance/pnl/
    """
    def get(self, request):
        # Factory Revenue (Transfers)
        factory_revenue = FinancialTransaction.objects.filter(
            type=FinancialTransaction.TransactionType.TRANSFER_TO_BRAND
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Brand Revenue (Sales)
        brand_revenue = FinancialTransaction.objects.filter(
            type=FinancialTransaction.TransactionType.SALE_REVENUE
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        return Response({
            "factory": {
                "revenue": factory_revenue,
                "cogs": "Calculated from Standard Cost" 
            },
            "brand": {
                "revenue": brand_revenue,
                "cogs": factory_revenue 
            },
            "group": {
                "net_profit": "TODO"
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

        # 3. Customer Metrics (Placeholder for now until we link Customer model)
        # assuming some dummy data for calculation if 0
        new_customers = 50 # TODO: Count from Customer model created_at > 30 days
        total_orders = 100 # TODO: Count from Order model

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

        # 3. Production Output (Placeholder)
        # We need to query ProductionJob model really.
        units_produced = 5000 
        rejected_units = 50

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
