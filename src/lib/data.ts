import { Order, Customer, User, Product, Fabric, ProductFabric, Supplier, Payable, ProductionOrder, Expense, OrderItem } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

export const mockUser: User = {
  id: 'user_123',
  name: 'Admin User',
  email: 'admin@cashmere.com',
  avatarUrl: 'https://picsum.photos/seed/admin/100/100',
  role: 'admin',
};

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const mockSuppliers: Supplier[] = [
    { id: 'supp_1', name: 'Luxury Fabrics Inc.', email: 'contact@luxuryfabrics.com', phone: '111-222-3333' },
    { id: 'supp_2', name: 'Global Textiles Co.', email: 'sales@globaltextiles.com', phone: '444-555-6666' },
    { id: 'supp_3', name: 'Artisan Weavers', email: 'support@artisanweavers.net', phone: '777-888-9999' },
];

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

export const mockCustomers: Customer[] = [
  { id: 'cust_1', name: 'Alia Hassan', email: 'alia.h@example.com', avatarUrl: findImage('user_1') },
  { id: 'cust_2', name: 'Fatima Ahmed', email: 'fatima.a@example.com', avatarUrl: findImage('user_2') },
  { id: 'cust_3', name: 'Noor Khan', email: 'noor.k@example.com', avatarUrl: findImage('user_3') },
  { id: 'cust_4', name: 'Layla Ibrahim', email: 'layla.i@example.com', avatarUrl: findImage('user_4') },
  { id: 'cust_5', name: 'Zainab Tariq', email: 'zainab.t@example.com', avatarUrl: findImage('user_5') },
  { id: 'cust_6', name: 'Aisha Abdullah', email: 'aisha.a@example.com', avatarUrl: 'https://picsum.photos/seed/user6/100/100' },
  { id: 'cust_7', name: 'Maryam Ali', email: 'maryam.a@example.com', avatarUrl: 'https://picsum.photos/seed/user7/100/100' },
  { id: 'cust_8', name: 'Samira Hussein', email: 'samira.h@example.com', avatarUrl: 'httpsum.photos/seed/user8/100/100' },
  { id: 'cust_9', name: 'Farah Said', email: 'farah.s@example.com', avatarUrl: 'httpsum.photos/seed/user9/100/100' },
  { id: 'cust_10', name: 'Hana El-Masri', email: 'hana.e@example.com', avatarUrl: 'httpsum.photos/seed/user10/100/100' },
];

export const mockFabrics: Fabric[] = [
    { id: 'fab_1', name: 'Silk', code: 'F001', color: 'Gold', length_in_meters: 500, supplier_id: 'supp_1', price_per_meter: 20, min_stock_level: 50 },
    { id: 'fab_2', name: 'Cotton', code: 'F002', color: 'White', length_in_meters: 1000, supplier_id: 'supp_2', price_per_meter: 8, min_stock_level: 200 },
    { id: 'fab_3', name: 'Wool', code: 'F003', color: 'Charcoal Gray', length_in_meters: 300, supplier_id: 'supp_1', price_per_meter: 15, min_stock_level: 75 },
    { id: 'fab_4', name: 'Satin', code: 'F004', color: 'Midnight Blue', length_in_meters: 400, supplier_id: 'supp_3', price_per_meter: 12, min_stock_level: 100 },
    { id: 'fab_5', name: 'Chiffon', code: 'F005', color: 'Rose Gold', length_in_meters: 800, supplier_id: 'supp_2', price_per_meter: 5, min_stock_level: 150 },
    { id: 'fab_6', name: 'Knit', code: 'F006', color: 'Beige', length_in_meters: 600, supplier_id: 'supp_3', price_per_meter: 10, min_stock_level: 100 },
];

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Elegant Gold Dress',
    sku: 'SKU-GD-001-S',
    category: 'Dresses',
    price: 250,
    cost: 100,
    stock_quantity: 20,
    showroom_quantity: 5,
    min_stock_level: 15,
    created_at: new Date().toISOString(),
    size: 'S',
    color: 'Gold'
  },
   {
    id: 'prod_1_2',
    name: 'Elegant Gold Dress',
    sku: 'SKU-GD-001-M',
    category: 'Dresses',
    price: 250,
    cost: 100,
    stock_quantity: 30,
    showroom_quantity: 5,
    min_stock_level: 15,
    created_at: new Date().toISOString(),
    size: 'M',
    color: 'Gold'
  },
  {
    id: 'prod_1_3',
    name: 'Elegant Gold Dress',
    sku: 'SKU-GD-001-L',
    category: 'Dresses',
    price: 250,
    cost: 100,
    stock_quantity: 25,
    showroom_quantity: 5,
    min_stock_level: 15,
    created_at: new Date().toISOString(),
    size: 'L',
    color: 'Gold'
  },
  {
    id: 'prod_1_4',
    name: 'Elegant Gold Dress',
    sku: 'SKU-GD-001-XL',
    category: 'Dresses',
    price: 250,
    cost: 100,
    stock_quantity: 10,
    showroom_quantity: 2,
    min_stock_level: 10,
    created_at: new Date().toISOString(),
    size: 'XL',
    color: 'Gold'
  },
  {
    id: 'prod_1_5',
    name: 'Elegant Gold Dress',
    sku: 'SKU-GD-001-XXL',
    category: 'Dresses',
    price: 250,
    cost: 100,
    stock_quantity: 5,
    showroom_quantity: 1,
    min_stock_level: 5,
    created_at: new Date().toISOString(),
    size: 'XXL',
    color: 'Gold'
  },
  {
    id: 'prod_2',
    name: 'Classic White Shirt',
    sku: 'SKU-WS-001-M',
    category: 'Tops',
    price: 75,
    cost: 30,
    stock_quantity: 120,
    showroom_quantity: 25,
    min_stock_level: 30,
    created_at: new Date().toISOString(),
    size: 'M',
    color: 'White',
  },
  {
    id: 'prod_3',
    name: 'Charcoal Gray Pants',
    sku: 'SKU-GP-001-32',
    category: 'Pants',
    price: 120,
    cost: 50,
    stock_quantity: 80,
    showroom_quantity: 15,
    min_stock_level: 20,
    created_at: new Date().toISOString(),
    size: '32',
    color: 'Gray'
  },
    {
    id: 'prod_4',
    name: 'Midnight Blue Abaya',
    sku: 'SKU-AB-001-L',
    category: 'Abayas',
    price: 180,
    cost: 75,
    stock_quantity: 60,
    showroom_quantity: 12,
    min_stock_level: 20,
    created_at: new Date().toISOString(),
    size: 'L',
    color: 'Blue'
  },
  {
    id: 'prod_5',
    name: 'Rose Gold Hijab',
    sku: 'SKU-HJ-001',
    category: 'Hijabs',
    price: 45,
    cost: 15,
    stock_quantity: 200,
    showroom_quantity: 50,
    min_stock_level: 50,
    created_at: new Date().toISOString(),
    color: 'Rose Gold'
  },
  {
    id: 'prod_6',
    name: 'Beige Knit Tunic',
    sku: 'SKU-KT-001-M',
    category: 'Tops',
    price: 95,
    cost: 40,
    stock_quantity: 90,
    showroom_quantity: 20,
    min_stock_level: 25,
    created_at: new Date().toISOString(),
    size: 'M',
    color: 'Beige'
  },
];

