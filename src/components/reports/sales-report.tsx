
'use client';

import { useState } from 'react';
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
import { mockOrders } from '@/lib/data';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
};

export function SalesReport() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredOrders = mockOrders.filter((order) => {
    if (!date?.from || !date?.to) return true;
    const orderDate = new Date(order.created_at);
    return orderDate >= date.from && orderDate <= date.to;
  });

  const totalRevenue = filteredOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, order) => sum + order.total_amount, 0);

  const totalOrders = filteredOrders.length;
  
  const bestSeller = filteredOrders.length > 0 ? filteredOrders.reduce((prev, current) => (prev.total_amount > current.total_amount) ? prev : current) : null;


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
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
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
            <div className="text-2xl font-bold truncate">{bestSeller?.customer?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Top order by value in period
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Order Details</h3>
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: Order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer?.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[order.status]} className="capitalize">
                        {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'LLL dd, y')}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(order.total_amount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No orders found for the selected period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
