// ─── Shared API response wrapper ──────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Brand models ─────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  description: string;
  shopify_collection_id: string | null;
  last_synced_at: string | null;
  product_count: number;
  items_sold: number;
  revenue: number | null;
  profit: number | null;
}

export interface InventoryEntry {
  location: number;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  description: string;
  category: number | null;
  category_name: string | null;
  image: string | null;
  image_url: string | null;
  style: string | null;
  size: string | null;
  color: string | null;
  retail_price: number | null;
  standard_cost: number | null;
  factory_margin: number | null;
  brand_overhead: number | null;
  brand_profit_margin: number | null;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  inventory: InventoryEntry[];
  total_produced: number;
  total_sold: number;
  stock_remaining: number;
}

export interface LiteProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  image: string | null;
  inventory: InventoryEntry[];
}

export interface Location {
  id: number;
  name: string;
  type: 'WAREHOUSE' | 'SHOWROOM' | 'ONLINE' | 'EVENT';
  address: string;
  shopify_location_id: string;
  revenue: number | null;
  units_sold: number;
}

export interface Inventory {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_barcode: string | null;
  product_image: string | null;
  location: number;
  location_name: string;
  quantity: number;
  product_cost: number | null;
  product_price: number | null;
}

export interface CustomerInteraction {
  id: number;
  customer: number;
  type: 'CALL' | 'WHATSAPP' | 'VISIT' | 'PURCHASE' | 'OTHER';
  notes: string;
  staff_member: string;
  date: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  tier: 'STANDARD' | 'VIP' | 'VVIP' | 'ELITE';
  sizing_profile: Record<string, string>;
  style_preferences: string;
  birth_date: string | null;
  ltv_score: number;
  total_spent: number;
  current_debt: number;
  created_at: string;
  updated_at: string;
  interactions: CustomerInteraction[];
}

export interface OrderItem {
  id: number;
  order: number;
  product: number;
  quantity: number;
  unit_price: number | null;
  item_discount: number | null;
  returned_quantity: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer: number | null;
  customer_name: string | null;
  customer_email: string | null;
  location: number | null;
  shopify_order_id: string | null;
  total_price: number | null;
  discount: number | null;
  status: 'PENDING' | 'PENDING_PRODUCTION' | 'READY' | 'PAID' | 'FULFILLED' | 'RETURNED' | 'CANCELLED';
  detailed_status: 'DRAFT' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'PARTIAL_DELIVERY' | 'REFUSED' | 'LOST';
  tracking_number: string | null;
  shipping_cost: number | null;
  manifest: number | null;
  payment_method: 'CASH' | 'VISA' | 'INSTAPAY' | 'DEPOSIT';
  amount_paid: number | null;
  is_fully_paid: boolean;
  shipping_company: 'PENDING' | 'BOSTA' | 'ARAMEX' | 'MYLERZ' | 'MANUAL' | 'OTHER';
  notes: string;
  inventory_deducted: boolean;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface ShippingManifest {
  id: number;
  courier: 'BOSTA' | 'ARAMEX' | 'QUIGO' | 'OTHER';
  date: string;
  driver_name: string;
  image: string | null;
  order_count: number;
}

// ─── Finance models ────────────────────────────────────────────────────────────

export interface Treasury {
  id: number;
  name: string;
  type: 'DAILY' | 'MAIN' | 'BANK';
  module: 'BRAND' | 'FACTORY' | 'SHARED';
  balance: number;
  location: number | null;
}

export interface FinancialTransaction {
  id: number;
  type: 'TRANSFER' | 'SALE' | 'EXPENSE' | 'INTERNAL' | 'INTERCOMPANY';
  module: 'BRAND' | 'FACTORY';
  category: string;
  treasury: number | null;
  treasury_name: string | null;
  amount: number;
  reference_id: string;
  description: string;
  date: string;
  created_at: string;
}

export interface ProductCosting {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  direct_labor_cost: number;
  overhead_allocation: number;
  factory_margin_percent: number;
  raw_material_cost: number;
  true_cost: number;
  transfer_price: number;
  updated_at: string;
}

export interface FactoryOverhead {
  id: number;
  name: string;
  month: string;
  amount: number;
}

// ─── Factory models ────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  created_at: string;
}

export interface RawMaterial {
  id: number;
  name: string;
  supplier: number | null;
  image: string | null;
  cost_per_unit: number;
  unit: 'METER' | 'UNIT' | 'KG';
  current_stock: number;
  minimum_stock_level: number;
}

export interface BOMItem {
  id: number;
  bom: number;
  raw_material: number;
  quantity: number;
  waste_percentage: number;
}

export interface BOM {
  id: number;
  product: number;
  items: BOMItem[];
  created_at: string;
  updated_at: string;
}

export interface ProductionJob {
  id: number;
  name: string;
  product: number;
  quantity: number;
  source_order: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'QC' | 'COMPLETED' | 'CANCELLED';
  qc_status: 'NA' | 'PASS' | 'REJECT' | 'REPAIR';
  start_date: string | null;
  end_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: number;
  name: string;
  role: string;
  hourly_rate: number;
  active: boolean;
  created_at: string;
}

export interface WorkerAttendance {
  id: number;
  worker: number;
  date: string;
  hours_worked: number;
  notes: string;
  created_at: string;
}

export interface ProductionLog {
  id: number;
  worker: number;
  job: number | null;
  quantity: number;
  date: string;
  created_at: string;
}

export interface MaterialPurchase {
  id: number;
  supplier: number;
  raw_material: number;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  amount_paid: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface SupplierPayment {
  id: number;
  supplier: number;
  amount: number;
  method: 'CASH' | 'BANK' | 'CHECK';
  date: string;
  notes: string;
  created_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  user_id: number;
  username: string;
  email: string;
  groups: string[];
  is_superuser: boolean;
}
