
'use client';

import { FinancialSummaryCards } from '@/components/finance/financial-summary-cards';
import { AddExpenseDialog } from '@/components/finance/add-expense-dialog';
import { ProfitLossChart } from '@/components/finance/profit-loss-chart';
import { RecentTransactions } from '@/components/finance/recent-transactions';
import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ChartOfAccounts } from '@/components/finance/chart-of-accounts';
import { JournalVoucherDialog } from '@/components/finance/journal-voucher-dialog';
import { Separator } from '@/components/ui/separator';
import { BankDepositDialog } from '@/components/finance/bank-deposit-dialog';
import { useTranslation } from '@/hooks/use-translation';

export default function FinancePage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t('financeDashboard')}</PageHeaderHeading>
        <div className="ml-auto flex items-center gap-2">
            <BankDepositDialog />
            <JournalVoucherDialog />
            <AddExpenseDialog />
        </div>
      </PageHeader>
      <div className="p-4 lg:p-6 flex flex-col gap-4 md:gap-8">
        <FinancialSummaryCards />
        <div className="grid gap-4 md:gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ProfitLossChart />
          </div>
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>
        </div>
        <Separator />
        <ChartOfAccounts />
      </div>
    </>
  );
}
