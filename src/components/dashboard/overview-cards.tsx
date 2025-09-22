'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DollarSign, ShoppingCart, AlertCircle, Factory } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOrders } from '@/services/order-service';
import { getProducts } from '@/services/product-service';
import { getProductionOrders } from '@/services/production-service';
import { Order, Product, ProductionOrder } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function OverviewCards() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [
                fetchedOrders,
                fetchedProducts,
                fetchedProductionOrders
            ] = await Promise.all([
                getOrders(),
                getProducts(),
                getProductionOrders(),
            ]);
            setOrders(fetchedOrders);
            setProducts(fetchedProducts);
            setProductionOrders(fetchedProductionOrders);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const totalRevenue = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total_amount, 0);

    const newOrdersCount = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate > thirtyDaysAgo;
    }).length;

    const stockAlertsCount = products.filter(p => {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
        const minStock = p.variants.reduce((sum, v) => sum + v.min_stock_level, 0);
        return totalStock < minStock && minStock > 0;
    }).length;
    
    const pendingProductionCount = productionOrders.filter(po => po.status === 'pending' || po.status === 'in_progress').length;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };
    
    const CardSkeleton = () => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32 mt-1" />
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
        )
    }


  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">From all completed sales</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{newOrdersCount}</div>
          <p className="text-xs text-muted-foreground">In the last 30 days</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm" >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stockAlertsCount} Items</div>
          <p className="text-xs text-muted-foreground">Running low on stock</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Production
          </CardTitle>
          <Factory className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingProductionCount}</div>
          <p className="text-xs text-muted-foreground">Orders waiting for production</p>
        </CardContent>
      </Card>
    </div>
  );
}
