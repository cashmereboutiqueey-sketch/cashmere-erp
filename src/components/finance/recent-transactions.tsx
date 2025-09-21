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
import { mockOrders, mockPayables, mockExpenses } from '@/lib/data';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { capitalize } from 'string-ts';

type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: 'revenue' | 'expense';
    date: string;
}

export function RecentTransactions() {
    const revenueTransactions: Transaction[] = mockOrders
        .filter(o => o.status === 'completed')
        .map(order => ({
            id: order.id,
            description: `Order ${order.id}`,
            amount: order.total_amount,
            type: 'revenue',
            date: order.created_at,
        }));
    
    const cogsTransactions: Transaction[] = mockPayables
        .filter(p => p.status === 'paid')
        .map(payable => ({
            id: `payable-${payable.id}`,
            description: `Payment to supplier for PO #${payable.id.slice(0,4)}`,
            amount: payable.amount,
            type: 'expense',
            date: payable.due_date,
        }));

    const expenseTransactions: Transaction[] = mockExpenses.map(expense => ({
        id: `expense-${expense.id}`,
        description: capitalize(expense.category),
        amount: expense.amount,
        type: 'expense',
        date: expense.created_at,
    }));

    const allTransactions = [...revenueTransactions, ...cogsTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 15);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">Recent Transactions</CardTitle>
        <CardDescription>A log of recent financial activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[340px]">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
