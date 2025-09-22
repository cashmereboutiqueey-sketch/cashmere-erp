'use client';

import { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartTooltipContent,
  ChartContainer,
  type ChartConfig,
} from '../ui/chart';
import { getOrders } from '@/services/order-service';
import { getExpenses } from '@/services/finance-service';
import { Order, Expense } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { format, startOfMonth } from 'date-fns';

const aggregateDataByMonth = (orders: Order[], expenses: Expense[]) => {
    const dataMap: { [key: string]: { revenue: number, costs: number } } = {};

    [...orders, ...expenses].forEach(item => {
        const month = format(startOfMonth(new Date(item.created_at)), 'MMM yyyy');
        if (!dataMap[month]) {
            dataMap[month] = { revenue: 0, costs: 0 };
        }
    });

    orders.forEach(order => {
        if(order.status === 'completed') {
            const month = format(startOfMonth(new Date(order.created_at)), 'MMM yyyy');
            dataMap[month].revenue += order.total_amount;
        }
    });
    
    expenses.forEach(expense => {
        const month = format(startOfMonth(new Date(expense.created_at)), 'MMM yyyy');
        dataMap[month].costs += expense.amount;
    });
    
    return Object.entries(dataMap).map(([name, values]) => ({
        name: name.split(' ')[0],
        revenue: values.revenue,
        costs: values.costs
    })).sort((a, b) => {
        const dateA = new Date(`01 ${a.name} 2023`); // year is arbitrary for sorting
        const dateB = new Date(`01 ${b.name} 2023`);
        return dateA.getMonth() - dateB.getMonth();
    }).slice(-12); // Get last 12 months
};


const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  costs: {
    label: 'Costs',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ProfitLossChart() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [orders, expenses] = await Promise.all([getOrders(), getExpenses()]);
            const aggregatedData = aggregateDataByMonth(orders, expenses);
            setChartData(aggregatedData);
            setIsLoading(false);
        }
        fetchData();
    }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">Profit & Loss Overview</CardTitle>
        <CardDescription>
          Monthly revenue and costs overview.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {isLoading ? (
             <div className="min-h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart data={chartData} accessibilityLayer margin={{ left: 12, right: 12 }}>
                <XAxis
                dataKey="name"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}K`}
                />
                <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend />
                <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fillCosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                    </linearGradient>
                </defs>
                <Area
                dataKey="revenue"
                name="Revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="hsl(var(--chart-1))"
                stackId="1"
                />
                <Area
                dataKey="costs"
                name="Costs"
                type="natural"
                fill="url(#fillCosts)"
                stroke="hsl(var(--chart-2))"
                stackId="2"
                />
            </AreaChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
