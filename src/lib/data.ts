import { Order, Customer, User } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

export const mockUser: User = {
  id: 'user_123',
  name: 'Admin User',
  email: 'admin@cashmere.com',
  avatarUrl: 'https://picsum.photos/seed/admin/100/100',
  role: 'admin',
};

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const mockCustomers: Customer[] = [
  { id: 'cust_1', name: 'Alia Hassan', email: 'alia.h@example.com', avatarUrl: findImage('user_1') },
  { id: 'cust_2', name: 'Fatima Ahmed', email: 'fatima.a@example.com', avatarUrl: findImage('user_2') },
  { id: 'cust_3', name: 'Noor Khan', email: 'noor.k@example.com', avatarUrl: findImage('user_3') },
  { id: 'cust_4', name: 'Layla Ibrahim', email: 'layla.i@example.com', avatarUrl: findImage('user_4') },
  { id: 'cust_5', name: 'Zainab Tariq', email: 'zainab.t@example.com', avatarUrl: findImage('user_5') },
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
].map(order => ({
  ...order,
  customer: mockCustomers.find(c => c.id === order.customer_id)
}));


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
