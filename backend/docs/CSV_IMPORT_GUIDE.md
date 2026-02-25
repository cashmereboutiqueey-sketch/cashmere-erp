# CSV Import Guide

## Overview
You can now bulk import Products and Raw Materials from Excel/CSV files via the API.

## Endpoints

### Products

**Download Template:**
```
GET /api/brand/products/download_template/
```
Downloads a CSV template with sample data

**Import CSV:**
```
POST /api/brand/products/import_csv/
Content-Type: multipart/form-data

file: <your_csv_file>
update_existing: true  (optional, default: true)
```

### Raw Materials  

**Download Template:**
```
GET /api/factory/materials/download_template/
```

**Import CSV:**
```
POST /api/factory/materials/import_csv/
Content-Type: multipart/form-data

file: <your_csv_file>
update_existing: true  (optional, default: true)
```

---

## CSV Format

### Products CSV

**Required Columns:**
- `name` - Product name
- `sku` - Unique product SKU
- `category_id` - ID of existing category

**Optional Columns:**
- `description`
- `retail_price`
- `standard_cost`
- `barcode`
- `brand_overhead`
- `brand_profit_margin`
- `image_url`

**Example:**
```csv
name,sku,category_id,description,retail_price,standard_cost,barcode
Classic T-Shirt,TS-001,1,Premium cotton t-shirt,299.99,150.00,1234567890123
Cashmere Sweater,SW-002,2,Luxury cashmere sweater,1499.99,750.00,9876543210987
```

### Raw Materials CSV

**Required Columns:**
- `name` - Material name
- `sku` - Unique material SKU
- `unit` - Unit of measurement (kg, g, L, mL, m, cm, pcs, yards, meters)

**Optional Columns:**
- `description`
- `unit_cost`
- `supplier_id` - ID of existing supplier
- `reorder_level`
- `current_stock`

**Example:**
```csv
name,sku,unit,description,unit_cost,supplier_id,reorder_level,current_stock
Cotton Fabric,CTN-001,meters,Premium cotton fabric,45.50,1,100,500
Cashmere Yarn,CSH-002,kg,Fine cashmere yarn,850.00,2,50,200
Buttons,BTN-003,pcs,Metal buttons,2.50,1,500,1000
```

---

## Using with Postman/Thunder Client

1. **Get Template**:
   - GET `http://localhost:8000/api/brand/products/download_template/`
   - Save the CSV file
   - Fill in your data

2. **Upload CSV**:
   - POST `http://localhost:8000/api/brand/products/import_csv/`
   - Headers: `Authorization: Bearer <your_token>`
   - Body: form-data
     - Key: `file`, Type: File, Value: select your CSV
     - Key: `update_existing`, Type: Text, Value: `true`

---

## Using with Python

```python
import requests

# Download template
response = requests.get(
    'http://localhost:8000/api/brand/products/download_template/',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)
with open('template.csv', 'wb') as f:
    f.write(response.content)

# Import CSV
with open('my_products.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/brand/products/import_csv/',
        headers={'Authorization': 'Bearer YOUR_TOKEN'},
        files={'file': f},
        data={'update_existing': 'true'}
    )
    
print(response.json())
# {
#   "success": true,
#   "message": "Successfully imported 15 products, updated 3 products",
#   "created": 15,
#   "updated": 3,
#   "warnings": ["Row 5: Product with SKU 'TS-001' already exists - will update"]
# }
```

---

## Validation Rules

### Both Products & Materials:
✅ Validates required fields are present  
✅ Checks SKU uniqueness (updates if exists and `update_existing=true`)  
✅ Validates numeric fields are positive  
✅ Validates foreign key references (category_id, supplier_id)  
✅ Row-by-row error reporting with line numbers  

### Products Specific:
✅ Category must exist in database  
✅ Prices must be non-negative  

### Materials Specific:
✅ Unit must be one of: kg, g, L, mL, m, cm, pcs, yards, meters  
✅ Supplier (if provided) must exist  

---

## Error Handling

**Validation Errors:**
```json
{
  "success": false,
  "errors": [
    "Row 3: Missing required field 'sku'",
    "Row 5: Invalid category_id '999'",
    "Row 8: retail_price must be non-negative"
  ],
  "warnings": []
}
```

**File Errors:**
```json
{
  "error": "Missing required columns: name, sku"
}
```

---

## Tips

1. **Test First**: Download the template to see the exact format
2. **Check IDs**: Make sure category_id and supplier_id exist in your database first
3. **Update Mode**: Set `update_existing=false` if you want to skip duplicates instead of updating
4. **Backup**: Export your current data before doing bulk imports
5. **Small Batches**: Start with small test files before importing hundreds of rows

---

## Preparing Excel Data

1. In Excel, format your data with column headers matching the required fields
2. Save As → CSV (Comma delimited) (*.csv)
3. Upload the CSV file

**Important**: Excel may add extra quotes or formatting - open the CSV in a text editor to verify it looks correct before importing.
