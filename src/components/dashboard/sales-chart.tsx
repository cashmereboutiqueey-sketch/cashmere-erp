
'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ChartTooltipContent, ChartContainer, type ChartConfig } from '../ui/chart';
import { getOrders } from '@/services/order-service';
import { Order } from '@/lib/types';
import { format, startOfMonth, subMonths } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

const chartConfig = {
  total: {
    label: 'Sales',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const aggregateSalesByMonth = (orders: Order[]) => {
    const monthlySales: { [key: string]: number } = {};

    // Initialize the last 12 months
    for (let i = 11; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'MMM');
        monthlySales[month] = 0;
    }

    orders.forEach(order => {
        if (order.status === 'completed') {
            const month = format(new Date(order.created_at), 'MMM');
            if (monthlySales.hasOwnProperty(month)) {
                 monthlySales[month] += order.total_amount;
            }
        }
    });

    return Object.entries(monthlySales).map(([name, total]) => ({
        name,
        total,
    }));
};


export function SalesChart() {
    const { t } = useTranslation();
    const [salesData, setSalesData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const orders = await getOrders();
            const aggregatedData = aggregateSalesByMonth(orders);
            setSalesData(aggregatedData);
            setIsLoading(false);
        }
        fetchData();
    }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">{t('salesOverview')}</CardTitle>
        <CardDescription>{t('salesOverviewDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
       {isLoading ? (
          <div className="min-h-[350px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
            <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
            <BarChart data={salesData} accessibilityLayer>
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
                tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent />}
                />
                <Bar
                dataKey="total"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                />
            </BarChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
