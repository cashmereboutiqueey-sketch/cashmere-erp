
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { SalesReport } from '@/components/reports/sales-report';
import { InventoryReport } from '@/components/reports/inventory-report';
import { ExpensesReport } from '@/components/reports/expenses-report';
import { IncomeStatement } from '@/components/reports/income-statement';
import { BalanceSheet } from '@/components/reports/balance-sheet';

export default function ReportsPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Reports</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="sales">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income Statement</TabsTrigger>
            <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Report</CardTitle>
                <CardDescription>
                  Analyze your sales performance over a specific period.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesReport />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Report</CardTitle>
                <CardDescription>
                  An overview of your current product and fabric stock levels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryReport />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="expenses" className="mt-4">
             <Card>
              <CardHeader>
                <CardTitle>Expenses Report</CardTitle>
                <CardDescription>
                  Analyze your business expenses over a specific period.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpensesReport />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="income" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Income Statement (P&L)</CardTitle>
                <CardDescription>
                  A summary of revenues, costs, and expenses during a specific period.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncomeStatement />
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="balance" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>
                  A snapshot of the company's financial health at a specific point in time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BalanceSheet />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
