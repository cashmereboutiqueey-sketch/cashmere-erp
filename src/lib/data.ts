import { Order, Customer, User, Product, Fabric, ProductFabric, Supplier, Payable, ProductionOrder, Expense, OrderItem } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

// Note: Most mock data is now deprecated in favor of Firestore services.
// This file is kept for initial data seeding and for data models not yet migrated.

export const INITIAL_MOCK_SUPPLIERS: Omit<Supplier, 'id'>[] = [];

export const INITIAL_MOCK_FABRICS: Omit<Fabric, 'id' | 'length_in_meters'>[] = [];

export const INITIAL_MOCK_PRODUCTS: Omit<Product, 'id'>[] = [];
