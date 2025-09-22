'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { SuppliersTable } from '@/components/suppliers/suppliers-table';
import { getSuppliers } from '@/services/supplier-service';
import { Supplier } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
// TODO: Integrate payables from a service
import { mockPayables } from '@/lib/data';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true);
      const fetchedSuppliers = await getSuppliers();
      setSuppliers(fetchedSuppliers);
      setIsLoading(false);
    };
    fetchSuppliers();
  }, []);

  const calculateAmountOwed = (supplierId: string): number => {
    return mockPayables
      .filter((p) => p.supplier_id === supplierId && p.status === 'unpaid')
      .reduce((total, p) => total + p.amount, 0);
  };

  const suppliersWithPayables = suppliers.map((supplier) => ({
    ...supplier,
    amount_owed: calculateAmountOwed(supplier.id),
  }));

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Suppliers</PageHeaderHeading>
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
            <SuppliersTable data={suppliersWithPayables} />
        )}
      </div>
    </>
  );
}
