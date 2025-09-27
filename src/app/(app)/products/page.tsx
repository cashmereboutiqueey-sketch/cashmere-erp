'use client';

import { useEffect, useState } from 'react';
import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ProductsTable } from '@/components/products/products-table';
import { getProducts } from '@/services/product-service';
import { getFabrics } from '@/services/fabric-service';
import { getAllProductFabrics } from '@/services/product-fabric-service';
import { Product, Fabric, ProductFabric } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductsData = async () => {
      setIsLoading(true);
      const [fetchedProducts, allFabrics, allProductFabrics] = await Promise.all([
        getProducts(),
        getFabrics(),
        getAllProductFabrics(),
      ]);

      const productsWithFabrics = fetchedProducts.map(product => {
        const recipe = allProductFabrics.filter(pf => pf.product_id === product.id);
        const resolvedFabrics = recipe.map(pf => {
          const fabricInfo = allFabrics.find(f => f.id === pf.fabric_id);
          return {
            ...pf,
            name: fabricInfo?.name || 'Unknown Fabric',
          }
        });
        return { ...product, fabrics: resolvedFabrics };
      });
      
      setProducts(productsWithFabrics);
      setIsLoading(false);
    };
    fetchProductsData();
  }, []);

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
