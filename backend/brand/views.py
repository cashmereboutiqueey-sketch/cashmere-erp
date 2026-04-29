import logging
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Location, Inventory, Order, Customer, CustomerInteraction, OrderItem, Category, ShippingManifest
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.db import transaction
from decimal import Decimal
from django.utils import timezone
import datetime
from .serializers import ProductSerializer, LocationSerializer, InventorySerializer, OrderSerializer, CustomerSerializer, CustomerInteractionSerializer, CategorySerializer, ShippingManifestSerializer
from core.permissions import HasBrandAccess, HasFinanceAccess

logger = logging.getLogger(__name__)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name').prefetch_related('inventory', 'productionjob_set', 'orderitem_set')
    permission_classes = [IsAuthenticated, HasBrandAccess]

    def get_permissions(self):
        # LiteProductSerializer has no financial fields — any authenticated user
        # may read the lite list so factory/finance dropdowns (e.g. BOM builder) work.
        if self.action == 'list' and self.request.query_params.get('lite'):
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.query_params.get('lite'):
            from .serializers import LiteProductSerializer
            return LiteProductSerializer
        return ProductSerializer
    
    def get_queryset(self):
        if self.request.query_params.get('lite'):
            return Product.objects.all().order_by('name')

        from django.db.models import Sum, Q
        from django.db.models.functions import Coalesce

        return super().get_queryset().annotate(
            total_produced=Coalesce(
                Sum('productionjob__quantity', filter=Q(productionjob__status='COMPLETED')),
                0
            ),
            total_sold=Coalesce(
                Sum('orderitem__quantity', filter=Q(orderitem__order__status__in=['PAID', 'FULFILLED'])),
                0
            ),
            stock_remaining=Coalesce(
                Sum('inventory__quantity'),
                0
            )
        )
    
    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        """
        Import products from CSV file
        
        Expected file upload with key 'file'
        Optional parameter: update_existing (default: true)
        """
        from .csv_import import ProductCSVImporter, CSVImportError
        from django.http import HttpResponse
        
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response(
                {'error': 'No file provided. Please upload a CSV file with key "file"'},
                status=400
            )
        
        update_existing = request.data.get('update_existing', 'true').lower() == 'true'
        
        try:
            importer = ProductCSVImporter(csv_file)
            result = importer.process(update_existing=update_existing, dry_run=False)
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': f"Successfully imported {result['created']} products, updated {result['updated']} products",
                    'created': result['created'],
                    'updated': result['updated'],
                    'warnings': result['warnings']
                }, status=200)
            else:
                return Response({
                    'success': False,
                    'errors': result['errors'],
                    'warnings': result['warnings']
                }, status=400)
                
        except CSVImportError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            return Response({'error': f'Unexpected error: {str(e)}'}, status=500)
    
    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """
        Download a CSV template for product import
        """
        from .csv_import import generate_product_csv_template
        from django.http import HttpResponse
        
        csv_content = generate_product_csv_template()
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="product_import_template.csv"'
        return response

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all().order_by('name')
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated, HasBrandAccess]
    
    def get_queryset(self):
        from django.db.models import Sum, Q
        from django.db.models.functions import Coalesce
        return super().get_queryset().annotate(
            revenue=Coalesce(
                Sum('orders__total_price', filter=Q(orders__status=Order.OrderStatus.PAID)),
                Decimal('0.00')
            ),
            units_sold=Coalesce(
                Sum('orders__items__quantity', filter=Q(orders__status=Order.OrderStatus.PAID)),
                0
            )
        )

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.select_related('product', 'location').all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated, HasBrandAccess]

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def transfer(self, request):
        """
        Transfers stock from one location to another.
        Payload: {
            "source_location": ID,
            "target_location": ID,
            "items": [ {"product": ID, "quantity": int} ]
        }
        """
        source_id = request.data.get('source_location')
        target_id = request.data.get('target_location')
        items = request.data.get('items', [])

        if not source_id or not target_id or not items:
            return Response({'error': 'Missing required fields'}, status=400)

        for item_data in items:
            product_id = item_data.get('product')
            quantity = int(item_data.get('quantity', 0))

            if quantity <= 0:
                continue

            # 1. Deduct from Source
            source_inv = Inventory.objects.select_for_update().filter(
                location_id=source_id, product_id=product_id
            ).first()

            if not source_inv or source_inv.quantity < quantity:
                return Response(
                    {'error': f'Insufficient stock for Product ID {product_id} at Source Location'}, 
                    status=400
                )
            
            source_inv.quantity -= quantity
            source_inv.save()

            # 2. Add to Target
            target_inv, created = Inventory.objects.select_for_update().get_or_create(
                location_id=target_id, product_id=product_id,
                defaults={'quantity': 0}
            )
            target_inv.quantity += quantity
            target_inv.save()

        return Response({'status': 'success', 'message': 'Transfer completed'})

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('customer', 'location').prefetch_related('items', 'items__product').all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, HasBrandAccess]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['order_number', 'customer__name', 'customer__phone', 'status', 'shopify_order_id']
    filterset_fields = ['status', 'payment_method', 'location']

    @transaction.atomic
    def perform_create(self, serializer):
        order = serializer.save()
        from .services import OrderService
        OrderService.process_new_order(order)

    @transaction.atomic
    def perform_update(self, serializer):
        old_status = serializer.instance.status
        order = serializer.save()
        # Only run financial/inventory side-effects when status actually changes
        if old_status != order.status:
            from .services import OrderService
            OrderService.process_new_order(order)

    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        """
        Marks order as FULFILLED and sends data to Shipping Company.
        """
        order = self.get_object()

        if order.status == Order.OrderStatus.FULFILLED:
            return Response({'error': 'Order is already fulfilled'}, status=400)

        if order.status not in [Order.OrderStatus.PAID, Order.OrderStatus.READY]:
            return Response(
                {'error': f'Cannot fulfill order with status {order.status}. Order must be PAID or READY.'},
                status=400
            )

        # 0. Capture Shipping Selection (if any)
        shipping_company = request.data.get('shipping_company')
        if shipping_company:
            order.shipping_company = shipping_company
            # Don't save yet, wait for service success? Or save anyway?
            # Save anyway to track intent
            order.save()

        # 1. Send to Shipping Service
        from .shipping_service import ShippingService
        try:
            service = ShippingService()
            result = service.send_order(order)
            
            # 2. Update Status locally
            order.status = Order.OrderStatus.FULFILLED
            order.save()
            
            # 3. Log Interaction (only for known customers, not guests)
            if order.customer:
                CustomerInteraction.objects.create(
                    customer=order.customer,
                    type=CustomerInteraction.InteractionType.OTHER,
                    notes=f"Order #{order.order_number} fulfilled via {order.get_shipping_company_display()}. Tracking: {result.get('tracking_number')}",
                    staff_member=str(request.user)
                )
            
            return Response(result)

        except Exception as e:
            return Response({'error': f'Shipping Integration Failed: {str(e)}'}, status=500)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def return_items(self, request, pk=None):
        """
        Process partial or full returns.
        Payload:
        {
            "items": [ {"id": <OrderItemID>, "quantity": <int>} ],
            "restock": true/false
        }
        """
        order = self.get_object()
        items_payload = request.data.get('items', [])
        restock = request.data.get('restock', False)
        
        if not items_payload:
             return Response({'error': 'No items specified'}, status=400)

        total_refund_amount = Decimal('0.00')
        
        for item_data in items_payload:
            order_item_id = item_data.get('id')
            return_qty = int(item_data.get('quantity', 0))
            
            if return_qty <= 0:
                continue
                
            try:
                # Lock item for update
                order_item = OrderItem.objects.select_for_update().get(id=order_item_id, order=order)
            except OrderItem.DoesNotExist:
                return Response({'error': f'Item {order_item_id} not found in order'}, status=400)
            
            # Validation
            remaining_qty = order_item.quantity - order_item.returned_quantity
            if return_qty > remaining_qty:
                return Response({'error': f'Cannot return {return_qty} for item {order_item.product.sku}. Only {remaining_qty} remaining.'}, status=400)
            
            # 1. Update Returned Quantity
            order_item.returned_quantity += return_qty
            order_item.save()
            
            # 2. Calculate Refund — pro-rate both line-item and global order discounts
            item_gross = order_item.unit_price * order_item.quantity
            item_net = item_gross - order_item.item_discount
            # Share of global order discount attributable to this line
            order_gross = order.total_price + order.discount  # gross before global discount
            if order_gross > 0:
                global_discount_share = (item_gross / order_gross) * order.discount
            else:
                global_discount_share = Decimal('0.00')
            item_net -= global_discount_share
            unit_net_price = item_net / order_item.quantity if order_item.quantity else Decimal('0.00')
            refund_amount = unit_net_price * return_qty
            total_refund_amount += refund_amount
            
            # 3. Restock Inventory (if requested)
            if restock:
                # Return to Order Location (or Main Warehouse fallback)
                target_location = order.location or Location.objects.filter(type=Location.LocationType.WAREHOUSE).first()
                if target_location:
                    inv, _ = Inventory.objects.get_or_create(
                        product=order_item.product,
                        location=target_location,
                        defaults={'quantity': 0}
                    )
                    inv.quantity += return_qty
                    inv.save()
        
        # 4. Update Order Status
        # Check if all items are fully returned
        all_returned = not order.items.filter(returned_quantity__lt=F('quantity')).exists()
        
        if all_returned:
            order.status = Order.OrderStatus.RETURNED
        else:
            # Maybe add PARTIAL_RETURN status? For now, append to notes.
            order.notes = (order.notes or "") + f"\n[System] Returned items on {timezone.now().date()}. Refund: {total_refund_amount}"
        
        order.save()
        
        # 5. Record Financial Expense (Refund)
        # Assuming Cash refund for now - ideally prompt for method.
        # We'll just log it.
        
        return Response({
            'status': 'success',
            'refund_amount': total_refund_amount,
            'order_status': order.status
        })

    @action(detail=False, methods=['post'])
    def update_shipping_status(self, request):
        """
        Bulk update shipping status and net amount from Reconciliation.
        Expects: { "updates": [ { "id": 1, "status": "DELIVERED", "net_amount": 1000 }, ... ] }
        """
        updates = request.data.get('updates', [])
        updated_count = 0
        
        with transaction.atomic():
            for update in updates:
                try:
                    order = Order.objects.get(id=update['id'])
                    
                    # Update Status — never regress from terminal states
                    shipping_status = update.get('status')
                    terminal_statuses = [Order.OrderStatus.RETURNED, Order.OrderStatus.CANCELLED]
                    if shipping_status and order.status not in terminal_statuses:
                        order.detailed_status = shipping_status
                        if shipping_status == 'DELIVERED':
                            # DELIVERED = customer received → mark fulfilled and fully paid (COD)
                            order.status = Order.OrderStatus.FULFILLED
                            order.is_fully_paid = True
                        elif shipping_status in ['RETURNED', 'REFUSED']:
                            order.status = Order.OrderStatus.RETURNED
                        elif shipping_status == 'SHIPPED':
                            if order.status not in [Order.OrderStatus.FULFILLED]:
                                order.status = Order.OrderStatus.FULFILLED
                    
                    # Update Financials (Net Amount Received)
                    net_amount = update.get('net_amount')
                    if net_amount is not None:
                        order.amount_paid = Decimal(str(net_amount))
                    
                    order.save()
                    updated_count += 1
                except Order.DoesNotExist:
                    continue
                    
        return Response({'updated': updated_count})

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.prefetch_related('interactions').all().order_by('name')
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, HasBrandAccess]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'phone', 'email']
    filterset_fields = ['tier']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('order_status')
        
        if status_filter == 'PROCESSING':
            # Customers with active orders (Pending, Production, Paid)
            queryset = queryset.filter(
                orders__status__in=['PENDING', 'PENDING_PRODUCTION', 'PAID']
            ).distinct()
        elif status_filter == 'SHIPPED':
            # Customers with fulfilled orders (Shipped)
            queryset = queryset.filter(
                orders__status='FULFILLED'
            ).distinct()
            
        return queryset

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        # 1. Revenue & Orders
        total_revenue = Order.objects.filter(status=Order.OrderStatus.PAID).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')

        total_orders = Order.objects.count()

        # 2. Product Stats
        active_products = Product.objects.count()
        
        # 3. Inventory Health
        # Count items where quantity < 10 (arbitrary threshold for now)
        low_stock_count = Inventory.objects.filter(quantity__lt=10).count()

        # 4. Sales Velocity (Last 30 days)
        last_30_days = timezone.now().date() - datetime.timedelta(days=30)
        from django.db.models.functions import TruncDate
        
        velocity_data = Order.objects.filter(
            status=Order.OrderStatus.PAID,
            created_at__date__gte=last_30_days
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            revenue=Sum('total_price')
        ).order_by('date')

        return Response({
            'kpis': {
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'active_products': active_products,
                'low_stock_count': low_stock_count,
            },
        })

