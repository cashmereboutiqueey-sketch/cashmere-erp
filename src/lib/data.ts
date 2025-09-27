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
    { id: 'user_admin', name: 'Admin User', email: 'admin@cashmere.com', avatarUrl: 'https://picsum.photos/seed/admin/100/100', role: 'admin' },
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
