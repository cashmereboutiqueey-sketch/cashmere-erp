
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
import { Product, Fabric } from '@/lib/types';
import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

interface ManufacturingPricingProps {
  products: Product[];
  fabrics: Fabric[];
}

export function ManufacturingPricing({ products, fabrics }: ManufacturingPricingProps) {
  const { t } = useTranslation();
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // These would typically come from a settings context or API
  const [directLabor, setDirectLabor] = useState(10);
  const [variableOverhead, setVariableOverhead] = useState(5);
  const [factoryFixedCosts, setFactoryFixedCosts] = useState(5000);
  const [monthlyUnits, setMonthlyUnits] = useState(1000);
  const [factoryMargin, setFactoryMargin] = useState(20);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [selectedProductId, products]
  );
  
  const materialCost = useMemo(() => {
    if (!selectedProduct || !selectedProduct.fabrics) return 0;
    return selectedProduct.fabrics.reduce((sum, pf) => {
      const fabricInfo = fabrics.find((f) => f.id === pf.fabric_id);
      return sum + pf.fabric_quantity_meters * (fabricInfo?.price_per_meter || 0);
    }, 0);
  }, [selectedProduct, fabrics]);
  
  const totalVariableCost = useMemo(() => {
    return materialCost + directLabor + variableOverhead;
  }, [materialCost, directLabor, variableOverhead]);

  const fixedCostPerUnit = useMemo(() => {
    return factoryFixedCosts / monthlyUnits;
  }, [factoryFixedCosts, monthlyUnits]);

  const totalManufacturingCost = useMemo(() => {
    return totalVariableCost + fixedCostPerUnit;
  }, [totalVariableCost, fixedCostPerUnit]);

  const finalPriceToBrand = useMemo(() => {
    return totalManufacturingCost / (1 - factoryMargin / 100);
  }, [totalManufacturingCost, factoryMargin]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('costAnalysis')}</CardTitle>
        <CardDescription>
          {t('selectProduct')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-select">{t('selectProduct')}</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product-select">
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
          <Separator />
          <h3 className="font-medium">{t('costBreakdown')}</h3>
          
          <Card className="bg-muted/50">
            <CardHeader className="p-4">
                <CardTitle className="text-base">{t('materialCost')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {selectedProduct && selectedProduct.fabrics && selectedProduct.fabrics.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('fabric')}</TableHead>
                                <TableHead>{t('metersPerPc')}</TableHead>
                                <TableHead>{t('costPerMeter')}</TableHead>
                                <TableHead className="text-right">{t('total')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedProduct.fabrics.map(pf => {
                                const fabricInfo = fabrics.find(f => f.id === pf.fabric_id);
                                const cost = pf.fabric_quantity_meters * (fabricInfo?.price_per_meter || 0);
                                return (
                                    <TableRow key={pf.fabric_id}>
                                        <TableCell>{fabricInfo?.name}</TableCell>
                                        <TableCell>{pf.fabric_quantity_meters}m</TableCell>
                                        <TableCell>{formatCurrency(fabricInfo?.price_per_meter || 0)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(cost)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : <p className="text-sm text-muted-foreground">{t('noRecipeDefined')}</p>}
                 <div className="flex justify-end font-bold pt-2 pr-4">
                    {formatCurrency(materialCost)}
                </div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <Label htmlFor="direct-labor">{t('directLaborCost')}</Label>
            <Input id="direct-labor" type="number" value={directLabor} onChange={(e) => setDirectLabor(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variable-overhead">{t('variableOverhead')}</Label>
            <Input id="variable-overhead" type="number" value={variableOverhead} onChange={(e) => setVariableOverhead(Number(e.target.value))} />
          </div>
          <div className="flex justify-between items-center font-semibold pt-2">
            <span>{t('totalVariableCost')}</span>
            <span>{formatCurrency(totalVariableCost)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">{t('fixedCostsAllocation')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="factory-fixed-costs">{t('factoryFixedCosts')}</Label>
              <Input
                id="factory-fixed-costs"
                type="number"
                value={factoryFixedCosts}
                onChange={(e) => setFactoryFixedCosts(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-units">{t('unitsProduced')}</Label>
              <Input
                id="monthly-units"
                type="number"
                value={monthlyUnits}
                onChange={(e) => setMonthlyUnits(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex justify-between items-center font-semibold pt-2">
            <span>{t('fixedCostPerUnit')}</span>
            <span>{formatCurrency(fixedCostPerUnit)}</span>
          </div>

          <Separator className="my-6" />

          <Card className="bg-muted">
            <CardHeader>
              <CardDescription>{t('totalManufacturingCost')}</CardDescription>
              <CardTitle className="text-3xl">{formatCurrency(totalManufacturingCost)}</CardTitle>
            </CardHeader>
          </Card>
          
          <div className="space-y-6 pt-4">
            <h3 className="font-medium">{t('priceToBrand')}</h3>
            <div className="space-y-2">
                <Label htmlFor="factory-margin">{t('factoryMargin')}</Label>
                <Input id="factory-margin" type="number" value={factoryMargin} onChange={e => setFactoryMargin(Number(e.target.value))} />
            </div>
             <Card className="bg-secondary text-secondary-foreground">
                <CardHeader>
                <CardDescription className="text-secondary-foreground/80">{t('finalPriceToBrand')}</CardDescription>
                <CardTitle className="text-4xl">{formatCurrency(finalPriceToBrand)}</CardTitle>
                </CardHeader>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