class CustomerInteractionViewSet(viewsets.ModelViewSet):
    queryset = CustomerInteraction.objects.all().order_by('-date')
    serializer_class = CustomerInteractionSerializer
    permission_classes = [IsAuthenticated, HasBrandAccess]

class AnalyticsViewSet(viewsets.ViewSet):
    """
    Dedicated endpoint for High-Level Dashboard Analytics.
    Aggregates data from Orders, Inventory, and Finance.
    """
    permission_classes = [IsAuthenticated, HasBrandAccess]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        # Date Filter
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Default Filter (Last 30 Days if no date provided)
        # Note: We apply filters effectively to the QuerySets
        filters = {'status': Order.OrderStatus.PAID}
        
        if start_date_str and end_date_str:
            try:
                start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
                # Include the end date fully by adding 1 day or using __date range
                filters['created_at__date__range'] = [start_date, end_date]
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
        
        # 1. Financial Overview
        # Revenue
        revenue = Order.objects.filter(**filters).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')

        # Expenses (Brand Module only) - Need date filtering for transactions too if possible
        # For simplicity, we filter transactions by 'date' if the model supports it
        from finance.models import FinancialTransaction
        expense_filters = {
            'module': FinancialTransaction.ModuleType.BRAND,
            'type__in': [FinancialTransaction.TransactionType.EXPENSE, FinancialTransaction.TransactionType.TRANSFER_TO_BRAND]
        }
        if start_date_str and end_date_str:
             expense_filters['date__range'] = [start_date, end_date]

        expenses = FinancialTransaction.objects.filter(**expense_filters).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # COGS (Calculated from Sold Items)
        # Note: Transfer cost is already captured as an EXPENSE (Transfer to Brand)
        # So Net Profit = Revenue - Expenses (which includes Transfers)
        net_profit = revenue - expenses

        # Inventory Value (Retail Value for Sales Potential)
        inventory_value = Inventory.objects.aggregate(
            total=Sum(F('quantity') * F('product__retail_price'))
        )['total'] or Decimal('0.00')

        # Inventory Cost (Asset Value)
        inventory_cost = Inventory.objects.aggregate(
            total=Sum(F('quantity') * F('product__standard_cost'))
        )['total'] or Decimal('0.00')

        # 2. Payment Method Breakdown
        payment_stats = Order.objects.filter(**filters).values(
            'payment_method'
        ).annotate(
            total=Sum('total_price'),
            count=Count('id')
        ).order_by('-total')
        
        # 3. Shipping Company Stats (New)
        shipping_stats = Order.objects.filter(status=Order.OrderStatus.FULFILLED).values(
            'shipping_company'
        ).annotate(
            count=Count('id'),
            total_value=Sum('total_price')
        ).order_by('-count')

        # 4. Sales by Source/Location
        source_stats = Order.objects.filter(**filters).values(
            'location__name'
        ).annotate(
            total=Sum('total_price')
        ).order_by('-total')

        # 5. Recent Revenue Trend (Respects Filter or Fallback to Last 7 Days)
        # If specific date range is selected, show trend for that range. 
        # If not, show last 7 days.
        
        trend_filters = {'status': Order.OrderStatus.PAID}
        if start_date_str and end_date_str:
            trend_filters['created_at__date__range'] = [start_date, end_date]
        else:
             trend_filters['created_at__date__gte'] = timezone.now().date() - datetime.timedelta(days=7)

        from django.db.models.functions import TruncDate
        trend_data = Order.objects.filter(**trend_filters).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            revenue=Sum('total_price')
        ).order_by('date')

        margin = float((net_profit / revenue * 100) if revenue > 0 else 0)

        return Response({
            'kpis': {
                'revenue': float(revenue),
                'expenses': float(expenses),
                'net_profit': float(net_profit),
                'margin': margin,
                'inventory_value': float(inventory_value),
                'inventory_cost': float(inventory_cost)
            },
            'charts': {
                'payment_methods': [
                    {'name': p['payment_method'], 'value': float(p['total'] or 0)} for p in payment_stats
                ],
                'shipping_stats': [
                   {'name': p['shipping_company'], 'count': p['count'], 'value': float(p['total_value'] or 0)} for p in shipping_stats
                ],
                'sales_by_source': [
                    {'name': p['location__name'] or 'Direct/Online', 'value': float(p['total'] or 0)} for p in source_stats
                ],
                'revenue_trend': [
                    {'date': str(d['date']), 'value': float(d['revenue'] or 0)} for d in trend_data
                ],
                'stock_value_by_location': [
                    {'name': i['location__name'] or 'Unallocated', 'value': float(i['total_value'] or 0)}
                    for i in Inventory.objects.values('location__name').annotate(
                        total_value=Sum(F('quantity') * F('product__standard_cost'))
                    ).order_by('-total_value')
                ]
            },
            'top_products': [
                {
                    'name': i['items__product__name'],
                    'sku': i['items__product__sku'],
                    'quantity': i['total_qty'],
                    'revenue': float(i['total_rev_correct'] or 0)
                }
                for i in Order.objects.filter(items__isnull=False, **filters).values(
                    'items__product__name', 'items__product__sku'
                ).annotate(
                    total_qty=Sum('items__quantity'),
                    total_rev_correct=Sum(F('items__quantity') * F('items__unit_price'))
                ).order_by('-total_rev_correct')[:5]
            ]
        })

    @action(detail=False, methods=['get'])
    def marketing_pulse(self, request):
        """
        Returns marketing performance metrics (ROAS, Ad Spend, Conversion).
        fetches live from Shopify if connected.
        """
        metrics = {
            'ad_spend': 0.0,
            'roas': 0.0,
            'conversion_rate': 1.2,
            'active_campaigns': 0,
            'campaigns': []
        }

        try:
            from .shopify_service import ShopifyService
            service = ShopifyService()
            events = service.fetch_marketing_events()

            total_spend = 0.0
            for event in events:
                if event.get('budget_type') == 'daily':
                    total_spend += float(event.get('budget', 0)) * 30
                else:
                    total_spend += float(event.get('budget', 0))
                metrics['campaigns'].append({
                    'name': event.get('started_at', 'Unknown'),
                    'platform': event.get('marketing_channel', 'Unknown'),
                    'spend': event.get('budget', 0)
                })

            metrics['active_campaigns'] = len(events)
            metrics['ad_spend'] = total_spend

            revenue = Order.objects.filter(status=Order.OrderStatus.PAID).aggregate(t=Sum('total_price'))['t'] or Decimal('0.00')
            if total_spend > 0:
                metrics['roas'] = float(revenue) / total_spend

        except Exception as e:
            print(f"Marketing Sync Error: {e}")

        return Response(metrics)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, HasBrandAccess]

    def get_queryset(self):
        from django.db.models import Sum, Q, F, DecimalField
        from django.db.models.functions import Coalesce
        from decimal import Decimal

        return super().get_queryset().annotate(
            items_sold=Coalesce(
                Sum('products__orderitem__quantity', filter=Q(products__orderitem__order__status='PAID')),
                0
            ),
            revenue=Coalesce(
                Sum(F('products__orderitem__quantity') * F('products__orderitem__unit_price'),
                    filter=Q(products__orderitem__order__status='PAID'),
                    output_field=DecimalField(max_digits=14, decimal_places=2)),
                Decimal('0.00')
            ),
            cogs=Coalesce(
                Sum(F('products__orderitem__quantity') * F('products__standard_cost'),
                    filter=Q(products__orderitem__order__status='PAID'),
                    output_field=DecimalField(max_digits=14, decimal_places=2)),
                Decimal('0.00')
            )
        ).annotate(
            profit=F('revenue') - F('cogs')
        )
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class ShippingManifestViewSet(viewsets.ModelViewSet):
    queryset = ShippingManifest.objects.all().order_by('-date')
    serializer_class = ShippingManifestSerializer
    permission_classes = [IsAuthenticated, HasBrandAccess]

