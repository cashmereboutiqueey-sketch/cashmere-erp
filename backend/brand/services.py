from decimal import Decimal
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db.models import Sum
from .models import Order, Inventory, Customer
from finance.models import FinancialTransaction
from factory.models import ProductionJob

class OrderService:
    @staticmethod
    def process_new_order(order: Order):
        """
        Centralized logic for processing a newly created or updated order.
        Handles:
        1. Production Job Creation (if status is PENDING_PRODUCTION)
        2. Financial Income Trigger (if status is PAID)
        3. Inventory Deduction (if status is PAID or PENDING)
        4. Customer Metrics Update (if status is PAID or FULFILLED)
        5. Brand Revenue Recording (if status is PAID)
        """
        
        # 1. Inventory Deduction
        # Deduct as soon as order is confirmed (PAID or PENDING) to reserve stock
        if order.status in [Order.OrderStatus.PAID, Order.OrderStatus.PENDING, Order.OrderStatus.FULFILLED]:
             OrderService._deduct_inventory(order)

        # 2. Production Job Logic
        # Create jobs for orders that need production (PENDING_PRODUCTION)
        if order.status == Order.OrderStatus.PENDING_PRODUCTION: # Strict check
            if not ProductionJob.objects.filter(source_order=order).exists():
                for item in order.items.all():
                    ProductionJob.objects.create(
                        name=f"JOB-{order.order_number}-{item.product.sku}-{int(timezone.now().timestamp())}",
                        product=item.product,
                        quantity=item.quantity,
                        source_order=order,
                        notes=f"Auto-generated from Order #{order.order_number}\nCustomer: {order.customer.name if order.customer else 'Guest'}"
                    )

        # 3. Financial Income Logic
        if order.status == Order.OrderStatus.PAID:
            OrderService._record_brand_revenue(order)
            # Settle factory payable for all non-MTO items.
            # MTO items already have a TRANSFER_TO_BRAND from job completion;
            # we still settle those here so factory treasury gets the cash.
            OrderService._settle_factory_payable(order)

        # 4. Customer Metrics
        if order.status in [Order.OrderStatus.PAID, Order.OrderStatus.FULFILLED]:
             OrderService._update_customer_metrics(order)

    @staticmethod
    def _deduct_inventory(order: Order):
        """
        Deducts sold items from inventory at the order's location.
        """
        if order.inventory_deducted:
            return

        if not order.location:
            return

        import logging
        _logger = logging.getLogger(__name__)

        with db_transaction.atomic():
            for item in order.items.all():
                inv, _ = Inventory.objects.select_for_update().get_or_create(
                    location=order.location,
                    product=item.product,
                    defaults={'quantity': 0}
                )
                if inv.quantity < item.quantity:
                    _logger.warning(
                        "Oversell: product %s at location %s, available=%s, ordered=%s",
                        item.product.sku, order.location, inv.quantity, item.quantity
                    )
                inv.quantity -= item.quantity
                inv.save()

        order.inventory_deducted = True
        order.save()

    @staticmethod
    def restore_inventory(order: Order):
        """
        Restores inventory when an order is cancelled or fully returned.
        Only runs if inventory was previously deducted.
        """
        if not order.inventory_deducted or not order.location:
            return

        import logging
        _logger = logging.getLogger(__name__)

        with db_transaction.atomic():
            for item in order.items.all():
                try:
                    inv = Inventory.objects.select_for_update().get(
                        location=order.location,
                        product=item.product,
                    )
                    inv.quantity += item.quantity
                    inv.save()
                except Inventory.DoesNotExist:
                    _logger.warning(
                        "Inventory not found to restore: product %s at location %s",
                        item.product.sku, order.location
                    )

        order.inventory_deducted = False
        order.save(update_fields=['inventory_deducted'])

    @staticmethod
    def _settle_factory_payable(order: Order):
        """
        When brand sells an order, automatically pays factory its transfer_price share.
        - Debits brand MAIN treasury (if exists)
        - Credits factory MAIN treasury (if exists)
        - Records INTERCOMPANY_PAYMENT on brand ledger
        - Records SALE_REVENUE on factory ledger
        Idempotent: order row is locked first so concurrent webhooks queue, not duplicate.
        """
        from finance.models import ProductCosting, Treasury

        ref_id = f"ICPAY-{order.order_number}"

        factory_total = Decimal('0.00')
        for item in order.items.select_related('product').all():
            try:
                costing = ProductCosting.objects.get(product=item.product)
                factory_total += costing.transfer_price * Decimal(item.quantity)
            except ProductCosting.DoesNotExist:
                if item.product.standard_cost:
                    factory_total += Decimal(str(item.product.standard_cost)) * Decimal(item.quantity)

        if factory_total <= 0:
            return

        with db_transaction.atomic():
            # Lock the order row so concurrent calls (e.g. duplicate Shopify webhooks)
            # queue here instead of both passing the idempotency check below.
            Order.objects.select_for_update().get(pk=order.pk)

            if FinancialTransaction.objects.filter(
                reference_id=ref_id,
                module=FinancialTransaction.ModuleType.BRAND
            ).exists():
                return
            brand_treasury = Treasury.objects.select_for_update().filter(
                module=Treasury.ModuleType.BRAND, type=Treasury.TreasuryType.MAIN
            ).first()
            factory_treasury = Treasury.objects.select_for_update().filter(
                module=Treasury.ModuleType.FACTORY, type=Treasury.TreasuryType.MAIN
            ).first()

            today = timezone.now().date()

            # Brand side: outflow (debit)
            FinancialTransaction.objects.create(
                type=FinancialTransaction.TransactionType.INTERCOMPANY_PAYMENT,
                module=FinancialTransaction.ModuleType.BRAND,
                category='Factory Settlement',
                amount=factory_total,
                reference_id=ref_id,
                description=f"Auto-payment to Factory · Order #{order.order_number}",
                treasury=brand_treasury,
                date=today,
            )
            if brand_treasury:
                brand_treasury.balance -= factory_total
                brand_treasury.save()

            # Factory side: inflow (credit)
            FinancialTransaction.objects.create(
                type=FinancialTransaction.TransactionType.SALE_REVENUE,
                module=FinancialTransaction.ModuleType.FACTORY,
                category='Brand Settlement',
                amount=factory_total,
                reference_id=ref_id,
                description=f"Payment from Brand · Order #{order.order_number}",
                treasury=factory_treasury,
                date=today,
            )
            if factory_treasury:
                factory_treasury.balance += factory_total
                factory_treasury.save()

    @staticmethod
    def _record_brand_revenue(order: Order):
        """
        Records the Sale Revenue in the Finance Ledger (Brand Module).
        Idempotent: order row lock prevents concurrent duplicate inserts.
        """
        ref_id = f"SALE-{order.order_number}"
        with db_transaction.atomic():
            Order.objects.select_for_update().get(pk=order.pk)
            if not FinancialTransaction.objects.filter(
                reference_id=ref_id,
                module=FinancialTransaction.ModuleType.BRAND
            ).exists():
                FinancialTransaction.objects.create(
                    type=FinancialTransaction.TransactionType.SALE_REVENUE,
                    module=FinancialTransaction.ModuleType.BRAND,
                    category='Sales Revenue',
                    amount=order.total_price,
                    reference_id=ref_id,
                    description=f"Revenue from Order #{order.order_number} ({order.payment_method})",
                    treasury=None
                )

    @staticmethod
    def _update_customer_metrics(order: Order):
        """
        Recalculates Total Spent, LTV, current_debt, and tier for the customer.
        """
        customer = order.customer
        if not customer:
            return

        active_statuses = [Order.OrderStatus.PAID, Order.OrderStatus.FULFILLED, Order.OrderStatus.PENDING]
        stats = Order.objects.filter(
            customer=customer,
            status__in=active_statuses
        ).aggregate(
            total_price=Sum('total_price'),
            total_paid=Sum('amount_paid')
        )

        total_price = stats['total_price'] or Decimal('0.00')
        total_paid = stats['total_paid'] or Decimal('0.00')

        # Only count PAID/FULFILLED for spent (not PENDING)
        paid_stats = Order.objects.filter(
            customer=customer,
            status__in=[Order.OrderStatus.PAID, Order.OrderStatus.FULFILLED]
        ).aggregate(total=Sum('total_price'))
        new_total = paid_stats['total'] or Decimal('0.00')

        customer.total_spent = new_total
        customer.ltv_score = new_total
        # Debt = sum of all active order totals minus what's been paid
        customer.current_debt = max(Decimal('0.00'), total_price - total_paid)

        # Tier order: STANDARD < VIP < VVIP < ELITE (highest)
        if new_total > 50000:
            customer.tier = Customer.Tier.ELITE
        elif new_total > 20000:
            customer.tier = Customer.Tier.VVIP
        elif new_total > 5000:
            customer.tier = Customer.Tier.VIP
        else:
            customer.tier = Customer.Tier.STANDARD

        customer.save()
