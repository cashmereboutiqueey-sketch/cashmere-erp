"""
CSV Import utilities for Brand module
Handles validation and bulk import of Products from CSV files
"""
import csv
import io
from typing import List, Dict, Any, Tuple
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Product, Category
from factory.models import Location


class CSVImportError(Exception):
    """Custom exception for CSV import errors"""
    pass


class ProductCSVImporter:
    """
    Handles CSV import for Product model
    
    Expected CSV Format:
    name, sku, category_id, description, retail_price, standard_cost, barcode, brand_overhead, brand_profit_margin
    """
    
    REQUIRED_FIELDS = ['name', 'sku', 'category_id']
    OPTIONAL_FIELDS = ['description', 'retail_price', 'standard_cost', 'barcode', 
                       'brand_overhead', 'brand_profit_margin', 'image_url']
    
    def __init__(self, csv_file):
        """
        Initialize importer with CSV file
        
        Args:
            csv_file: File object or file-like object containing CSV data
        """
        self.csv_file = csv_file
        self.errors = []
        self.warnings = []
        self.success_count = 0
        self.update_count = 0
        
    def validate_row(self, row: Dict[str, str], row_num: int) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate a single CSV row
        
        Returns:
            Tuple of (is_valid, cleaned_data)
        """
        cleaned_data = {}
        
        # Check required fields
        for field in self.REQUIRED_FIELDS:
            if not row.get(field, '').strip():
                self.errors.append(f"Row {row_num}: Missing required field '{field}'")
                return False, {}
            cleaned_data[field] = row[field].strip()
        
        # Validate category exists
        try:
            category = Category.objects.get(id=int(cleaned_data['category_id']))
            cleaned_data['category'] = category
        except (Category.DoesNotExist, ValueError):
            self.errors.append(f"Row {row_num}: Invalid category_id '{cleaned_data['category_id']}'")
            return False, {}
        
        # Check SKU uniqueness (excluding potential update)
        sku = cleaned_data['sku']
        existing = Product.objects.filter(sku=sku).first()
        if existing:
            self.warnings.append(f"Row {row_num}: Product with SKU '{sku}' already exists - will update")
            cleaned_data['_update_existing'] = existing
        
        # Process optional numeric fields
        for field in ['retail_price', 'standard_cost', 'brand_overhead', 'brand_profit_margin']:
            value = row.get(field, '').strip()
            if value:
                try:
                    cleaned_data[field] = float(value)
                    if cleaned_data[field] < 0:
                        self.errors.append(f"Row {row_num}: {field} must be non-negative")
                        return False, {}
                except ValueError:
                    self.errors.append(f"Row {row_num}: Invalid {field} value '{value}'")
                    return False, {}
        
        # Process optional text fields
        for field in ['description', 'barcode', 'image_url']:
            value = row.get(field, '').strip()
            if value:
                cleaned_data[field] = value
        
        return True, cleaned_data
    
    def process(self, update_existing=True, dry_run=False) -> Dict[str, Any]:
        """
        Process the CSV file and import products
        
        Args:
            update_existing: If True, update existing products with matching SKU
            dry_run: If True, validate only without saving
            
        Returns:
            Dictionary with import results
        """
        # Reset counters
        self.errors = []
        self.warnings = []
        self.success_count = 0
        self.update_count = 0
        
        # Read CSV
        try:
            csv_data = self.csv_file.read()
            if isinstance(csv_data, bytes):
                csv_data = csv_data.decode('utf-8')
            csv_file = io.StringIO(csv_data)
            reader = csv.DictReader(csv_file)
        except Exception as e:
            raise CSVImportError(f"Failed to read CSV file: {str(e)}")
        
        # Validate headers
        if not reader.fieldnames:
            raise CSVImportError("CSV file is empty or has no headers")
        
        missing_required = set(self.REQUIRED_FIELDS) - set(reader.fieldnames)
        if missing_required:
            raise CSVImportError(f"Missing required columns: {', '.join(missing_required)}")
        
        # Process rows
        validated_rows = []
        for idx, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
            is_valid, cleaned_data = self.validate_row(row, idx)
            if is_valid:
                validated_rows.append(cleaned_data)
        
        # If validation errors, return without saving
        if self.errors:
            return {
                'success': False,
                'errors': self.errors,
                'warnings': self.warnings,
                'created': 0,
                'updated': 0
            }
        
        # Save products (if not dry run)
        if not dry_run:
            with transaction.atomic():
                for data in validated_rows:
                    update_existing_product = data.pop('_update_existing', None)
                    category = data.pop('category')
                    
                    if update_existing_product and update_existing:
                        # Update existing
                        for key, value in data.items():
                            setattr(update_existing_product, key, value)
                        update_existing_product.category = category
                        update_existing_product.save()
                        self.update_count += 1
                    else:
                        # Create new
                        Product.objects.create(category=category, **data)
                        self.success_count += 1
        
        return {
            'success': True,
            'errors': [],
            'warnings': self.warnings,
            'created': self.success_count,
            'updated': self.update_count,
            'total_rows': len(validated_rows)
        }


def generate_product_csv_template() -> str:
    """Generate a sample Product CSV template"""
    headers = ProductCSVImporter.REQUIRED_FIELDS + ProductCSVImporter.OPTIONAL_FIELDS
    sample_row = [
        'Classic T-Shirt',  # name
        'TS-001',  # sku
        '1',  # category_id (you need to check your categories)
        'Premium cotton t-shirt',  # description
        '299.99',  # retail_price
        '150.00',  # standard_cost
        '1234567890123',  # barcode
        '50.00',  # brand_overhead
        '25.00',  # brand_profit_margin
        'https://example.com/image.jpg'  # image_url
    ]
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample_row)
    
    return output.getvalue()
