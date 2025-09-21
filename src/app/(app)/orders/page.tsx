import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { OrdersTable } from '@/components/orders/orders-table';
import { mockOrders } from '@/lib/data';

export default function OrdersPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Orders</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <OrdersTable data={mockOrders} />
      </div>
    </>
  );
}