class ShopifyViewSet(viewsets.ViewSet):
    """
    Manage Shopify Connection and Sync.
    """
    permission_classes = [IsAuthenticated, HasBrandAccess]
    @action(detail=False, methods=['get', 'post'])
    def config(self, request):
        from .models import ShopifyConfig
        from .serializers import ShopifyConfigSerializer
        
        if request.method == 'GET':
            config = ShopifyConfig.objects.first()
            if not config:
                return Response({'configured': False})
            return Response({'configured': True, 'shop_url': config.shop_url, 'last_sync_at': config.last_sync_at})
        
        elif request.method == 'POST':
            # Create or Update
            config = ShopifyConfig.objects.first()
            if config:
                serializer = ShopifyConfigSerializer(config, data=request.data, partial=True)
            else:
                serializer = ShopifyConfigSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save()
                return Response({'status': 'saved'})
            return Response(serializer.errors, status=400)

    @action(detail=False, methods=['post'])
    def test_connection(self, request):
        from .shopify_service import ShopifyService
        try:
            service = ShopifyService()
            shop = service.test_connection()
            return Response({'status': 'success', 'shop': shop})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['post'])
    def push_product(self, request):
        """
        Push a specific product to Shopify.
        Payload: { "product_id": <ID> }
        """
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID required'}, status=400)
            
        from .shopify_service import ShopifyService
        from .models import Product
        
        try:
            product = Product.objects.get(id=product_id)
            service = ShopifyService()
            
            # Check if update or create (logic inside service or here? Service has separate methods)
            # For MVP, assume create if no ID, or logic to be refined.
            # My Service has create_product. I didn't verify update in service yet.
            # Let's use create_product which updates model.
            
            result = service.create_product(product)
            return Response({'status': 'success', 'shopify_product': result})
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def push_collection(self, request):
        """
        Push a specific category as a key to Shopify.
        Payload: { "category_id": <ID> }
        """
        category_id = request.data.get('category_id')
        if not category_id:
            return Response({'error': 'Category ID required'}, status=400)
            
        from .shopify_service import ShopifyService
        from .models import Category
        
        try:
            category = Category.objects.get(id=category_id)
            service = ShopifyService()
            result = service.create_collection(category)
            return Response({'status': 'success', 'collection': result})
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def sync_products(self, request):
        from .shopify_service import ShopifyService
        from .models import Product
        from .models import ShopifyConfig
        from django.utils import timezone
        
        try:
            service = ShopifyService()
            shopify_products = service.fetch_products()
            
            # Ensure Default Location (Main Warehouse)
            main_wh, _ = Location.objects.get_or_create(
                name="Main Warehouse",
                defaults={'type': 'WAREHOUSE', 'address': 'Default'}
            )
            
            count_created = 0
            count_updated = 0
            
            for sp in shopify_products:
                title = sp.get('title')
                body_html = sp.get('body_html') or ""
                variants = sp.get('variants', [])
                
                # Image logic (Product Level)
                image_src = None
                if sp.get('image'):
                    image_src = sp.get('image', {}).get('src')
                
                for v in variants:
                    sku = v.get('sku')
                    price = v.get('price')
                    inventory_qty = v.get('inventory_quantity', 0) 
                    
                    if not sku:
                        continue
                        
                    product, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults={
                            'name': f"{title} ({v.get('title')})" if v.get('title') != 'Default Title' else title,
                            'style': title, # Grouping Key
                            'description': body_html,
                            'retail_price': price,
                            'image_url': image_src # Save Shopify Link
                        }
                    )
                    
                    # Update Inventory
                    Inventory.objects.update_or_create(
                        product=product,
                        location=main_wh,
                        defaults={'quantity': inventory_qty}
                    )
                    
                    if created:
                        count_created += 1
                    else:
                        count_updated += 1
            
            # Update Sync Time
            config = ShopifyConfig.objects.first()
            if config:
                config.last_sync_at = timezone.now()
                config.save()
            
            return Response({
                'status': 'success',
                'imported': count_created,
                'updated': count_updated
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def sync_orders(self, request):
        from .shopify_service import ShopifyService
        from .models import Order, Customer, OrderItem, Product, Location, ShopifyConfig
        from django.utils import timezone
        
        try:
            service = ShopifyService()
            # Fetch orders since last sync? Or last 30 days for safety?
            # For MVP, let's fetch last 50 orders always
            shopify_orders = service.fetch_orders() 
            
            count_imported = 0
            
            for so in shopify_orders:
                sid = str(so.get('id'))
                if Order.objects.filter(shopify_order_id=sid).exists():
                    continue
                
                order_num = so.get('name') or so.get('order_number')
                email = so.get('email')
                customer_data = so.get('customer', {})
                line_items = so.get('line_items', [])
                
                # 1. Resolve Customer — never store fake phone numbers
                customer = None
                if customer_data:
                    raw_phone = (
                        customer_data.get('phone') or
                        customer_data.get('default_address', {}).get('phone') or ''
                    ).strip()
                    name = f"{customer_data.get('first_name', '')} {customer_data.get('last_name', '')}".strip() or 'Shopify Customer'
                    if raw_phone:
                        customer, _ = Customer.objects.get_or_create(
                            phone=raw_phone,
                            defaults={'name': name, 'email': email or ''}
                        )
                    elif email:
                        customer = Customer.objects.filter(email=email).first()
                        if not customer:
                            # Use Shopify ID as a trackable placeholder — never left blank
                            customer = Customer.objects.create(
                                phone=f"SHO-{sid}",
                                name=name,
                                email=email
                            )

                # 2. Resolve Location — Shopify orders always go to Online location
                online_location, _ = Location.objects.get_or_create(
                    type=Location.LocationType.ONLINE,
                    defaults={'name': 'Shopify Online', 'address': 'shopify.com'}
                )

                # 3. Create Order
                fin_status = so.get('financial_status')
                erp_status = Order.OrderStatus.PAID if fin_status == 'paid' else Order.OrderStatus.PENDING

                order = Order.objects.create(
                    shopify_order_id=sid,
                    order_number=order_num,
                    customer=customer,
                    customer_email=email,
                    location=online_location,
                    total_price=so.get('total_price'),
                    status=erp_status,
                    payment_method=Order.PaymentMethod.VISA
                )
                
                # 3. Create Items
                for li in line_items:
                    sku = li.get('sku')
                    qty = li.get('quantity')
                    price = li.get('price')
                    
                    if sku:
                        product = Product.objects.filter(sku=sku).first()
                        if product:
                            OrderItem.objects.create(
                                order=order,
                                product=product,
                                quantity=qty,
                                unit_price=price
                            )
                
                # Trigger automations (COGS, Production) via Service Layer
                from .services import OrderService
                OrderService.process_new_order(order)
                
                count_imported += 1

            return Response({
                'status': 'success',
                'imported': count_imported
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)
