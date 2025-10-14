
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { FabricsTable } from '@/components/fabrics/fabrics-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { useFabricStore } from '@/stores/fabric-store';
import { useSupplierStore } from '@/stores/supplier-store';
import { useEffect } from 'react';

export default function FabricsPage() {
  const { t } = useTranslation();
  const { fabrics, isLoading: fabricsLoading, fetchFabrics } = useFabricStore();
  const { suppliers, isLoading: suppliersLoading, fetchSuppliers } = useSupplierStore();
  
  const isLoading = fabricsLoading || suppliersLoading;

  useEffect(() => {
    fetchFabrics();
    fetchSuppliers();
  }, [fetchFabrics, fetchSuppliers]);

  const fabricsWithSuppliers = fabrics.map((fabric) => {
    const supplier = suppliers.find(
      (s) => s.id === fabric.supplier_id
    );
    return { ...fabric, supplier };
  });

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t('fabrics')}</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-8 w-[120px]" />
            </div>
            <div className="rounded-md border">
                <div className="space-y-2 p-4">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
          </div>
        ) : (
          <FabricsTable data={fabricsWithSuppliers} suppliers={suppliers} />
        )}
      </div>
    </>
  );
}
