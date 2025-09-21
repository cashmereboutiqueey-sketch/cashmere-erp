
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

export default function ReportsPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Reports</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
        </Tabs>
      </div>
    </>
  );
}
