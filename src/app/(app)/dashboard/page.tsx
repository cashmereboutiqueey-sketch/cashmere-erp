import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StockAlerts } from '@/components/dashboard/stock-alerts';

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
      </div>
      <div className="flex flex-col gap-4 md:gap-8">
        <OverviewCards />
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SalesChart />
          </div>
          <RecentOrders />
        </div>
        <div className="grid gap-4 md:gap-8">
            <StockAlerts />
        </div>
      </div>
    </>
  );
}
