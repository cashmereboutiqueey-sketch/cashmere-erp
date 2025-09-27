
'use client';

import { useEffect, useState } from 'react';
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
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { capitalize } from 'string-ts';
import { Order, Expense } from '@/lib/types';
import { getOrders } from '@/services/order-service';
import { getExpenses } from '@/services/finance-service';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';


type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: 'revenue' | 'expense';
    date: string;
}

export function RecentTransactions() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [fetchedOrders, fetchedExpenses] = await Promise.all([
                getOrders(),
                getExpenses()
            ]);
            setOrders(fetchedOrders);
            setExpenses(fetchedExpenses);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const revenueTransactions: Transaction[] = orders
        .filter(o => o.status === 'completed')
        .map(order => ({
            id: order.id,
            description: `${t('orders')} #${order.id.slice(0,4)}...`,
            amount: order.total_amount,
            type: 'revenue',
            date: order.created_at,
        }));

    const expenseTransactions: Transaction[] = expenses.map(expense => ({
        id: `expense-${expense.id}`,
        description: expense.note || capitalize(expense.category),
        amount: expense.amount,
        type: 'expense',
        date: expense.created_at,
    }));

    const allTransactions = [...revenueTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">{t('recentTransactions')}</CardTitle>
        <CardDescription>{t('recentTransactionsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[340px]">
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16 mt-1" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('description')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell className="text-right">
                            <Badge variant={transaction.type === 'revenue' ? 'default': 'destructive'}>
                                {transaction.type === 'revenue' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
