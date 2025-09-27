
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { useTranslation } from '@/hooks/use-translation';
import { PricingSettingsCard } from '@/components/pricing/pricing-settings-card';
import { PricingTable } from '@/components/pricing/pricing-table';
import { getProducts } from '@/services/product-service';
import { getFabrics } from '@/services/fabric-service';
import { getAllProductFabrics } from '@/services/product-fabric-service';
import { Product, Fabric, ProductFabric } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfitabilitySummaryCards } from '@/components/pricing/profitability-summary-cards';

export type ProductWithCost = Product & {
    cost: number;
};

export default function PricingPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductWithCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedProducts, allFabrics, allProductFabrics] = await Promise.all([
        getProducts(),
        getFabrics(),
        getAllProductFabrics(),
      ]);

      const productsWithCost = fetchedProducts.map(p => {
        const recipe = allProductFabrics.filter(pf => pf.product_id === p.id);
        const totalCost = recipe.reduce((sum, pf) => {
            const fabricInfo = allFabrics.find(f => f.id === pf.fabric_id);
            return sum + (pf.fabric_quantity_meters * (fabricInfo?.price_per_meter || 0));
        }, 0);
        
        // Assuming variant costs are uniform for now, using the first variant's cost as a base
        const variantBaseCost = p.variants[0]?.cost || 0;

        return { ...p, cost: totalCost + variantBaseCost };
      });
      
      setProducts(productsWithCost);
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
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        ) : (
            <>
                <ProfitabilitySummaryCards products={products} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <PricingSettingsCard />
                    </div>
                    <div className="lg:col-span-2">
                        <PricingTable products={products} />
                    </div>
                </div>
            </>
        )}
      </div>
    </>
  );
}
