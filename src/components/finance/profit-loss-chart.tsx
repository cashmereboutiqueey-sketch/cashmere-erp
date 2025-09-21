'use client';

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
import { salesData } from '@/lib/data'; // Using salesData as a proxy for monthly revenue

const costsData = [
    { name: 'Jan', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Feb', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Mar', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Apr', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'May', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Jun', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Jul', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Aug', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Sep', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Oct', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Nov', costs: Math.floor(Math.random() * 3000) + 500 },
    { name: 'Dec', costs: Math.floor(Math.random() * 3000) + 500 },
];

const profitLossData = salesData.map((sale, index) => ({
    ...sale,
    costs: costsData[index].costs
}));


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
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">Profit & Loss Overview</CardTitle>
        <CardDescription>
          Monthly revenue and costs overview.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <AreaChart data={profitLossData} accessibilityLayer margin={{ left: 12, right: 12 }}>
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
              dataKey="total"
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
      </CardContent>
    </Card>
  );
}
