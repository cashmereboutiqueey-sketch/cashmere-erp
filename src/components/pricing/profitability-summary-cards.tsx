
'use client';

import { ProductWithCost } from '@/app/(app)/pricing/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';

interface Props {
  products: ProductWithCost[];
}

export function ProfitabilitySummaryCards({ products }: Props) {
  const { t } = useTranslation();

  const totalBreakEvenUnits = products.reduce((total, p) => {
    const sellingPrice = p.cost * 1.5; // Dummy calc
    const contributionMargin = sellingPrice - p.cost;
    const breakEvenUnits =
      contributionMargin > 0 ? 10000 / contributionMargin : 0;
    return total + (isFinite(breakEvenUnits) ? Math.ceil(breakEvenUnits) : 0);
  }, 0);
  
  const averageMargin = products.reduce((total, p) => {
      const sellingPrice = p.cost * 1.5; // Dummy calc
      const margin = sellingPrice > 0 ? ((sellingPrice - p.cost) / sellingPrice) * 100 : 0;
      return total + margin;
  }, 0) / (products.length || 1);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('averageMargin')}
          </CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageMargin.toFixed(0)}%</div>
          <p className="text-xs text-muted-foreground">
            {t('acrossAllProducts')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('totalBreakEvenUnits')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBreakEvenUnits.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {t('unitsToCoverFixedCosts')}
          </p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('estimatedMonthlyProfit')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$12,450</div>
           <p className="text-xs text-muted-foreground">
            {t('basedOnSalesSim')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
