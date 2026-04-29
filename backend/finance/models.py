import datetime
from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from brand.models import Product

class FactoryOverhead(models.Model):
    """
    General internal expenses for the factory.
    Used to calculate overhead allocation rates.
    """
    name = models.CharField(max_length=100)
    month = models.DateField(help_text="First day of the month")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    def __str__(self) -> str:
        return f"{self.name} - {self.amount}"

class ProductCosting(models.Model):
    """
    Cost structure for a Product.
    Sources 'True Cost' and 'Transfer Price'.
    """
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='costing')
    
    direct_labor_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    overhead_allocation = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    factory_margin_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('20.00'), help_text="e.g. 20.00 for 20%")

    updated_at = models.DateTimeField(auto_now=True)

    @property
    def raw_material_cost(self) -> Decimal:
        """
        Calculates SUM(BOM Item Qty * Material Cost).
        Uses select_related to avoid N+1 on raw_material.
        """
        if not hasattr(self.product, 'bom'):
            return Decimal('0.00')

        total = Decimal('0.00')
        for item in self.product.bom.items.select_related('raw_material').all():
            total += item.quantity * item.raw_material.cost_per_unit
        return total

    @property
    def true_cost(self) -> Decimal:
        return self.raw_material_cost + self.direct_labor_cost + self.overhead_allocation

    @property
    def transfer_price(self) -> Decimal:
        return self.true_cost * (Decimal('1.00') + (self.factory_margin_percent / Decimal('100.00')))

    def __str__(self) -> str:
        return f"Costing: {self.product.sku}"

class Treasury(models.Model):
    """
    Represents a fund source/destination.
    e.g. 'Daily Store Drawer', 'Main Safe', 'Bank Account'.
    """
    class TreasuryType(models.TextChoices):
        DAILY = 'DAILY', _('Daily Treasury (Drawer)')
        MAIN = 'MAIN', _('Main Treasury (Safe)')
        BANK = 'BANK', _('Bank Account')

    class ModuleType(models.TextChoices):
        BRAND = 'BRAND', _('Brand')
        FACTORY = 'FACTORY', _('Factory')
        SHARED = 'SHARED', _('Shared')

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TreasuryType.choices, default=TreasuryType.MAIN)
    module = models.CharField(max_length=10, choices=ModuleType.choices, default=ModuleType.SHARED)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    location = models.ForeignKey('brand.Location', on_delete=models.SET_NULL, null=True, blank=True, related_name='treasuries')
    
    def __str__(self) -> str:
        return f"{self.name} ({self.get_type_display()}) - {self.balance} EGP"

class FinancialTransaction(models.Model):
    """
    Records value flow between systems.
    e.g. Factory sells to Brand (Transfer), Brand sells to Customer (Revenue).
    """
    class TransactionType(models.TextChoices):
        TRANSFER_TO_BRAND = 'TRANSFER', _('Factory to Brand Transfer')
        SALE_REVENUE = 'SALE', _('Sales Revenue')
        EXPENSE = 'EXPENSE', _('Expense')
        INTERNAL_TRANSFER = 'INTERNAL', _('Internal Treasury Transfer')
        INTERCOMPANY_PAYMENT = 'INTERCOMPANY', _('Inter-Company Settlement')
        
    class ModuleType(models.TextChoices):
        BRAND = 'BRAND', _('Brand')
        FACTORY = 'FACTORY', _('Factory')

    # Core identification
    type = models.CharField(max_length=20, choices=TransactionType.choices)
    module = models.CharField(max_length=20, choices=ModuleType.choices, default=ModuleType.BRAND)
    category = models.CharField(max_length=100, blank=True, help_text="e.g. Rent, Salaries, Sales, Materials")
    
    # Financials
    treasury = models.ForeignKey(Treasury, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Meta
    reference_id = models.CharField(max_length=100, help_text="Job ID or Order Number")
    description = models.TextField(blank=True)
    date = models.DateField(default=datetime.date.today, help_text="Date of transaction")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['type', 'module', 'date']),
            models.Index(fields=['module', 'category']),
        ]
        unique_together = [('reference_id', 'module', 'category')]

    def __str__(self) -> str:
        return f"{self.get_type_display()}: {self.amount} ({self.date})"
