from decimal import Decimal
from django.utils import timezone
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

        # 3. Financial Income Logic (Factory COGS Release)
        # Skip factory income for MTO orders — revenue is recorded when the production job completes
        if order.status == Order.OrderStatus.PAID:
            is_mto = order.production_jobs.exists()
            if not is_mto:
                OrderService._trigger_factory_income(order)
            OrderService._record_brand_revenue(order)

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

        for item in order.items.all():
            # Find inventory
            inv, created = Inventory.objects.get_or_create(
                location=order.location,
                product=item.product,
                defaults={'quantity': 0}
            )
            
            # Deduct quantity — allow negative to track overselling (backorders)
            if inv.quantity < item.quantity:
                import logging
                logging.getLogger(__name__).warning(
                    f"Oversell: product {item.product.sku} at location {order.location}, "
                    f"available={inv.quantity}, ordered={item.quantity}"
                )
            inv.quantity -= item.quantity
            inv.save()
            
        # Mark as deducted to prevent double counting
        order.inventory_deducted = True
        order.save()

    @staticmethod
    def _trigger_factory_income(order: Order):
        """
        Calculates COGS for the order and records it as Income for the Factory.
        """
        total_cogs = Decimal('0.00')
        for item in order.items.all():
            if item.product.standard_cost:
                cost = item.product.standard_cost * item.quantity
                total_cogs += cost
        
        if total_cogs > 0:
            ref_id = f"COGS-{order.order_number}"
            if not FinancialTransaction.objects.filter(
                reference_id=ref_id, 
                module=FinancialTransaction.ModuleType.FACTORY
            ).exists():
                FinancialTransaction.objects.create(
                    type=FinancialTransaction.TransactionType.SALE_REVENUE, 
                    module=FinancialTransaction.ModuleType.FACTORY,
                    category='COGS Release',
                    amount=total_cogs,
                    reference_id=ref_id,
                    description=f"Auto-Income from Order #{order.order_number}",
                    treasury=None 
                )

    @staticmethod
    def _record_brand_revenue(order: Order):
        """
        Records the Sale Revenue in the Finance Ledger (Brand Module).
        """
        ref_id = f"SALE-{order.order_number}"
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
                treasury=None # Goes to general ledger, or link to a specific safe if needed
            )

    @staticmethod
    def _update_customer_metrics(order: Order):
        """
        Recalculates Total Spent and LTV for the customer.
        """
        customer = order.customer
        if not customer:
            return

        # Aggregate all PAID orders
        stats = Order.objects.filter(
            customer=customer, 
            status__in=[Order.OrderStatus.PAID, Order.OrderStatus.FULFILLED]
        ).aggregate(
            total=Sum('total_price')
        )
        
        new_total = stats['total'] or Decimal('0.00')
        customer.total_spent = new_total
        
        # Simple Linear LTV (can be complex later)
        customer.ltv_score = new_total
        
        # Tier Logic — always recalculate so tier can downgrade after refunds
        if new_total > 50000:
            customer.tier = Customer.Tier.VVIP
        elif new_total > 20000:
            customer.tier = Customer.Tier.VIP
        elif new_total > 5000:
            customer.tier = Customer.Tier.ELITE
        else:
            customer.tier = Customer.Tier.STANDARD
            
        customer.save()
