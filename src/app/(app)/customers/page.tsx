'use client';

import { useState, useEffect } from 'react';
import { CustomersTable } from '@/components/customers/customers-table';
import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { Customer, Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getCustomers } from '@/services/customer-service';
import { getOrders } from '@/services/order-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

export default function CustomersPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedCustomers, fetchedOrders] = await Promise.all([
          getCustomers(),
          getOrders()
      ]);
      
      setCustomers(fetchedCustomers);
      setOrders(fetchedOrders);
      
      if (fetchedCustomers.length > 0) {
        setSelectedCustomer(fetchedCustomers[0]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const customerOrders = selectedCustomer
    ? orders.filter((order) => order.customer_id === selectedCustomer.id)
    : [];

  const activeOrders = customerOrders.filter(
    (order) => order.status === 'pending' || order.status === 'processing'
  );
  const previousOrders = customerOrders.filter(
    (order) => order.status === 'completed' || order.status === 'cancelled'
  );

  const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'outline',
    processing: 'secondary',
    completed: 'default',
    cancelled: 'destructive',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeaderHeading>{t('customers')}</PageHeaderHeading>
      </PageHeader>
      <div className="grid md:grid-cols-3 gap-4 p-4 lg:p-6 flex-1">
        <div className="md:col-span-1">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <div className="rounded-md border">
                        <div className="space-y-4 p-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className='space-y-2'>
                                        <Skeleton className="h-4 w-[150px]" />
                                        <Skeleton className="h-3 w-[100px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <CustomersTable
                    data={customers}
                    onRowClick={setSelectedCustomer}
                    selectedCustomerId={selectedCustomer?.id}
                />
            )}
        </div>
        <div className="md:col-span-2">
          {selectedCustomer ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-16 w-16">
                  {selectedCustomer.avatarUrl && <AvatarImage src={selectedCustomer.avatarUrl} />}
                  <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <CardTitle className="text-2xl">{selectedCustomer.name}</CardTitle>
                  <CardDescription>{selectedCustomer.email}</CardDescription>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="my-4" />
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t('activeOrders')}</h3>
                    {activeOrders.length > 0 ? (
                      <div className="space-y-4">
                        {activeOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{t('order')} {order.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                                <Badge variant={statusVariantMap[order.status]} className="capitalize mb-1">{t(order.status as any)}</Badge>
                                <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('noActiveOrders')}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t('previousOrders')}</h3>
                    {previousOrders.length > 0 ? (
                      <ScrollArea className="h-72">
                        <div className="space-y-4">
                          {previousOrders.map((order) => (
                             <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                <p className="font-medium">{t('order')} {order.id}</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={statusVariantMap[order.status]} className="capitalize mb-1">{t(order.status as any)}</Badge>
                                    <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                                </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('noPreviousOrders')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full rounded-lg border border-dashed shadow-sm">
                <div className="text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        {isLoading ? t('loadingCustomers') : t('noCustomersFound')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? t('loadingCustomersDesc') : t('noCustomersFoundDesc')}
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
