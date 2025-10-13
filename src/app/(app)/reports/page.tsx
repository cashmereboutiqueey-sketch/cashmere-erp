
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
import { WorkerReport } from '@/components/reports/worker-report';
import { useTranslation } from '@/hooks/use-translation';

export default function ReportsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t('reports')}</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="sales">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="sales">{t('sales')}</TabsTrigger>
            <TabsTrigger value="inventory">{t('inventory')}</TabsTrigger>
            <TabsTrigger value="expenses">{t('expenses')}</TabsTrigger>
            <TabsTrigger value="income">{t('incomeStatement')}</TabsTrigger>
            <TabsTrigger value="balance">{t('balanceSheet')}</TabsTrigger>
            <TabsTrigger value="worker">{t('workerReport')}</TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('salesReport')}</CardTitle>
                <CardDescription>
                  {t('salesReportDesc')}
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
                <CardTitle>{t('inventoryReport')}</CardTitle>
                <CardDescription>
                  {t('inventoryReportDesc')}
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
                <CardTitle>{t('expensesReport')}</CardTitle>
                <CardDescription>
                  {t('expensesReportDesc')}
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
                <CardTitle>{t('incomeStatement')}</CardTitle>
                <CardDescription>
                  {t('incomeStatementDesc')}
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
                <CardTitle>{t('balanceSheet')}</CardTitle>
                <CardDescription>
                  {t('balanceSheetDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BalanceSheet />
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="worker" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('workerReport')}</CardTitle>
                <CardDescription>
                  {t('workerReportDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkerReport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
