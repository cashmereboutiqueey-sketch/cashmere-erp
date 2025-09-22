'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ProductionOrdersTable } from '@/components/production/production-orders-table';
import { getProductionOrders } from '@/services/production-service';
import { getProducts } from '@/services/product-service';
import { getOrders } from '@/services/order-service';
import { ProductionOrder, Product, Order } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductionPage() {
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedOrders, fetchedProducts, fetchedSalesOrders] = await Promise.all([
        getProductionOrders(),
        getProducts(),
        getOrders(),
      ]);
      setProductionOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setOrders(fetchedSalesOrders);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Production Queue</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-8 w-[250px]" />
                <div className="rounded-md border">
                    <div className="space-y-2 p-4">
                        {[...Array(10)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <ProductionOrdersTable 
                data={productionOrders} 
                products={products}
                salesOrders={orders}
            />
        )}
      </div>
    </>
  );
}
