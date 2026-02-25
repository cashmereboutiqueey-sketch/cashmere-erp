"""
CSV Import utilities for Factory module
Handles validation and bulk import of Raw Materials from CSV files
"""
import csv
import io
from typing import List, Dict, Any, Tuple
from django.db import transaction
from .models import RawMaterial, Supplier


class CSVImportError(Exception):
    """Custom exception for CSV import errors"""
    pass


class RawMaterialCSVImporter:
    """
    Handles CSV import for RawMaterial model
    
    Expected CSV Format:
    name, sku, unit, description, unit_cost, supplier_id, reorder_level, current_stock
    """
    
    REQUIRED_FIELDS = ['name', 'sku', 'unit']
    OPTIONAL_FIELDS = ['description', 'unit_cost', 'supplier_id', 'reorder_level', 'current_stock']
    VALID_UNITS = ['kg', 'g', 'L', 'mL', 'm', 'cm', 'pcs', 'yards', 'meters']
    
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
        
        # Validate unit
        if cleaned_data['unit'] not in self.VALID_UNITS:
            self.errors.append(
                f"Row {row_num}: Invalid unit '{cleaned_data['unit']}'. "
                f"Must be one of: {', '.join(self.VALID_UNITS)}"
            )
            return False, {}
        
        # Check SKU uniqueness
        sku = cleaned_data['sku']
        existing = RawMaterial.objects.filter(sku=sku).first()
        if existing:
            self.warnings.append(f"Row {row_num}: Material with SKU '{sku}' already exists - will update")
            cleaned_data['_update_existing'] = existing
        
        # Validate supplier if provided
        supplier_id = row.get('supplier_id', '').strip()
        if supplier_id:
            try:
                supplier = Supplier.objects.get(id=int(supplier_id))
                cleaned_data['supplier'] = supplier
            except (Supplier.DoesNotExist, ValueError):
                self.errors.append(f"Row {row_num}: Invalid supplier_id '{supplier_id}'")
                return False, {}
        
        # Process optional numeric fields
        for field in ['unit_cost', 'reorder_level', 'current_stock']:
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
        
        # Process description
        description = row.get('description', '').strip()
        if description:
            cleaned_data['description'] = description
        
        return True, cleaned_data
    
    def process(self, update_existing=True, dry_run=False) -> Dict[str, Any]:
        """
        Process the CSV file and import raw materials
        
        Args:
            update_existing: If True, update existing materials with matching SKU
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
        
        # Save materials (if not dry run)
        if not dry_run:
            with transaction.atomic():
                for data in validated_rows:
                    update_existing_material = data.pop('_update_existing', None)
                    supplier = data.pop('supplier', None)
                    
                    if update_existing_material and update_existing:
                        # Update existing
                        for key, value in data.items():
                            setattr(update_existing_material, key, value)
                        if supplier:
                            update_existing_material.supplier = supplier
                        update_existing_material.save()
                        self.update_count += 1
                    else:
                        # Create new
                        material = RawMaterial.objects.create(**data)
                        if supplier:
                            material.supplier = supplier
                            material.save()
                        self.success_count += 1
        
        return {
            'success': True,
            'errors': [],
            'warnings': self.warnings,
            'created': self.success_count,
            'updated': self.update_count,
            'total_rows': len(validated_rows)
        }


def generate_material_csv_template() -> str:
    """Generate a sample Raw Material CSV template"""
    headers = RawMaterialCSVImporter.REQUIRED_FIELDS + RawMaterialCSVImporter.OPTIONAL_FIELDS
    sample_row = [
        'Cotton Fabric',  # name
        'CTN-001',  # sku
        'meters',  # unit
        'Premium cotton fabric for t-shirts',  # description
        '45.50',  # unit_cost
        '1',  # supplier_id (check your suppliers)
        '100',  # reorder_level
        '500'  # current_stock
    ]
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample_row)
    
    return output.getvalue()
