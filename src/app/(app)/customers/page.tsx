import { CustomersTable } from '@/components/customers/customers-table';
import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { mockCustomers } from '@/lib/data';

export default function CustomersPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Customers</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <CustomersTable data={mockCustomers} />
      </div>
    </>
  );
}
