
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

// Mock data for now. This will be replaced with a service call.
const mockAccounts: Account[] = [
    { id: '1', name: 'Cash on Hand', code: '1010', type: 'asset', balance: 50000 },
    { id: '9', name: 'Bank Account', code: '1020', type: 'asset', balance: 150000 },
    { id: '2', name: 'Accounts Receivable', code: '1200', type: 'asset', balance: 15000 },
    { id: '3', name: 'Inventory', code: '1400', type: 'asset', balance: 75000 },
    { id: '4', name: 'Accounts Payable', code: '2010', type: 'liability', balance: 20000 },
    { id: '5', name: 'Sales Revenue', code: '4010', type: 'revenue', balance: 120000 },
    { id: '6', name: 'Cost of Goods Sold', code: '5010', type: 'expense', balance: 60000 },
    { id: '7', name: 'Rent Expense', code: '5020', type: 'expense', balance: 5000 },
    { id: '8', name: 'Owner\'s Equity', code: '3010', type: 'equity', balance: 55000 },
];

const accountTypeVariant: { [key in Account['type']]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
    asset: 'default',
    liability: 'destructive',
    equity: 'outline',
    revenue: 'default',
    expense: 'secondary'
}

export function ChartOfAccounts() {
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
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>
            A list of all financial accounts in the general ledger.
          </CardDescription>
        </div>
        <Button size="sm" className="h-8" disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Account
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
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <Badge variant={accountTypeVariant[account.type]}>
                        {capitalize(account.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(account.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
