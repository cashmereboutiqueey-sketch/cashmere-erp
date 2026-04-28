from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Supplier, RawMaterial, BOM, ProductionJob, MaterialPurchase, SupplierPayment, Worker, WorkerAttendance, ProductionLog
from django.db import transaction
from django.db.models import Count, Sum, Q, F
from decimal import Decimal
from django.utils import timezone
import datetime
from .serializers import (
    SupplierSerializer, RawMaterialSerializer, BOMSerializer, ProductionJobSerializer, 
    MaterialPurchaseSerializer, SupplierPaymentSerializer,
    WorkerSerializer, WorkerAttendanceSerializer, ProductionLogSerializer
)

class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.filter(active=True).order_by('name')
    serializer_class = WorkerSerializer

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        
        # 1. Total Active Workers
        total_workers = Worker.objects.filter(active=True).count()
        
        # 2. Total Hours Today
        total_hours_today = WorkerAttendance.objects.filter(date=today).aggregate(
            total=Sum('hours_worked')
        )['total'] or 0
        
        # 3. Total Production Today
        total_production_today = ProductionLog.objects.filter(date=today).aggregate(
            total=Sum('quantity')
        )['total'] or 0

        return Response({
            'total_workers': total_workers,
            'total_hours_today': total_hours_today,
            'total_production_today': total_production_today
        })

    @action(detail=False, methods=['get'])
    def payroll(self, request):
        """
        Calculate payroll for a given date range.
        Query Params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
        """
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if not start_date_str or not end_date_str:
            # Default to current month
            today = timezone.now().date()
            start_date = today.replace(day=1)
            end_date = today
        else:
            try:
                start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)

        workers = Worker.objects.filter(active=True)
        payroll_data = []
        
        for worker in workers:
            total_hours = WorkerAttendance.objects.filter(
                worker=worker,
                date__range=[start_date, end_date]
            ).aggregate(total=Sum('hours_worked'))['total'] or Decimal('0.00')
            
            total_pay = total_hours * worker.hourly_rate
            
            payroll_data.append({
                'id': worker.id,
                'name': worker.name,
                'role': worker.role,
                'hourly_rate': float(worker.hourly_rate),
                'total_hours': float(total_hours),
                'total_pay': float(total_pay),
            })
            
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'payroll': payroll_data
        })

    @action(detail=False, methods=['post'])
    def pay_payroll(self, request):
        """
        Calculates payroll for the period and records it as an Expense.
        Query Params: start_date, end_date
        """
        # Reuse payroll logic or extract it? safely re-implement for transaction atomic
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if not start_date_str or not end_date_str:
            return Response({'error': 'Start and End dates are required'}, status=400)
            
        try:
            start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=400)

        # Calculate Total
        workers = Worker.objects.filter(active=True)
        total_payroll_amount = Decimal('0.00')
        
        for worker in workers:
            total_hours = WorkerAttendance.objects.filter(
                worker=worker,
                date__range=[start_date, end_date]
            ).aggregate(total=Sum('hours_worked'))['total'] or Decimal('0.00')
            
            total_payroll_amount += total_hours * worker.hourly_rate

        if total_payroll_amount <= 0:
            return Response({'error': 'No payroll amount to process for this period'}, status=400)

        # Create Finance Transaction
        # We need to import FinancialTransaction safely
        try:
            from finance.models import FinancialTransaction
            
            with transaction.atomic():
                ref_id = f"PAYROLL-{start_date}-{end_date}"
                if FinancialTransaction.objects.filter(reference_id=ref_id).exists():
                    return Response(
                        {'error': f'Payroll for {start_date} to {end_date} has already been processed.'},
                        status=400
                    )

                ft = FinancialTransaction.objects.create(
                    module=FinancialTransaction.ModuleType.FACTORY,
                    type=FinancialTransaction.TransactionType.EXPENSE,
                    amount=total_payroll_amount,
                    description=f"Payroll for {start_date} to {end_date}",
                    category="Salaries",
                    reference_id=ref_id,
                    date=timezone.now().date()
                )

                return Response({
                    'status': 'success',
                    'message': f'Payroll of {total_payroll_amount} EGP recorded successfully.',
                    'transaction_id': ft.id
                })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class WorkerAttendanceViewSet(viewsets.ModelViewSet):
    queryset = WorkerAttendance.objects.select_related('worker').all().order_by('-date')
    serializer_class = WorkerAttendanceSerializer
    filterset_fields = ['worker', 'date']

class ProductionLogViewSet(viewsets.ModelViewSet):
    queryset = ProductionLog.objects.select_related('worker', 'job').all().order_by('-date')
    serializer_class = ProductionLogSerializer
    filterset_fields = ['worker', 'date', 'job']

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer

