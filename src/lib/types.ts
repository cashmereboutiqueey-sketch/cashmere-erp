export type Role = {
  id: string;
  name: 'admin' | 'accountant' | 'sales' | 'production' | 'warehouse_manager';
};

export type UserRole = {
  id: string;
  user_id: string;
  role_id: string;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email: string;
  address?: string;
  notes?: string;
  avatarUrl?: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  price: number;
  cost: number;
  stock_quantity: number;
  showroom_quantity: number;
  min_stock_level: number;
  size?: string;
  color?: string;
}

export type Product = {
  id: string;
  name: string;
  category: string;
  created_at: string;
  variants: ProductVariant[];
  fabrics?: (ProductFabric & { name: string })[];
};

export type ProductFabric = {
  product_id: string;
  fabric_id: string;
  fabric_quantity_meters: number;
};

export type Fabric = {
  id: string;
  name: string;
  code: string;
  color: string;
  length_in_meters: number;
  supplier_id: string;
  price_per_meter: number;
  min_stock_level: number;
};

export type OrderItem = {
    productId: string;
    productName: string;
    variant: ProductVariant;
    quantity: number;
}

export type Order = {
  id: string;
  customer_id: string;
  customer?: Customer;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  source: 'social' | 'shopify' | 'store';
  payment_status: 'paid' | 'unpaid' | 'partially_paid';
  payment_method?: 'cash' | 'card' | 'online';
  amount_paid?: number;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
};

export type ProductionOrder = {
  id: string;
  product_id: string;
  variant_id: string;
  product?: Product;
  variant?: ProductVariant;
  sales_order_id?: string | null;
  required_quantity: number;
  status: 'pending' | 'in_progress' | 'done';
  created_at: string;
};

export type ProductionLog = {
  id: string;
  production_order_id: string;
  step: string;
  note?: string;
  created_at: string;
  worker: string;
};

export type Transaction = {
  id: string;
  order_id?: string;
  amount: number;
  type: 'revenue' | 'expense';
  method: 'cash' | 'card' | 'online';
  created_at: string;
};

export type Expense = {
  id: string;
  category: 'cogs' | 'marketing' | 'rent' | 'salaries' | 'utilities' | 'other';
  amount: number;
  supplier_id?: string;
  note?: string;
  created_at: string;
};

export type Payable = {
  id: string;
  supplier_id: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
};

export type Receivable = {
  id:string;
  customer_id: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
};

export type Return = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  reason: string;
  created_at: string;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  user_id: string;
  read: boolean;
  created_at: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role['name'];
};