export const mockProductFabrics: ProductFabric[] = [
    { product_id: 'prod_1', fabric_id: 'fab_1', fabric_quantity_meters: 3 },
    { product_id: 'prod_1_2', fabric_id: 'fab_1', fabric_quantity_meters: 3.2 },
    { product_id: 'prod_2', fabric_id: 'fab_2', fabric_quantity_meters: 1.5 },
    { product_id: 'prod_3', fabric_id: 'fab_3', fabric_quantity_meters: 2 },
    { product_id: 'prod_4', fabric_id: 'fab_4', fabric_quantity_meters: 4 },
    { product_id: 'prod_5', fabric_id: 'fab_5', fabric_quantity_meters: 1 },
    { product_id: 'prod_6', fabric_id: 'fab_6', fabric_quantity_meters: 2.5 },
    // Example of a product with multiple fabrics
    { product_id: 'prod_1', fabric_id: 'fab_5', fabric_quantity_meters: 0.5 },
];


export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer_id: 'cust_1',
    status: 'completed',
    source: 'shopify',
    payment_status: 'paid',
    total_amount: 250.0,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-002',
    customer_id: 'cust_2',
    status: 'processing',
    source: 'store',
    payment_status: 'paid',
    total_amount: 150.75,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-003',
    customer_id: 'cust_3',
    status: 'pending',
    source: 'social',
    payment_status: 'unpaid',
    total_amount: 320.5,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-004',
    customer_id: 'cust_4',
    status: 'cancelled',
    source: 'shopify',
    payment_status: 'unpaid',
    total_amount: 75.0,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-005',
    customer_id: 'cust_5',
    status: 'completed',
    source: 'store',
    payment_status: 'paid',
    total_amount: 450.0,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-006',
    customer_id: 'cust_6',
    status: 'processing',
    source: 'shopify',
    payment_status: 'paid',
    total_amount: 180.0,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-007',
    customer_id: 'cust_7',
    status: 'completed',
    source: 'social',
    payment_status: 'paid',
    total_amount: 45.0,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-008',
    customer_id: 'cust_8',
    status: 'pending',
    source: 'store',
    payment_status: 'unpaid',
    total_amount: 95.0,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-009',
    customer_id: 'cust_9',
    status: 'completed',
    source: 'shopify',
    payment_status: 'paid',
    total_amount: 210.5,
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-010',
    customer_id: 'cust_10',
    status: 'cancelled',
    source: 'social',
    payment_status: 'unpaid',
    total_amount: 120.0,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
].map(order => ({
  ...order,
  customer: mockCustomers.find(c => c.id === order.customer_id)
}));

export const mockOrderItems: OrderItem[] = [
    { id: 'item_1', order_id: 'ORD-001', product_id: 'prod_1', quantity: 1, price: 250, subtotal: 250 },
    { id: 'item_2', order_id: 'ORD-002', product_id: 'prod_2', quantity: 1, price: 75, subtotal: 75.75 },
    { id: 'item_3', order_id: 'ORD-002', product_id: 'prod_5', quantity: 1, price: 45, subtotal: 45 },
    { id: 'item_4', order_id: 'ORD-003', product_id: 'prod_4', quantity: 1, price: 180, subtotal: 180 },
    { id: 'item_5', order_id: 'ORD-003', product_id: 'prod_6', quantity: 1, price: 95, subtotal: 95 },
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
  },
  {
    id: 'PROD-002',
    product_id: 'prod_3',
    required_quantity: 10,
    status: 'in_progress',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'PROD-003',
    product_id: 'prod_4',
    required_quantity: 8,
    status: 'done',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
].map(order => ({
    ...order,
    product: mockProducts.find(p => p.id === order.product_id)
}));
