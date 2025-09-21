import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { FabricsTable } from '@/components/fabrics/fabrics-table';
import { mockFabrics, mockSuppliers } from '@/lib/data';
import { Fabric, Supplier } from '@/lib/types';

export default function FabricsPage() {
  const fabricsWithSuppliers = mockFabrics.map((fabric: Fabric) => {
    const supplier = mockSuppliers.find(
      (s: Supplier) => s.id === fabric.supplier_id
    );
    return { ...fabric, supplier };
  });

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Fabrics</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <FabricsTable data={fabricsWithSuppliers} />
      </div>
    </>
  );
}
