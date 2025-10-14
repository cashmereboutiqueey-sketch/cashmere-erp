
'use client';

import { useEffect } from 'react';
import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ProductsTable } from '@/components/products/products-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { useProductStore } from '@/stores/product-store';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { products, isLoading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t('products')}</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        {isLoading ? (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-[250px]" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-[120px]" />
                        <Skeleton className="h-8 w-[120px]" />
                    </div>
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
          <ProductsTable data={products} />
        )}
      </div>
    </>
  );
}
