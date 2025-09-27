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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addFabric } from '@/services/fabric-service';
import { addExpense } from '@/services/finance-service';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';


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
    accessorKey: 'price_per_meter',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cost/meter" />
    ),
    cell: ({ row }) => {
       const amount = parseFloat(row.getValue('price_per_meter') as any);
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'supplier.name',
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
  suppliers: Supplier[];
}

const fabricSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  color: z.string().min(1, "Color is required"),
  length_in_meters: z.preprocess(val => Number(val), z.number().min(0)),
  price_per_meter: z.preprocess(val => Number(val), z.number().min(0)),
  min_stock_level: z.preprocess(val => Number(val), z.number().min(0)),
  supplier_id: z.string().min(1, "Supplier is required"),
});

type FabricFormData = z.infer<typeof fabricSchema>;

function AddFabricDialog({ suppliers }: { suppliers: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<FabricFormData>({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      name: '',
      code: '',
      color: '',
      length_in_meters: 0,
      price_per_meter: 0,
      min_stock_level: 0,
      supplier_id: '',
    },
  });

  const onSubmit = async (data: FabricFormData) => {
    try {
      await addFabric(data);
      toast({
        title: 'Success',
        description: 'New fabric has been added.',
      });
      setOpen(false);
      form.reset();
      window.location.reload(); 
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add fabric.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
    }}>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder="e.g., Silk" />
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Code</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder="e.g., F007" />
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Color</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder="e.g., Emerald Green" />
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="length_in_meters"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Initial Stock (m)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" className="col-span-3" placeholder="e.g., 100" />
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="price_per_meter"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Price/meter</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" className="col-span-3" placeholder="e.g., 25.50" />
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="min_stock_level"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Min. Stock (m)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" className="col-span-3" placeholder="e.g., 20" />
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Supplier</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adding...' : 'Add Fabric'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const purchaseSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  cost: z.preprocess((val) => Number(val), z.number().min(0.01, "Cost must be greater than zero")),
  payment_status: z.enum(['paid', 'unpaid']),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

function RecordPurchaseDialog({ suppliers }: { suppliers: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplier_id: '',
      cost: 0,
      payment_status: 'unpaid',
    }
  });

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      const supplierName = suppliers.find(s => s.id === data.supplier_id)?.name;
      await addExpense({
        category: 'cogs',
        amount: data.cost,
        supplier_id: data.supplier_id,
        note: `Fabric purchase from ${supplierName}`,
      });

      toast({
        title: 'Success',
        description: 'Fabric purchase has been recorded as an expense.',
      });
      setOpen(false);
      form.reset();
      window.location.reload(); 
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record purchase.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Record Purchase
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Fabric Purchase</DialogTitle>
          <DialogDescription>
            Record a bill from a supplier for a fabric purchase. This will create an expense under "Cost of Goods Sold".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Supplier</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Total Cost</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" className="col-span-3" placeholder="e.g., 500.00" />
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Payment</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid (from Cash)</SelectItem>
                      <SelectItem value="unpaid">To be Paid (Credit)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Recording...' : 'Add Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function FabricsTableToolbar({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <>
      <Input
        placeholder="Filter fabrics..."
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <AddFabricDialog suppliers={suppliers} />
        <RecordPurchaseDialog suppliers={suppliers} />
      </div>
    </>
  );
}

export function FabricsTable({ data, suppliers }: FabricsTableProps) {
  return (
    <DataTable columns={columns} data={data} toolbar={<FabricsTableToolbar suppliers={suppliers} />} />
  );
}
