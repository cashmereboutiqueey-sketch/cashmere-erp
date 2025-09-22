
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
  TableRow,
} from '@/components/ui/table';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIncomeStatementData, IncomeStatementData } from '@/services/reporting-service';
import { Skeleton } from '../ui/skeleton';

export function IncomeStatement() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  useEffect(() => {
    const today = new Date();
    const from = subDays(today, 29);
    setDate({ from, to: today });
    fetchData({ from, to: today });
  }, []);

  const fetchData = async (dateRange: DateRange) => {
      setIsLoading(true);
      const statementData = await getIncomeStatementData(dateRange);
      setData(statementData);
      setIsLoading(false);
  }

  const handleDateChange = async (newDate: DateRange | undefined) => {
    setDate(newDate);
    if(newDate?.from && newDate?.to) {
        await fetchData(newDate);
    }
  }
  
  const StatementRow = ({ label, value, isBold = false, isSub = false, isTotal = false }) => (
    <TableRow className={cn(isBold && "font-bold", isTotal && "border-t-2 border-primary")}>
      <TableCell className={cn(isSub && "pl-8")}>{label}</TableCell>
      <TableCell className="text-right">{formatCurrency(value)}</TableCell>
    </TableRow>
  );

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

       {isLoading || !data ? (
        <div className="space-y-2 p-4">
            {[...Array(8)].map((_,i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border">
            <Table>
                <TableBody>
                    <StatementRow label="Revenue" value={data.revenue} />
                    <StatementRow label="Cost of Goods Sold (COGS)" value={data.cogs} isSub />
                    <StatementRow label="Gross Profit" value={data.grossProfit} isBold />
                    
                    <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                    <StatementRow label="Operating Expenses" value={0} isBold />
                    {Object.entries(data.operatingExpenses).map(([key, value]) => (
                        <StatementRow key={key} label={key} value={value} isSub />
                    ))}
                    <StatementRow label="Total Operating Expenses" value={data.totalOperatingExpenses} isSub isBold />
                    
                    <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                    <StatementRow label="Net Income" value={data.netIncome} isBold isTotal />
                </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
}

