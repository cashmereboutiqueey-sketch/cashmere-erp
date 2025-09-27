
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/lib/types';
import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

interface BreakEvenAnalysisProps {
  products: Product[];
}

export function BreakEvenAnalysis({ products }: BreakEvenAnalysisProps) {
  const { t } = useTranslation();

  // These would typically come from a settings context or API
  const [factoryFixedCosts, setFactoryFixedCosts] = useState(5000);
  const [avgMarginEasy, setAvgMarginEasy] = useState(15);
  const [avgMarginMedium, setAvgMarginMedium] = useState(25);
  const [avgMarginHard, setAvgMarginHard] = useState(40);
  
  const breakEvenEasy = useMemo(() => {
    if (avgMarginEasy <= 0) return Infinity;
    return factoryFixedCosts / avgMarginEasy;
  }, [factoryFixedCosts, avgMarginEasy]);

  const breakEvenMedium = useMemo(() => {
    if (avgMarginMedium <= 0) return Infinity;
    return factoryFixedCosts / avgMarginMedium;
  }, [factoryFixedCosts, avgMarginMedium]);

  const breakEvenHard = useMemo(() => {
    if (avgMarginHard <= 0) return Infinity;
    return factoryFixedCosts / avgMarginHard;
  }, [factoryFixedCosts, avgMarginHard]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('breakEvenByCategory')}</CardTitle>
        <CardDescription>
          {t('breakEvenByCategoryDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-md">
            <Label htmlFor="factory-fixed-costs-be">{t('factoryFixedCosts')}</Label>
            <Input
                id="factory-fixed-costs-be"
                type="number"
                value={factoryFixedCosts}
                onChange={(e) => setFactoryFixedCosts(Number(e.target.value))}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('hard')}</CardTitle>
              <CardDescription>{t('hardProductsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="avg-margin-hard">{t('avgContributionMargin')}</Label>
                    <Input id="avg-margin-hard" type="number" value={avgMarginHard} onChange={e => setAvgMarginHard(Number(e.target.value))} />
                </div>
                <div className="text-center pt-4">
                    <p className="text-3xl font-bold">{isFinite(breakEvenHard) ? Math.ceil(breakEvenHard).toLocaleString() : 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{t('unitsToSell')}</p>
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>{t('medium')}</CardTitle>
              <CardDescription>{t('mediumProductsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="avg-margin-medium">{t('avgContributionMargin')}</Label>
                    <Input id="avg-margin-medium" type="number" value={avgMarginMedium} onChange={e => setAvgMarginMedium(Number(e.target.value))} />
                </div>
                 <div className="text-center pt-4">
                    <p className="text-3xl font-bold">{isFinite(breakEvenMedium) ? Math.ceil(breakEvenMedium).toLocaleString() : 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{t('unitsToSell')}</p>
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>{t('easy')}</CardTitle>
              <CardDescription>{t('easyProductsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="avg-margin-easy">{t('avgContributionMargin')}</Label>
                    <Input id="avg-margin-easy" type="number" value={avgMarginEasy} onChange={e => setAvgMarginEasy(Number(e.target.value))} />
                </div>
                 <div className="text-center pt-4">
                    <p className="text-3xl font-bold">{isFinite(breakEvenEasy) ? Math.ceil(breakEvenEasy).toLocaleString() : 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{t('unitsToSell')}</p>
                </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

