import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ProductionOrdersTable } from '@/components/production/production-orders-table';
import { mockProductionOrders } from '@/lib/data';

export default function ProductionPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Production Queue</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <ProductionOrdersTable data={mockProductionOrders} />
      </div>
    </>
  );
}
