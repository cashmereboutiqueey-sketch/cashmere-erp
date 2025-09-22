'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order, Product, ProductVariant } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getOrders } from '@/services/order-service';
import { getProducts } from '@/services/product-service';
import { Skeleton } from '../ui/skeleton';

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

type ProductSalesData = {
  product: Product;
  unitsSold: number;
  totalRevenue: number;
};

export function SalesReport() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const today = new Date();
    const from = subDays(today, 29);
    setDate({ from, to: today });
    
    const fetchData = async () => {
        setIsLoading(true);
        const [fetchedOrders, fetchedProducts] = await Promise.all([
            getOrders(),
            getProducts()
        ]);
        setOrders(fetchedOrders);
        setProducts(fetchedProducts);
        setIsLoading(false);
    };
    fetchData();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (!date?.from || !date?.to) return true;
    const orderDate = new Date(order.created_at);
    return orderDate >= date.from && orderDate <= date.to;
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'completed');

  const productSales = completedOrders.reduce((acc, order) => {
    order.items?.forEach(item => {
      let product: Product | undefined;

      for (const p of products) {
        const v = p.variants.find(v => v.id === item.variant.id);
        if (v) {
          product = p;
          break;
        }
      }

      if (product) {
        if (!acc[product.id]) {
          acc[product.id] = {
            product: product,
            unitsSold: 0,
            totalRevenue: 0,
          };
        }
        acc[product.id].unitsSold += item.quantity;
        acc[product.id].totalRevenue += item.quantity * item.variant.price;
      }
    });
    return acc;
  }, {} as Record<string, ProductSalesData>);

  const productSalesArray = Object.values(productSales).sort((a,b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = productSalesArray.reduce(
    (sum, product) => sum + product.totalRevenue,
    0
  );

  const totalUnitsSold = productSalesArray.reduce(
    (sum, product) => sum + product.unitsSold,
    0
  );
  
  const bestSeller = productSalesArray.length > 0 ? productSalesArray[0] : null;


  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

       {isLoading ? (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-6 w-32" /><Skeleton className="h-3 w-40 mt-1" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-6 w-32" /><Skeleton className="h-3 w-40 mt-1" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-6 w-32" /><Skeleton className="h-3 w-40 mt-1" /></CardContent></Card>
            </div>
            <div className="rounded-md border p-4 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        </div>
      ) : (
      <>
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                From completed orders in selected period
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Units Sold</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalUnitsSold}</div>
                <p className="text-xs text-muted-foreground">
                In selected period
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Seller</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold truncate">{bestSeller?.product.name || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                Top product by revenue in period
                </p>
            </CardContent>
            </Card>
        </div>

        <div>
            <h3 className="text-lg font-medium mb-2">Sales by Product</h3>
            <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {productSalesArray.length > 0 ? (
                productSalesArray.map(({ product, unitsSold, totalRevenue }) => (
                    <TableRow key={product.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <Image
                                src={findImage(product.id) || "https://picsum.photos/seed/placeholder/40/40"}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded-md"
                            />
                            <span className="font-medium">{product.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">{unitsSold}</TableCell>
                    <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        }).format(totalRevenue)}
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                    No sales found for the selected period.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
            </div>
        </div>
      </>
      )}
    </div>
  );
}
