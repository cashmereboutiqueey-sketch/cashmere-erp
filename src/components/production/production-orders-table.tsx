'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ProductionOrder, Product, Fabric, ProductFabric } from '@/lib/types';
import { DataTable } from '../shared/data-table';
import { DataTableColumnHeader } from '../shared/data-table-column-header';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { mockProductFabrics, mockFabrics } from '@/lib/data';

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  in_progress: 'secondary',
  done: 'default',
};

export const columns: ColumnDef<ProductionOrder>[] = [
  {
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      const product = row.original.product;
      if (!product) return null;
      const imageUrl =
        findImage(product.id) ||
        'https://picsum.photos/seed/placeholder/40/40';
      return (
        <div className="flex items-center gap-2">
          <Image
            src={imageUrl}
            alt={product.name}
            width={40}
            height={40}
            className="rounded-md"
          />
          <span className="font-medium">{product.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'required_quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge
        variant={statusVariantMap[row.original.status]}
        className="capitalize"
      >
        {row.original.status.replace('_', ' ')}
      </Badge>
    ),
  },
  {
    id: 'fabrics',
    header: 'Fabrics Required',
    cell: ({ row }) => {
      const productFabrics = mockProductFabrics.filter(
        (pf) => pf.product_id === row.original.product_id
      );
      if (productFabrics.length === 0) return 'N/A';

      const totalQuantity = row.original.required_quantity;

      return (
        <ul className="list-disc list-inside text-sm">
          {productFabrics.map((pf) => {
            const fabric = mockFabrics.find((f) => f.id === pf.fabric_id);
            if (!fabric) return null;
            const requiredAmount = pf.fabric_quantity_meters * totalQuantity;
            return (
              <li key={fabric.id}>
                {fabric.name} ({fabric.code}): {requiredAmount}m
              </li>
            );
          })}
        </ul>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Update Status</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Pending</DropdownMenuItem>
                    <DropdownMenuItem>In Progress</DropdownMenuItem>
                    <DropdownMenuItem>Done</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

interface ProductionOrdersTableProps {
  data: ProductionOrder[];
}

export function ProductionOrdersTable({ data }: ProductionOrdersTableProps) {
  return <DataTable columns={columns} data={data} />;
}
