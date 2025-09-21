
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { salesData } from '@/lib/data';
import { ChartTooltipContent, ChartContainer, type ChartConfig } from '../ui/chart';

const chartConfig = {
  total: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function SalesChart() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">Sales Overview</CardTitle>
        <CardDescription>An overview of your monthly sales.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
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
              tickFormatter={(value) => `$${value}`}
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
      </CardContent>
    </Card>
  );
}
