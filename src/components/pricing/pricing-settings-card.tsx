
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/hooks/use-translation';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';

export function PricingSettingsCard() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pricingSettings')}</CardTitle>
        <CardDescription>{t('pricingSettingsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            <h4 className="font-medium text-sm">{t('targetMargin')}</h4>
            <div className="grid gap-2">
                <Label htmlFor="margin-basics">{t('basics')}</Label>
                <Slider id="margin-basics" defaultValue={[30]} max={100} step={1} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="margin-premium">{t('premium')}</Label>
                <Slider id="margin-premium" defaultValue={[60]} max={100} step={1} />
            </div>
        </div>
        <Separator />
        <div className="space-y-4">
            <h4 className="font-medium text-sm">{t('salesMixSimulation')}</h4>
             <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="mix-normal" className="text-right">{t('normalPrice')}</Label>
                <Input id="mix-normal" type="number" defaultValue="70" className="col-span-2" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="mix-sale" className="text-right">{t('seasonalSale')}</Label>
                <Input id="mix-sale" type="number" defaultValue="20" className="col-span-2" />
            </div>
             <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="mix-clearance" className="text-right">{t('clearance')}</Label>
                <Input id="mix-clearance" type="number" defaultValue="10" className="col-span-2" />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
