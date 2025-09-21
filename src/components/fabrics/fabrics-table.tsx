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
import { mockSuppliers } from '@/lib/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { useState } from 'react';

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
      return value.includes(row.getValue(id));
    },
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

function AddFabricDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Fabric
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Fabric</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" className="col-span-3" placeholder="e.g., Silk" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Code
            </Label>
            <Input id="code" className="col-span-3" placeholder="e.g., F007" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <Input id="color" className="col-span-3" placeholder="e.g., Emerald Green" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Initial Stock (m)
            </Label>
            <Input id="stock" type="number" className="col-span-3" placeholder="e.g., 100" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier" className="text-right">
              Supplier
            </Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {mockSuppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price/meter
            </Label>
            <Input id="price" type="number" className="col-span-3" placeholder="e.g., 25.50" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min-stock" className="text-right">
              Min. Stock (m)
            </Label>
            <Input id="min-stock" type="number" className="col-span-3" placeholder="e.g., 20" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Add Fabric</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FabricsTableToolbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Input
        placeholder="Filter fabrics..."
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <AddFabricDialog />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Purchase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Fabric Purchase</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">
                  Supplier
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">
                  Total Cost
                </Label>
                <Input id="cost" type="number" className="col-span-3" placeholder="e.g., 500.00" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-status" className="text-right">
                  Payment
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid (Cash)</SelectItem>
                    <SelectItem value="unpaid">To be Paid (Late)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Add Purchase</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export function FabricsTable({ data }: FabricsTableProps) {
  return (
    <DataTable columns={columns} data={data} toolbar={<FabricsTableToolbar />} />
  );
}
