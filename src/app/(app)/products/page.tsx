
'use client';

import { useEffect, useState } from 'react';
import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ProductsTable } from '@/components/products/products-table';
import { getProducts } from '@/services/product-service';
import { getAllProductFabrics } from '@/services/product-fabric-service';
import { Product, ProductFabric } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [productFabrics, setProductFabrics] = useState<ProductFabric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  const onDataChange = () => {
    setDataVersion(prev => prev + 1);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedProducts, fetchedProductFabrics] = await Promise.all([
          getProducts(),
          getAllProductFabrics()
      ]);

      const productsWithRecipes = fetchedProducts.map(p => {
          const recipe = fetchedProductFabrics.filter(pf => pf.product_id === p.id);
          return { ...p, fabrics: recipe as any };
      });

      setProducts(productsWithRecipes);
      setProductFabrics(fetchedProductFabrics);
      setIsLoading(false);
    };
    fetchData();
  }, [dataVersion]);

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
          <ProductsTable data={products} onDataChange={onDataChange} />
        )}
      </div>
    </>
  );
}
