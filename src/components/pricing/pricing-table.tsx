
'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductWithCost } from '@/app/(app)/pricing/page';
import { Badge } from '../ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { DataTableColumnHeader } from '../shared/data-table-column-header';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

const getColumns = (
  t: (key: any) => string
): ColumnDef<ProductWithCost>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('product')} />
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('category')} />
    ),
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
  {
    accessorKey: 'cost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('costPerUnit')} />
    ),
    cell: ({ row }) => formatCurrency(row.original.cost),
  },
  {
    id: 'sellingPrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('sellingPrice')} />
    ),
    cell: ({ row }) => {
      // Dummy calculation for now
      const sellingPrice = row.original.cost * 1.5;
      return formatCurrency(sellingPrice);
    },
  },
  {
    id: 'margin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('margin')} />
    ),
    cell: ({ row }) => {
      const sellingPrice = row.original.cost * 1.5;
      const margin =
        sellingPrice > 0
          ? ((sellingPrice - row.original.cost) / sellingPrice) * 100
          : 0;
      return `${margin.toFixed(0)}%`;
    },
  },
  {
    id: 'breakEven',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('breakEvenUnits')} />
    ),
    cell: ({ row }) => {
      // Dummy calculation assuming 10k fixed cost
      const sellingPrice = row.original.cost * 1.5;
      const contributionMargin = sellingPrice - row.original.cost;
      const breakEvenUnits =
        contributionMargin > 0 ? 10000 / contributionMargin : Infinity;
      return isFinite(breakEvenUnits)
        ? Math.ceil(breakEvenUnits)
        : 'N/A';
    },
  },
];

interface PricingTableProps {
  products: ProductWithCost[];
}

export function PricingTable({ products }: PricingTableProps) {
  const { t } = useTranslation();
  const columns = getColumns(t);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('productPricingAnalysis')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
