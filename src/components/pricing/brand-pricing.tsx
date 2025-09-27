
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/lib/types';
import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Separator } from '../ui/separator';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

interface BrandPricingProps {
  products: Product[];
}

export function BrandPricing({ products }: BrandPricingProps) {
  const { t } = useTranslation();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // These would typically come from a settings context or API
  const [startingCost, setStartingCost] = useState(100);
  const [marketingCost, setMarketingCost] = useState(15);
  const [operationalCost, setOperationalCost] = useState(10);
  const [targetMargin, setTargetMargin] = useState(60);

  const totalBrandCost = useMemo(() => {
    return startingCost + marketingCost + operationalCost;
  }, [startingCost, marketingCost, operationalCost]);

  const suggestedRetailPrice = useMemo(() => {
    if (1 - targetMargin / 100 === 0) return 0;
    return totalBrandCost / (1 - targetMargin / 100);
  }, [totalBrandCost, targetMargin]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('retailPriceAnalysis')}</CardTitle>
        <CardDescription>
          {t('addProductDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="product-select-brand">{t('selectProduct')}</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger id="product-select-brand">
                    <SelectValue placeholder={t('selectProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                    {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="starting-cost">{t('startingCost')}</Label>
              <Input
                id="starting-cost"
                type="number"
                value={startingCost}
                onChange={(e) => setStartingCost(Number(e.target.value))}
              />
            </div>
            <Separator />
             <h3 className="font-medium">{t('brandCosts')}</h3>
             <div className="space-y-2">
              <Label htmlFor="marketing-cost">{t('marketingCost')}</Label>
              <Input
                id="marketing-cost"
                type="number"
                value={marketingCost}
                onChange={(e) => setMarketingCost(Number(e.target.value))}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="operational-cost">{t('operationalCost')}</Label>
              <Input
                id="operational-cost"
                type="number"
                value={operationalCost}
                onChange={(e) => setOperationalCost(Number(e.target.value))}
              />
            </div>
             <div className="flex justify-between items-center font-semibold pt-2">
                <span>{t('totalBrandCost')}</span>
                <span>{formatCurrency(totalBrandCost)}</span>
            </div>
        </div>

        <div className="space-y-4 rounded-lg bg-muted p-6">
            <h3 className="font-medium text-lg">{t('finalRetailPrice')}</h3>
            <div className="space-y-2">
              <Label htmlFor="target-margin-brand">{t('targetRetailMargin')}</Label>
              <Input
                id="target-margin-brand"
                type="number"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                placeholder="e.g., 60"
              />
            </div>
             <Separator className="my-4" />
             <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">{t('suggestedRetailPrice')}</p>
                <p className="text-4xl font-bold">{formatCurrency(suggestedRetailPrice)}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
