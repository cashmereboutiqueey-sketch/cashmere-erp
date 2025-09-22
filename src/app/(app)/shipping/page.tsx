'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ShippingTable } from '@/components/shipping/shipping-table';
import { getOrders } from '@/services/order-service';
import { Order } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShippingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Shipping & Fulfillment</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="rounded-md border">
              <div className="space-y-2 p-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ShippingTable data={orders} />
        )}
      </div>
    </>
  );
}
