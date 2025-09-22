'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, CircleDollarSign, Landmark, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { getOrders } from '@/services/order-service';
import { getExpenses } from '@/services/finance-service';
import { Order, Expense } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export function FinancialSummaryCards() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [todayOrders, setTodayOrders] = useState<Order[]>([]);
    const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const today = new Date();
            const dateRange = { from: startOfDay(today), to: endOfDay(today) };

            const [
                fetchedOrders,
                fetchedExpenses,
                fetchedTodayOrders,
                fetchedTodayExpenses,
            ] = await Promise.all([
                getOrders(),
                getExpenses(),
                getOrders(dateRange),
                getExpenses(dateRange),
            ]);
            setOrders(fetchedOrders);
            setExpenses(fetchedExpenses);
            setTodayOrders(fetchedTodayOrders);
            setTodayExpenses(fetchedTodayExpenses);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    // Overall metrics
    const totalRevenue = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total_amount, 0);

    const costOfGoodsSold = expenses
        .filter(e => e.category === 'cogs')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const grossProfit = totalRevenue - costOfGoodsSold;

    const totalExpenses = expenses
        .filter(e => e.category !== 'cogs')
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    const netProfit = grossProfit - totalExpenses;

    // Today's metrics
    const cashInToday = todayOrders.reduce((sum, order) => sum + (order.amount_paid || 0), 0);
    const cashOutToday = todayExpenses
        .filter(e => e.category !== 'cogs') // Only operational expenses are cash out
        .reduce((sum, expense) => sum + expense.amount, 0);
    const netCashFlowToday = cashInToday - cashOutToday;


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }
    
    const CardSkeleton = () => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32 mt-1" />
            </CardContent>
        </Card>
    );

    if(isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
        );
    }


  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
      <Card className="shadow-sm lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">From all completed sales</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(costOfGoodsSold)}</div>
          <p className="text-xs text-muted-foreground">From supplier bills</p>
        </CardContent>
      </Card>
       <Card className="shadow-sm lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
           <p className="text-xs text-muted-foreground">Revenue - COGS</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OpEx</CardTitle>
          <Landmark className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">Total operational costs</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
           <p className="text-xs text-muted-foreground">Gross Profit - OpEx</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash In (Today)</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(cashInToday)}</div>
           <p className="text-xs text-muted-foreground">From all payments received today</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Out (Today)</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(cashOutToday)}</div>
           <p className="text-xs text-muted-foreground">For operational expenses paid today</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cash (Today)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(netCashFlowToday)}</div>
           <p className="text-xs text-muted-foreground">Cash In - Cash Out</p>
        </CardContent>
      </Card>
    </div>
  );
}
