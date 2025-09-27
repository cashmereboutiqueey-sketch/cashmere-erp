
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from '@/components/ui/table';
import { getBalanceSheetData, BalanceSheetData } from '@/services/reporting-service';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { useTranslation } from '@/hooks/use-translation';

export function BalanceSheet() {
  const { t } = useTranslation();
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const statementData = await getBalanceSheetData();
      setData(statementData);
      setIsLoading(false);
    };
    fetchData();
  }, []);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const Section = ({ title, accounts, total, isBold = false }) => (
    <>
        <TableRow className="bg-muted/50">
            <TableHead colSpan={2} className={cn("font-bold", isBold && "text-lg")}>{title}</TableHead>
        </TableRow>
        {Object.entries(accounts).map(([key, value]) => (
            <TableRow key={key}>
                <TableCell className="pl-8">{t(key as any)}</TableCell>
                <TableCell className="text-right">{formatCurrency(value as number)}</TableCell>
            </TableRow>
        ))}
        <TableRow>
            <TableCell className="font-bold pl-8">{t('total')} {title}</TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
        </TableRow>
         <TableRow><TableCell colSpan={2} className="h-4 p-0"></TableCell></TableRow>
    </>
  );

  return (
    <div className="space-y-6">
        <div className="text-sm text-muted-foreground">
            {t('asOf')} {format(new Date(), 'LLL dd, y')}
        </div>

       {isLoading || !data ? (
        <div className="space-y-2 p-4">
            {[...Array(10)].map((_,i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border">
            <Table>
                <TableBody>
                    <Section title={t('assets')} accounts={data.assets} total={data.totalAssets} />
                    <Section title={t('liabilities')} accounts={data.liabilities} total={data.totalLiabilities} />
                    <Section title={t('equity')} accounts={data.equity} total={data.totalEquity} />

                    <TableRow className="bg-primary/10">
                        <TableHead className="font-bold text-lg">{t('totalLiabilitiesAndEquity')}</TableHead>
                        <TableHead className="text-right font-bold text-lg">{formatCurrency(data.totalLiabilitiesAndEquity)}</TableHead>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
}
