import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, CircleDollarSign } from 'lucide-react';
import { mockOrders, mockPayables } from '@/lib/data';

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">From completed sales</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(costOfGoodsSold)}</div>
          <p className="text-xs text-muted-foreground">Based on paid supplier bills</p>
        </CardContent>
      </Card>
       <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
           <p className="text-xs text-muted-foreground">Revenue minus COGS</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm" >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(accountsPayable)}</div>
          <p className="text-xs text-muted-foreground">Amount owed to suppliers</p>
        </CardContent>
      </Card>
    </div>
  );
}
