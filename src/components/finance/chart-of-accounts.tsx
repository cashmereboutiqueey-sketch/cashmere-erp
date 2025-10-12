
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Account } from '@/lib/types';
import { capitalize } from 'string-ts';
import { useTranslation } from '@/hooks/use-translation';

// Mock data for now. This will be replaced with a service call.
const mockAccounts: Account[] = [];

const accountTypeVariant: { [key in Account['type']]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
    asset: 'default',
    liability: 'destructive',
    equity: 'outline',
    revenue: 'default',
    expense: 'secondary'
}

export function ChartOfAccounts() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In the future, this would fetch from a service.
    setAccounts(mockAccounts);
    setIsLoading(false);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('chartOfAccounts')}</CardTitle>
          <CardDescription>
            {t('chartOfAccountsDesc')}
          </CardDescription>
        </div>
        <Button size="sm" className="h-8" disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addAccount')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('code')}</TableHead>
                  <TableHead>{t('accountName')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead className="text-right">{t('balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length > 0 ? (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <Badge variant={accountTypeVariant[account.type]}>
                          {t(account.type as any) || capitalize(account.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(account.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t('noResults')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
