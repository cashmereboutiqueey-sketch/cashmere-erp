import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, CircleDollarSign, Landmark } from 'lucide-react';
import { mockOrders, mockPayables, mockExpenses } from '@/lib/data';

export function FinancialSummaryCards() {
    const totalRevenue = mockOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total_amount, 0);

    const costOfGoodsSold = mockPayables
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const grossProfit = totalRevenue - costOfGoodsSold;

    const accountsPayable = mockPayables
        .filter(p => p.status === 'unpaid')
        .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = mockExpenses
        .reduce((sum, expense) => sum + expense.amount, 0);

    const netProfit = grossProfit - totalExpenses;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-6">
      <Card className="shadow-sm xl:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">From completed sales</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm xl:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(costOfGoodsSold)}</div>
          <p className="text-xs text-muted-foreground">Paid supplier bills</p>
        </CardContent>
      </Card>
       <Card className="shadow-sm xl:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
           <p className="text-xs text-muted-foreground">Revenue - COGS</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm xl:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <Landmark className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">Operational costs</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm xl:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
           <p className="text-xs text-muted-foreground">Gross Profit - Expenses</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm xl:col-span-1" >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(accountsPayable)}</div>
          <p className="text-xs text-muted-foreground">Owed to suppliers</p>
        </CardContent>
      </Card>
    </div>
  );
}
