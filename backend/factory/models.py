from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

class Supplier(models.Model):
    """
    Suppliers for raw materials.
    Tracks contact info and lead times.
    """
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name

    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Amount owed to supplier")

class MaterialPurchase(models.Model):
    """
    Record of buying raw materials from a supplier.
    Increases Stock and Increases Supplier Balance (Debt).
    """
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchases')
    raw_material = models.ForeignKey('RawMaterial', on_delete=models.PROTECT, related_name='purchases')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Payment Details
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @transaction.atomic
    def save(self, *args, **kwargs):
        is_new = self.pk is None

        if is_new:
            self.total_cost = self.quantity * self.cost_per_unit

            # Lock the raw material row to prevent concurrent stock over-credit
            locked = RawMaterial.objects.select_for_update().get(pk=self.raw_material_id)
            locked.current_stock += self.quantity
            locked.cost_per_unit = self.cost_per_unit
            locked.save()
            # Keep the in-memory reference consistent
            self.raw_material = locked

            # Update supplier balance (debt = total cost - amount paid upfront)
            remaining_debt = self.total_cost - self.amount_paid
            self.supplier.balance += remaining_debt
            self.supplier.save()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Purchase: {self.quantity} {self.raw_material.name} from {self.supplier.name}"

class SupplierPayment(models.Model):
    """
    Record of paying a supplier.
    Decreases Supplier Balance (Debt).
    """
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', _('Cash')
        BANK_TRANSFER = 'BANK', _('Bank Transfer')
        CHECK = 'CHECK', _('Check')
        
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk: # Only on create
            with transaction.atomic():
                # 1. Deduct from Supplier Balance (Debt Decreases)
                # select_for_update prevents concurrent payments from racing on the same supplier
                supplier = Supplier.objects.select_for_update().get(pk=self.supplier_id)
                supplier.balance -= self.amount
                supplier.save()
                self.supplier = supplier
                
                # 2. Create Financial Transaction (Expense)
                from finance.models import FinancialTransaction
                FinancialTransaction.objects.create(
                    module=FinancialTransaction.ModuleType.FACTORY,
                    type=FinancialTransaction.TransactionType.EXPENSE,
                    amount=self.amount,
                    description=f"Payment to {self.supplier.name}",
                    category="Supplier Payment",
                    reference_id=f"PAY-{self.supplier.id}-{timezone.now().timestamp()}"
                )
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Payment: {self.amount} to {self.supplier.name}"

class RawMaterial(models.Model):
    """
    Inventory items used in production.
    Tracks stock in specific units (Meters/Units).
    """
    class UnitType(models.TextChoices):
        METER = 'METER', _('Meter')
        UNIT = 'UNIT', _('Unit')
        KG = 'KG', _('Kilogram')

    name = models.CharField(max_length=255)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, related_name='materials')
    image = models.ImageField(upload_to='materials/', blank=True, null=True)
    
    # Financials
    cost_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Cost in EGP per unit/meter"
    )
    
    # Inventory
    unit = models.CharField(max_length=10, choices=UnitType.choices, default=UnitType.METER)
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    minimum_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('10.00'))

    def __str__(self) -> str:
        return f"{self.name} ({self.get_unit_display()})"

class BOM(models.Model):
    """
    Bill of Materials (Recipe).
    Defines what goes into a Product.
    """
    product = models.OneToOneField(
        'brand.Product', 
        on_delete=models.CASCADE, 
        related_name='bom'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"BOM: {self.product.sku}"

class BOMItem(models.Model):
    """
    Line item in a BOM.
    X meters/units of RawMaterial needed for 1 Product.
    """
    bom = models.ForeignKey(BOM, on_delete=models.CASCADE, related_name='items')
    raw_material = models.ForeignKey(RawMaterial, on_delete=models.PROTECT)
    
    quantity = models.DecimalField(
        max_digits=10, 
        decimal_places=4, 
        help_text="Quantity required per unit of Product"
    )
    waste_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Expected waste (e.g. 5.00 for 5%)"
    )

    class Meta:
        unique_together = ('bom', 'raw_material')

    def __str__(self) -> str:
        return f"{self.quantity} {self.raw_material.unit} of {self.raw_material.name}"

