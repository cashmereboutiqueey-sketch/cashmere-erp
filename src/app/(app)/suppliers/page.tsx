import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { SuppliersTable } from '@/components/suppliers/suppliers-table';
import { mockSuppliers } from '@/lib/data';

export default function SuppliersPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Suppliers</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <SuppliersTable data={mockSuppliers} />
      </div>
    </>
  );
}
