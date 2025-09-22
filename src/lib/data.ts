import { Order, Customer, User, Product, Fabric, ProductFabric, Supplier, Payable, ProductionOrder, Expense, OrderItem } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

// Note: Most mock data is now deprecated in favor of Firestore services.
// This file is kept for initial data seeding and for data models not yet migrated.

export const mockUser: User = {
  id: 'user_123',
  name: 'Admin User',
  email: 'admin@cashmere.com',
  avatarUrl: 'https://picsum.photos/seed/admin/100/100',
  role: 'admin',
};

export const mockUsers: User[] = [
    { id: 'user_123', name: 'Admin User', email: 'admin@cashmere.com', avatarUrl: 'https://picsum.photos/seed/admin/100/100', role: 'admin' },
    { id: 'user_sales_1', name: 'Alia Hassan', email: 'alia.h@example.com', avatarUrl: 'https://picsum.photos/seed/user1/100/100', role: 'sales' },
    { id: 'user_prod_1', name: 'Fatima Ahmed', email: 'fatima.a@example.com', avatarUrl: 'https://picsum.photos/seed/user2/100/100', role: 'production' },
    { id: 'user_acc_1', name: 'Noor Khan', email: 'noor.k@example.com', avatarUrl: 'https://picsum.photos/seed/user3/100/100', role: 'accountant' },
    { id: 'user_wh_1', name: 'Layla Ibrahim', email: 'layla.i@example.com', avatarUrl: 'https://picsum.photos/seed/user4/100/100', role: 'warehouse_manager' },
];

export const INITIAL_MOCK_SUPPLIERS: Omit<Supplier, 'id'>[] = [
    { name: 'Luxury Fabrics Inc.', email: 'contact@luxuryfabrics.com', phone: '111-222-3333' },
    { name: 'Global Textiles Co.', email: 'sales@globaltextiles.com', phone: '444-555-6666' },
    { name: 'Artisan Weavers', email: 'support@artisanweavers.net', phone: '777-888-9999' },
];

export const INITIAL_MOCK_FABRICS: Omit<Fabric, 'id' | 'length_in_meters'>[] = [
    { name: 'Silk', code: 'F001', color: 'Gold', supplier_id: 'supp_1', price_per_meter: 20, min_stock_level: 50 },
    { name: 'Cotton', code: 'F002', color: 'White', supplier_id: 'supp_2', price_per_meter: 8, min_stock_level: 200 },
    { name: 'Wool', code: 'F003', color: 'Charcoal Gray', supplier_id: 'supp_1', price_per_meter: 15, min_stock_level: 75 },
    { name: 'Satin', code: 'F004', color: 'Midnight Blue', supplier_id: 'supp_3', price_per_meter: 12, min_stock_level: 100 },
    { name: 'Chiffon', code: 'F005', color: 'Rose Gold', supplier_id: 'supp_2', price_per_meter: 5, min_stock_level: 150 },
    { name: 'Knit', code: 'F006', color: 'Beige', supplier_id: 'supp_3', price_per_meter: 10, min_stock_level: 100 },
];