class ProductionJob(models.Model):
    """
    A manufacturing order to produce X units of Product.
    Deducts Raw Materials and creates WIP.
    """
    class JobStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        QC = 'QC', _('Quality Control')
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    class QCStatus(models.TextChoices):
        NA = 'NA', _('Not Applicable')
        PASS = 'PASS', _('Pass')
        REJECT = 'REJECT', _('Reject (Waste)')
        REPAIR = 'REPAIR', _('Repair Needed')

    name = models.CharField(max_length=100, unique=True, help_text="e.g. JOB-2023-001")
    product = models.ForeignKey('brand.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(help_text="Planned Production Quantity")
    
    # Link to a Brand Order (for Made-to-Order)
    source_order = models.ForeignKey('brand.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='production_jobs')
    
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.PENDING, db_index=True)
    qc_status = models.CharField(max_length=20, choices=QCStatus.choices, default=QCStatus.NA)
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} - {self.product.name}"

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")

    @transaction.atomic
    def start_production(self):
        """
        Transitions job from PENDING to IN_PROGRESS.
        Deducts raw materials based on BOM.
        Raises ValidationError if stock is insufficient.
        """
        if self.status != self.JobStatus.PENDING:
            raise ValidationError("Only PENDING jobs can be started.")

        if not hasattr(self.product, 'bom'):
            raise ValidationError(f"Product {self.product.sku} has no BOM linked.")

        bom_items = self.product.bom.items.select_related('raw_material').all()
        if not bom_items.exists():
            raise ValidationError(f"BOM for {self.product.sku} is empty.")

        # Lock raw material rows to prevent concurrent over-deduction (TOCTOU fix)
        raw_material_ids = list(bom_items.values_list('raw_material_id', flat=True))
        locked_materials = {
            m.id: m for m in RawMaterial.objects.select_for_update().filter(id__in=raw_material_ids)
        }

        # 1. Validate Stock Availability against locked rows
        for item in bom_items:
            material = locked_materials[item.raw_material_id]
            required_qty = item.quantity * Decimal(self.quantity)
            if material.current_stock < required_qty:
                raise ValidationError(
                    f"Insufficient stock for {material.name}. "
                    f"Required: {required_qty}, Available: {material.current_stock}"
                )

        # 2. Deduct Stock from locked rows
        for item in bom_items:
            material = locked_materials[item.raw_material_id]
            required_qty = item.quantity * Decimal(self.quantity)
            material.current_stock -= required_qty
            material.save()

        # 3. Update Job
        self.status = self.JobStatus.IN_PROGRESS
        self.start_date = timezone.now().date()
        self.save()

    @transaction.atomic
    def complete_production(self, target_location_id: int = None):
        """
        Transitions job from QC to COMPLETED.
        THE HANDSHAKE: Transfers finished goods to Brand Inventory.
        """
        if self.status != self.JobStatus.QC:
            raise ValidationError("Only jobs in QC status can be completed.")

        # 3. Create Financial Transaction (Inter-Company)
        from finance.models import FinancialTransaction, ProductCosting

        costing, _ = ProductCosting.objects.get_or_create(product=self.product)
        total_value = costing.transfer_price * Decimal(self.quantity)

        # A) Brand Side: Cost of Goods (Payable to Factory)
        FinancialTransaction.objects.get_or_create(
            reference_id=self.name,
            module=FinancialTransaction.ModuleType.BRAND,
            category="Inventory Purchase",
            defaults=dict(
                type=FinancialTransaction.TransactionType.TRANSFER_TO_BRAND,
                amount=total_value,
                description=f"Payable to Factory: {self.quantity} x {self.product.sku}",
            )
        )

        # B) Factory Side: Revenue (Receivable from Brand)
        FinancialTransaction.objects.get_or_create(
            reference_id=self.name,
            module=FinancialTransaction.ModuleType.FACTORY,
            category="Finished Goods Sales",
            defaults=dict(
                type=FinancialTransaction.TransactionType.SALE_REVENUE,
                amount=total_value,
                description=f"Transfer Revenue: {self.quantity} x {self.product.sku}",
            )
        )

        # 4. Update Source Order Status (if applicable)
        if self.source_order:
            from brand.models import Order as BrandOrder
            self.source_order.status = BrandOrder.OrderStatus.READY
            self.source_order.save()

        # 5. Transfer finished goods to Brand Inventory
        from brand.models import Inventory, Location

        location = None
        if target_location_id:
            location = Location.objects.filter(id=target_location_id).first()
        if not location:
            # Prefer WAREHOUSE type, fall back to any location so a showroom/store still works
            location = (
                Location.objects.filter(type=Location.LocationType.WAREHOUSE).order_by('id').first()
                or Location.objects.order_by('id').first()
            )
        if not location:
            raise ValidationError("No location found. Please create a location in Brand settings before completing production.")

        inventory, _ = Inventory.objects.get_or_create(
            product=self.product,
            location=location,
            defaults={'quantity': 0}
        )
        inventory.quantity += self.quantity
        inventory.save()

        # 6. Update Job Status
        self.status = self.JobStatus.COMPLETED
        self.end_date = timezone.now().date()
        self.save()



class Worker(models.Model):
    """
    Factory worker tracking.
    """
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=100, default='Worker')
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class WorkerAttendance(models.Model):
    """
    Daily attendance for a worker.
    """
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField(default=timezone.now)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('worker', 'date')

    def __str__(self):
        return f"{self.worker.name} - {self.date} ({self.hours_worked} hrs)"

class ProductionLog(models.Model):
    """
    Log of pieces produced by a worker.
    Can be linked to a specific Job or just general output.
    """
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='production_logs')
    job = models.ForeignKey(ProductionJob, on_delete=models.SET_NULL, null=True, blank=True, related_name='production_logs')
    quantity = models.IntegerField(help_text="Number of pieces produced")
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.worker.name} - {self.quantity} pcs - {self.date}"
