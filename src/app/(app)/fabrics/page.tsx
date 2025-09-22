'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { FabricsTable } from '@/components/fabrics/fabrics-table';
import { Fabric, Supplier } from '@/lib/types';
import { getFabrics } from '@/services/fabric-service';
import { getSuppliers } from '@/services/supplier-service';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState<(Fabric & { supplier?: Supplier })[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedFabrics, fetchedSuppliers] = await Promise.all([
        getFabrics(),
        getSuppliers(),
      ]);

      const fabricsWithSuppliers = fetchedFabrics.map((fabric) => {
        const supplier = fetchedSuppliers.find(
          (s) => s.id === fabric.supplier_id
        );
        return { ...fabric, supplier };
      });
      
      setFabrics(fabricsWithSuppliers);
      setSuppliers(fetchedSuppliers);
      setIsLoading(false);
    };
    fetchData();
  }, []);


  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Fabrics</PageHeaderHeading>
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
          <FabricsTable data={fabrics} suppliers={suppliers} />
        )}
      </div>
    </>
  );
}
