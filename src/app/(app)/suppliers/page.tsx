
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { SuppliersTable } from '@/components/suppliers/suppliers-table';
import { getSuppliers } from '@/services/supplier-service';
import { getFabrics } from '@/services/fabric-service';
import { getExpenses } from '@/services/finance-service';
import { Supplier, Fabric, Expense } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AtSign, Phone } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';


export default function SuppliersPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const onDataChange = () => {
    setDataVersion(prev => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [fetchedSuppliers, fetchedFabrics, fetchedExpenses] = await Promise.all([
          getSuppliers(),
          getFabrics(),
          getExpenses(),
        ]);
        setSuppliers(fetchedSuppliers);
        setFabrics(fetchedFabrics);
        setExpenses(fetchedExpenses);

        if (fetchedSuppliers.length > 0) {
          if(selectedSupplier) {
            // Reselect the supplier if it still exists
            const reselected = fetchedSuppliers.find(s => s.id === selectedSupplier.id);
            setSelectedSupplier(reselected || fetchedSuppliers[0]);
          } else {
            setSelectedSupplier(fetchedSuppliers[0]);
          }
        } else {
            setSelectedSupplier(null);
        }
        setIsLoading(false);
    };

    fetchData();
  }, [dataVersion, selectedSupplier]);

  const supplierFabrics = selectedSupplier
    ? fabrics.filter((fabric) => fabric.supplier_id === selectedSupplier.id)
    : [];
  
  const supplierPayables = selectedSupplier
    ? expenses.filter(e => e.category === 'cogs' && e.note?.includes(selectedSupplier.name))
    : [];
    
  const totalBilled = supplierPayables.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  return (
    <div className="flex flex-col h-full">
       <PageHeader>
        <PageHeaderHeading>{t('suppliers')}</PageHeaderHeading>
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
                <SuppliersTable
                    data={suppliers}
                    onRowClick={setSelectedSupplier}
                    selectedSupplierId={selectedSupplier?.id}
                    onDataChange={onDataChange}
                />
            )}
        </div>
        <div className="md:col-span-2">
          {selectedSupplier ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{selectedSupplier.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <CardTitle className="text-2xl">{selectedSupplier.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AtSign className="h-4 w-4" /> <span>{selectedSupplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" /> <span>{selectedSupplier.phone}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium mb-2">{t('fabricsSupplied')}</h3>
                         {supplierFabrics.length > 0 ? (
                             <ScrollArea className="h-72">
                                <div className="space-y-4">
                                {supplierFabrics.map((fabric) => (
                                    <div key={fabric.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                        <p className="font-medium">{fabric.name} ({fabric.color})</p>
                                        <p className="text-sm text-muted-foreground">
                                            {fabric.code}
                                        </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(fabric.price_per_meter)}/m</p>
                                            <p className="text-xs text-muted-foreground">
                                               {fabric.length_in_meters}m in stock
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                         ) : (
                            <p className="text-sm text-muted-foreground">{t('noFabricsFromSupplier')}</p>
                         )}
                    </div>
                     <div>
                        <h3 className="text-lg font-medium mb-2">{t('accountBalance')}</h3>
                        <Card className="bg-muted">
                            <CardHeader>
                                <CardDescription>{t('totalBilledAmount')}</CardDescription>
                                <CardTitle className="text-3xl">{formatCurrency(totalBilled)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {t('totalBilledAmountDesc')}
                                </p>
                            </CardContent>
                        </Card>
                     </div>
                </div>
              </CardContent>
            </Card>
          ) : (
             <div className="flex items-center justify-center h-full rounded-lg border border-dashed shadow-sm">
                <div className="text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        {isLoading ? t('loadingSuppliers') : t('noSuppliersFound')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? t('loadingSuppliersDesc') : t('noSuppliersFoundDesc')}
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
