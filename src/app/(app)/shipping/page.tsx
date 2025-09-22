'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ShippingDashboard } from '@/components/shipping/shipping-dashboard';
import { getOrders } from '@/services/order-service';
import { getCustomers } from '@/services/customer-service';
import { Order, Customer } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export type ShippableCustomer = {
  customer: Customer;
  orders: Order[];
}

export default function ShippingPage() {
  const [shippableCustomers, setShippableCustomers] = useState<ShippableCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedOrders, fetchedCustomers] = await Promise.all([
            getOrders(),
            getCustomers(),
        ]);
        
        const shippableOrders = fetchedOrders.filter(o => 
            (o.status === 'processing' || o.status === 'completed') &&
            (o.shipping_status === 'ready_to_ship' || o.shipping_status === 'ready_for_pickup')
        );
        
        const customersWithShippableOrders = shippableOrders.reduce((acc, order) => {
            if (!order.customer_id) return acc;

            if (!acc[order.customer_id]) {
                const customer = fetchedCustomers.find(c => c.id === order.customer_id);
                if (customer) {
                    acc[order.customer_id] = {
                        customer,
                        orders: []
                    };
                }
            }
            if (acc[order.customer_id]) {
                acc[order.customer_id].orders.push(order);
            }
            return acc;
        }, {} as Record<string, ShippableCustomer>);


        setShippableCustomers(Object.values(customersWithShippableOrders));

      } catch (error) {
        console.error('Failed to fetch shipping data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Shipping Dashboard</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="rounded-md border">
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ShippingDashboard data={shippableCustomers} />
        )}
      </div>
    </>
  );
}
