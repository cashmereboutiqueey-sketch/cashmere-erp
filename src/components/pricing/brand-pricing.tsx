
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
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Separator } from '../ui/separator';
import { updateProductPrice } from '@/services/product-service';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [selectedProductId, products]
  );
  
  // Get the average cost from all variants
  const avgCost = useMemo(() => {
    if (!selectedProduct || selectedProduct.variants.length === 0) return 0;
    const totalCost = selectedProduct.variants.reduce((sum, v) => sum + v.cost, 0);
    return totalCost / selectedProduct.variants.length;
  }, [selectedProduct]);

  const [startingCost, setStartingCost] = useState(0);
  const [marketingCost, setMarketingCost] = useState(15);
  const [brandFixedCost, setBrandFixedCost] = useState(10);
  const [targetMargin, setTargetMargin] = useState(60);

  useEffect(() => {
    setStartingCost(avgCost);
  }, [avgCost]);


  const totalBrandCost = useMemo(() => {
    return startingCost + marketingCost + brandFixedCost;
  }, [startingCost, marketingCost, brandFixedCost]);

  const suggestedRetailPrice = useMemo(() => {
    if (1 - targetMargin / 100 === 0) return 0;
    return totalBrandCost / (1 - targetMargin / 100);
  }, [totalBrandCost, targetMargin]);

  const handleUpdatePrice = async () => {
    if (!selectedProduct) {
        toast({ variant: 'destructive', title: t('error'), description: t('selectProductFirst') });
        return;
    }
    setIsUpdating(true);
    try {
        await updateProductPrice(selectedProduct.id, suggestedRetailPrice);
        toast({ title: t('success'), description: t('productPriceUpdatedSuccess') });
    } catch(e) {
        toast({ variant: 'destructive', title: t('error'), description: t('productPriceUpdatedError') });
    } finally {
        setIsUpdating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('retailPriceAnalysis')}</CardTitle>
        <CardDescription>
          {t('retailPriceAnalysisDesc')}
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
                disabled // This is now derived from the product's variants
              />
               <p className="text-xs text-muted-foreground">{t('startingCostDesc')}</p>
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
              <Label htmlFor="brand-fixed-cost">{t('brandFixedCost')}</Label>
              <Input
                id="brand-fixed-cost"
                type="number"
                value={brandFixedCost}
                onChange={(e) => setBrandFixedCost(Number(e.target.value))}
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
       <CardFooter className="justify-end">
        <Button onClick={handleUpdatePrice} disabled={isUpdating || !selectedProduct}>
            {isUpdating ? t('updating') : t('updateRetailPrice')}
        </Button>
      </CardFooter>
    </Card>
  );
}

    