export const INITIAL_MOCK_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Elegant Gold Dress',
    category: 'Dresses',
    created_at: new Date().toISOString(),
    variants: [
        { id: 'prod_1_1', sku: 'SKU-GD-001-S', price: 250, cost: 100, stock_quantity: 20, showroom_quantity: 5, min_stock_level: 15, size: 'S', color: 'Gold' },
        { id: 'prod_1_2', sku: 'SKU-GD-001-M', price: 250, cost: 100, stock_quantity: 30, showroom_quantity: 5, min_stock_level: 15, size: 'M', color: 'Gold' },
        { id: 'prod_1_3', sku: 'SKU-GD-001-L', price: 250, cost: 100, stock_quantity: 25, showroom_quantity: 5, min_stock_level: 15, size: 'L', color: 'Gold' },
        { id: 'prod_1_4', sku: 'SKU-GD-001-XL', price: 250, cost: 100, stock_quantity: 10, showroom_quantity: 2, min_stock_level: 10, size: 'XL', color: 'Gold' },
        { id: 'prod_1_5', sku: 'SKU-GD-001-XXL', price: 250, cost: 100, stock_quantity: 5, showroom_quantity: 1, min_stock_level: 5, size: 'XXL', color: 'Gold' },
    ]
  },
  {
    name: 'Classic White Shirt',
    category: 'Tops',
    created_at: new Date().toISOString(),
    variants: [
        { id: 'prod_2_1', sku: 'SKU-WS-001-M', price: 75, cost: 30, stock_quantity: 120, showroom_quantity: 25, min_stock_level: 30, size: 'M', color: 'White' },
    ]
  },
  {
    name: 'Charcoal Gray Pants',
    category: 'Pants',
    created_at: new Date().toISOString(),
    variants: [
        { id: 'prod_3_1', sku: 'SKU-GP-001-32', price: 120, cost: 50, stock_quantity: 80, showroom_quantity: 15, min_stock_level: 20, size: '32', color: 'Gray' }
    ]
  },
    {
    name: 'Midnight Blue Abaya',
    category: 'Abayas',
    created_at: new Date().toISOString(),
    variants: [
        { id: 'prod_4_1', sku: 'SKU-AB-001-L', price: 180, cost: 75, stock_quantity: 60, showroom_quantity: 12, min_stock_level: 20, size: 'L', color: 'Blue' }
    ]
  },
  {
    name: 'Rose Gold Hijab',
    category: 'Hijabs',
    created_at: new Date().toISOString(),
    variants: [
        { id: 'prod_5_1', sku: 'SKU-HJ-001', price: 45, cost: 15, stock_quantity: 200, showroom_quantity: 50, min_stock_level: 50, color: 'Rose Gold' }
    ]
  },
  {
    name: 'Beige Knit Tunic',
    category: 'Tops',
    created_at: new Date().toISOString(),
    variants: [
      { id: 'prod_6_1', sku: 'SKU-KT-001-M', price: 95, cost: 40, stock_quantity: 90, showroom_quantity: 20, min_stock_level: 25, size: 'M', color: 'Beige' }
    ]
  },
];


// --- The following data is still mocked ---

export const mockPayables: Payable[] = [
    { id: 'pay_1', supplier_id: 'supp_1', amount: 5000, due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'unpaid' },
    { id: 'pay_2', supplier_id: 'supp_2', amount: 1200, due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'paid' },
    { id: 'pay_3', supplier_id: 'supp_1', amount: 3000, due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), status: 'unpaid' },
    { id: 'pay_4', supplier_id: 'supp_3', amount: 800, due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'unpaid' },
];

export const mockExpenses: Expense[] = [
    { id: 'exp_1', category: 'marketing', amount: 1500, note: 'Social media campaign', created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'exp_2', category: 'rent', amount: 2500, note: 'Workshop rent', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'exp_3', category: 'salaries', amount: 8000, note: 'Monthly payroll', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'exp_4', category: 'utilities', amount: 400, note: 'Electricity and water', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
]

export const salesData = [
    { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Jul', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Aug', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Sep', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Oct', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Nov', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Dec', total: Math.floor(Math.random() * 5000) + 1000 },
  ]

export const stockAlerts = {
    productLowStockAlerts: [
        'Elegant Gold Dress will be low by 20 units by next week.',
        'Classic White Shirt will be low by 50 units in the next 10 days.'
    ],
    fabricLowStockAlerts: [
        'Fabric F001 (Silk) will be low by 100 meters by the end of the month.',
    ]
}

export const mockProductionOrders: ProductionOrder[] = [
  {
    id: 'PROD-001',
    product_id: 'prod_1',
    required_quantity: 5,
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    product: {
      id: 'prod_1',
      name: 'Elegant Gold Dress',
      category: 'Dresses',
      created_at: new Date().toISOString(),
      variants: []
    }
  },
  {
    id: 'PROD-002',
    product_id: 'prod_3',
    required_quantity: 10,
    status: 'in_progress',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
     product: {
      id: 'prod_3',
      name: 'Charcoal Gray Pants',
      category: 'Pants',
      created_at: new Date().toISOString(),
      variants: []
    }
  },
  {
    id: 'PROD-003',
    product_id: 'prod_4',
    required_quantity: 8,
    status: 'done',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    product: {
      id: 'prod_4',
      name: 'Midnight Blue Abaya',
      category: 'Abayas',
      created_at: new Date().toISOString(),
      variants: []
    }
  },
];
