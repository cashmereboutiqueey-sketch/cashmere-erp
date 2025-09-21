import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { ProductsTable } from '@/components/products/products-table';
import { mockProducts } from '@/lib/data';

export default function ProductsPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Products</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <ProductsTable data={mockProducts} />
      </div>
    </>
  );
}
