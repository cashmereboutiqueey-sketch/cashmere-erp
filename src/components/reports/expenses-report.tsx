
'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Expense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { capitalize } from 'string-ts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { Pie, PieChart, Cell } from 'recharts';
import { getExpenses } from '@/services/finance-service';
import { Skeleton } from '../ui/skeleton';


export function ExpensesReport() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const from = subDays(today, 29);
    setDate({ from, to: today });

    const fetchData = async (dateRange: DateRange) => {
        setIsLoading(true);
        const fetchedExpenses = await getExpenses(dateRange);
        setExpenses(fetchedExpenses);
        setIsLoading(false);
    }
    fetchData({ from, to: today });
  }, []);

  const handleDateChange = async (newDate: DateRange | undefined) => {
    setDate(newDate);
    if(newDate?.from && newDate?.to) {
        setIsLoading(true);
        const fetchedExpenses = await getExpenses(newDate);
        setExpenses(fetchedExpenses);
        setIsLoading(false);
    }
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = capitalize(expense.category);
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));
  
  const chartConfig = {
    value: {
      label: 'Amount',
    },
    ...Object.fromEntries(chartData.map((d,i) => [d.name, {label: d.name, color: `hsl(var(--chart-${i + 1}))` }]))
  } satisfies ChartConfig;


  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

       {isLoading ? (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                 <Card className="md:col-span-1"><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-6 w-32" /><Skeleton className="h-3 w-40 mt-1" /></CardContent></Card>
                 <Card className="md:col-span-2"><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
            </div>
            <div className="rounded-md border p-4 space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        </div>
      ) : (
        <>
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }).format(totalExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                    In selected period
                    </p>
                </CardContent>
                </Card>
                <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Breakdown by Category</CardTitle>
                </CardHeader>
                <CardContent className='h-48'>
                    <ChartContainer
                    config={chartConfig}
                    className="min-h-[150px] w-full"
                    >
                    <PieChart accessibilityLayer>
                        <ChartTooltipContent
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                            ))}
                        </Pie>
                    </PieChart>
                    </ChartContainer>
                </CardContent>
                </Card>
            </div>

            <div>
                <h3 className="text-lg font-medium mb-2">Expense Details</h3>
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {expenses.length > 0 ? (
                        expenses.map((expense: Expense) => (
                        <TableRow key={expense.id}>
                            <TableCell className="font-medium capitalize">{expense.category}</TableCell>
                            <TableCell>{expense.note}</TableCell>
                            <TableCell>
                            {format(new Date(expense.created_at), 'LLL dd, y')}
                            </TableCell>
                            <TableCell className="text-right">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                            }).format(expense.amount)}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No expenses found for the selected period.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            </div>
        </>
      )}
    </div>
  );
}
