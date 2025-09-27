
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { useTranslation } from '@/hooks/use-translation';
import { getProducts } from '@/services/product-service';
import { getFabrics } from '@/services/fabric-service';
import { getAllProductFabrics } from '@/services/product-fabric-service';
import { Product, Fabric, ProductFabric } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManufacturingPricing } from '@/components/pricing/manufacturing-pricing';
import { BrandPricing } from '@/components/pricing/brand-pricing';
import { BreakEvenAnalysis } from '@/components/pricing/break-even-analysis';


export default function PricingPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [productFabrics, setProductFabrics] = useState<ProductFabric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedProducts, fetchedFabrics, fetchedProductFabrics] = await Promise.all([
        getProducts(),
        getFabrics(),
        getAllProductFabrics(),
      ]);

      const productsWithRecipes = fetchedProducts.map(p => {
        const recipe = fetchedProductFabrics.filter(pf => pf.product_id === p.id);
        const resolvedFabrics = recipe.map(pf => {
            const fabricInfo = fetchedFabrics.find(f => f.id === pf.fabric_id);
            return {
                ...pf,
                name: fabricInfo?.name || 'Unknown Fabric',
            }
        });
        return { ...p, fabrics: resolvedFabrics };
      })
      
      setProducts(productsWithRecipes);
      setFabrics(fetchedFabrics);
      setProductFabrics(fetchedProductFabrics);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t('pricingAndProfitability')}</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6 flex flex-col gap-4 md:gap-8">
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        ) : (
           <Tabs defaultValue="manufacturing">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="manufacturing">{t('manufacturingPricing')}</TabsTrigger>
                    <TabsTrigger value="brand">{t('brandPricing')}</TabsTrigger>
                    <TabsTrigger value="break-even">{t('breakEvenAnalysis')}</TabsTrigger>
                </TabsList>
                <TabsContent value="manufacturing">
                    <ManufacturingPricing products={products} fabrics={fabrics} />
                </TabsContent>
                <TabsContent value="brand">
                    <BrandPricing products={products} />
                </TabsContent>
                <TabsContent value="break-even">
                    <BreakEvenAnalysis products={products} />
                </TabsContent>
            </Tabs>
        )}
      </div>
    </>
  );
}