class MaterialPurchaseViewSet(viewsets.ModelViewSet):
    queryset = MaterialPurchase.objects.select_related('supplier', 'raw_material').all().order_by('-date')
    serializer_class = MaterialPurchaseSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        purchase = serializer.save()

        if purchase.amount_paid > 0:
            from finance.models import FinancialTransaction
            FinancialTransaction.objects.create(
                module=FinancialTransaction.ModuleType.FACTORY,
                type=FinancialTransaction.TransactionType.EXPENSE,
                amount=purchase.amount_paid,
                description=f"Purchase from {purchase.supplier.name} ({purchase.raw_material.name})",
                category="Raw Material",
                reference_id=f"PURCH-{purchase.supplier.id}-{purchase.id}"
            )

class SupplierPaymentViewSet(viewsets.ModelViewSet):
    queryset = SupplierPayment.objects.select_related('supplier').all().order_by('-date')
    serializer_class = SupplierPaymentSerializer

class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.select_related('supplier').all().order_by('name')
    serializer_class = RawMaterialSerializer

    def perform_create(self, serializer):
        # 1. Capture Virtual Fields
        initial_stock = serializer.initial_data.get('current_stock', 0)
        amount_paid = serializer.initial_data.get('amount_paid', 0)
        
        # 2. Force stock to 0 initially (Purchase will add it)
        # We need to treat 'current_stock' in validated_data as 0 if we are using the Purchase flow
        # However, serializer.save() uses validated_data.
        # Let's just save the material first.
        
        # If stock is provided, we want to route it through Purchase
        # So we force the material to start at 0
        if float(initial_stock) > 0:
            serializer.save(current_stock=0)
            material = serializer.instance
            
            # 3. Create Purchase for Initial Stock
            try:
                MaterialPurchase.objects.create(
                    supplier=material.supplier,
                    raw_material=material,
                    quantity=Decimal(str(initial_stock)),
                    cost_per_unit=material.cost_per_unit,
                    amount_paid=Decimal(str(amount_paid)),
                    notes="Initial Opening Stock"
                )
                # The Purchase.save() logic (which we fixed) will:
                # 1. Update Material Stock (+qty)
                # 2. Update Supplier Balance (Debt)
                # 3. Create Expense Transaction
                
            except Exception as e:
                print(f"Error creating initial stock purchase: {e}")
        else:
            serializer.save()
    
    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        """
        Import raw materials from CSV file
        
        Expected file upload with key 'file'
        Optional parameter: update_existing (default: true)
        """
        from .csv_import import RawMaterialCSVImporter, CSVImportError
        from django.http import HttpResponse
        
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response(
                {'error': 'No file provided. Please upload a CSV file with key "file"'},
                status=400
            )
        
        update_existing = request.data.get('update_existing', 'true').lower() == 'true'
        
        try:
            importer = RawMaterialCSVImporter(csv_file)
            result = importer.process(update_existing=update_existing, dry_run=False)
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': f"Successfully imported {result['created']} materials, updated {result['updated']} materials",
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
        Download a CSV template for raw material import
        """
        from .csv_import import generate_material_csv_template
        from django.http import HttpResponse
        
        csv_content = generate_material_csv_template()
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="raw_material_import_template.csv"'
        return response

class BOMViewSet(viewsets.ModelViewSet):
    queryset = BOM.objects.prefetch_related('items__raw_material').all()
    serializer_class = BOMSerializer

    def create(self, request, *args, **kwargs):
        # 1. Standard Create
        response = super().create(request, *args, **kwargs)
        if response.status_code != 201:
            return response

        # 2. Check for variant propagation
        if request.data.get('apply_to_variants'):
            try:
                from .models import BOMItem
                from brand.models import Product
                
                product_id = request.data.get('product')
                items_data = request.data.get('items', [])
                
                # Find sibling variants (Same name, different ID)
                primary = Product.objects.get(id=product_id)
                variants = Product.objects.filter(name=primary.name).exclude(id=primary.id)
                
                for variant in variants:
                    # Create or Get BOM for variant
                    bom, _ = BOM.objects.get_or_create(product=variant)
                    
                    # Clear existing items to overwrite
                    bom.items.all().delete()
                    
                    # Duplicate items
                    for item in items_data:
                        BOMItem.objects.create(
                            bom=bom,
                            raw_material_id=item['raw_material'],
                            quantity=item['quantity'],
                        )
            except Exception as e:
                # Log error but don't fail the main request (or returning warning?)
                # For now, we just print
                print(f"Error propagating BOM: {e}")

        # 3. Update Product Pricing (Factory Side)
        try:
            from brand.models import Product
            from finance.models import ProductCosting
            
            product_id = request.data.get('product')
            factory_margin = Decimal(str(request.data.get('factory_margin', 0)))
            labor_cost = Decimal(str(request.data.get('labor_cost', 0)))
            overhead_cost = Decimal(str(request.data.get('overhead_cost', 0)))
            
            # Recalculate BOM Cost (Materials Only)
            bom_material_cost = Decimal('0.00')
            items_data = request.data.get('items', [])
            
            # Re-fetch materials costs for safety
            from .models import RawMaterial
            material_ids = [item['raw_material'] for item in items_data]
            materials = {m.id: m.cost_per_unit for m in RawMaterial.objects.filter(id__in=material_ids)}
            
            for item in items_data:
                mat_id = item['raw_material']
                qty = Decimal(str(item['quantity']))
                waste = Decimal(str(item.get('waste_percentage', 0)))
                cost = materials.get(mat_id, 0)
                
                line_cost = cost * qty * (1 + waste / 100)
                bom_material_cost += line_cost
                
            # Update Costing Model
            prod = Product.objects.get(id=product_id)
            costing, _ = ProductCosting.objects.get_or_create(product=prod)
            costing.direct_labor_cost = labor_cost
            costing.overhead_allocation = overhead_cost
            costing.factory_margin_percent = factory_margin
            costing.save()
            
            # The ProductCosting model handles the calculation of 'true_cost' and 'transfer_price'
            # We just need to sync the transfer price to the Product.standard_cost field for reference
            prod.factory_margin = factory_margin
            prod.standard_cost = costing.transfer_price 
            prod.save()
            
        except Exception as e:
            print(f"Error updating product pricing: {e}")

        return response

class ProductionJobViewSet(viewsets.ModelViewSet):
    queryset = ProductionJob.objects.select_related('product', 'source_order').all().order_by('-created_at')
    serializer_class = ProductionJobSerializer

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        job = self.get_object()
        try:
            job.start_production()
            return Response(self.get_serializer(job).data)
        except Exception as e:
            # Clean up error message for frontend
            msg = e.message if hasattr(e, 'message') else str(e)
            if hasattr(e, 'messages'): # Django ValidationError list
                msg = e.messages[0]
            # Remove brackets if it's a stringified list
            if isinstance(msg, str) and msg.startswith("['") and msg.endswith("']"):
                msg = msg[2:-2]
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        job = self.get_object()
        try:
            job.complete_production()
            return Response(self.get_serializer(job).data)
        except Exception as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            if hasattr(e, 'messages'):
                msg = e.messages[0]
            if isinstance(msg, str) and msg.startswith("['") and msg.endswith("']"):
                msg = msg[2:-2]
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def velocity(self, request):
        """
        Returns production velocity (quantity completed per day).
        """
        from django.db.models.functions import TruncDate
        from django.db.models import Sum
        
        data = ProductionJob.objects.filter(
            status=ProductionJob.JobStatus.COMPLETED
        ).annotate(
            date=TruncDate('end_date')
        ).values('date').annotate(
            quantity=Sum('quantity')
        ).order_by('date')
        return Response([
            {'date': d['date'], 'quantity': d['quantity']} 
            for d in data if d['date'] is not None
        ])

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        # 1. Job Stats
        active_jobs = ProductionJob.objects.filter(
            status__in=[ProductionJob.JobStatus.IN_PROGRESS, ProductionJob.JobStatus.QC]
        ).count()
        
        pending_jobs = ProductionJob.objects.filter(
            status=ProductionJob.JobStatus.PENDING
        ).count()

        # 2. Inventory Health
        # Count raw materials below minimum stock
        low_stock_materials = RawMaterial.objects.filter(
            current_stock__lt=F('minimum_stock_level')
        ).count()

        # 3. Completed Production Value (This Month)
        # Using a tough approximation since we track value on Transfer, 
        # but let's just sum quantity * cost for now or just quantity
        this_month = timezone.now().date().replace(day=1)
        completed_qty_this_month = ProductionJob.objects.filter(
            status=ProductionJob.JobStatus.COMPLETED,
            end_date__gte=this_month
        ).aggregate(total=Sum('quantity'))['total'] or 0

        # 4. Production Velocity (Last 30 Days)
        last_30_days = timezone.now().date() - datetime.timedelta(days=30)
        velocity_data = ProductionJob.objects.filter(
            status=ProductionJob.JobStatus.COMPLETED,
            end_date__gte=last_30_days
        ).values('end_date').annotate(
            quantity=Sum('quantity')
        ).order_by('end_date')

        return Response({
            'kpis': {
                'active_jobs': active_jobs,
                'pending_jobs': pending_jobs,
                'low_stock_materials': low_stock_materials,
                'completed_qty_this_month': completed_qty_this_month
            },
            'production_velocity': [
                {'date': d['end_date'], 'value': d['quantity']}
                for d in velocity_data if d['end_date'] is not None
            ]
        })
