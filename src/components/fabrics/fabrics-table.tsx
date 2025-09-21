'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Fabric, Supplier } from '@/lib/types';
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

type FabricWithSupplier = Fabric & { supplier?: Supplier };

export const columns: ColumnDef<FabricWithSupplier>[] = [
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
      <DataTableColumnHeader column={column} title="Fabric" />
    ),
    cell: ({ row }) => {
      const fabric = row.original;
      return (
        <div>
          <div className="font-medium">{fabric.name}</div>
          <div className="text-sm text-muted-foreground">{fabric.code}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'color',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Color" />
    ),
  },
  {
    accessorKey: 'length_in_meters',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock (m)" />
    ),
    cell: ({ row }) => {
      return <div>{row.original.length_in_meters}m</div>;
    },
  },
  {
    accessorKey: 'supplier',
    header: 'Supplier',
    cell: ({ row }) => {
      return <div>{row.original.supplier?.name || 'N/A'}</div>;
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
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

interface FabricsTableProps {
  data: FabricWithSupplier[];
}

function FabricsTableToolbar() {
  return (
    <>
      <Input placeholder="Filter fabrics..." className="h-8 w-[150px] lg:w-[250px]" />
      <Button size="sm" className="h-8 ml-auto">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Fabric
      </Button>
    </>
  );
}

export function FabricsTable({ data }: FabricsTableProps) {
  return <DataTable columns={columns} data={data} toolbar={<FabricsTableToolbar />} />;
}
