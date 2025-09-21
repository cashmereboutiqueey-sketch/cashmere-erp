'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Supplier, Payable } from '@/lib/types';
import { DataTable } from '../shared/data-table';
import { DataTableColumnHeader } from '../shared/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { mockPayables } from '@/lib/data';

type SupplierWithPayables = Supplier & {
  amount_owed: number;
};

const calculateAmountOwed = (supplierId: string): number => {
  return mockPayables
    .filter(p => p.supplier_id === supplierId && p.status === 'unpaid')
    .reduce((total, p) => total + p.amount, 0);
}

export const columns: ColumnDef<SupplierWithPayables>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
  },
  {
    accessorKey: 'amount_owed',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount Owed" />
    ),
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount_owed'));
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
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
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

interface SuppliersTableProps {
  data: Supplier[];
}

function SuppliersTableToolbar() {
  return (
    <>
      <Input
        placeholder="Filter suppliers..."
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <Button size="sm" className="h-8 ml-auto">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Supplier
      </Button>
    </>
  );
}

export function SuppliersTable({ data }: SuppliersTableProps) {
    const dataWithPayables = data.map(supplier => ({
        ...supplier,
        amount_owed: calculateAmountOwed(supplier.id),
    }))
  return <DataTable columns={columns} data={dataWithPayables} toolbar={<SuppliersTableToolbar />} />;
}
