
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { FabricsTable } from '@/components/fabrics/fabrics-table';
import { getFabrics } from '@/services/fabric-service';
import { getSuppliers } from '@/services/supplier-service';
import { Fabric, Supplier } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { useState, useEffect } from 'react';

export default function FabricsPage() {
  const { t } = useTranslation();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  const onDataChange = () => {
    setDataVersion(prev => prev + 1);
  };
  
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [fetchedFabrics, fetchedSuppliers] = await Promise.all([
            getFabrics(),
            getSuppliers()
        ]);
        setFabrics(fetchedFabrics);
        setSuppliers(fetchedSuppliers);
        setIsLoading(false);
    };
    fetchData();
  }, [dataVersion]);

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
          <FabricsTable data={fabricsWithSuppliers} suppliers={suppliers} onDataChange={onDataChange} />
        )}
      </div>
    </>
  );
}
