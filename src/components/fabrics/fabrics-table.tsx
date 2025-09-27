'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Fabric, Supplier, TranslationKey } from '@/lib/types';
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
import { useTranslation } from '@/hooks/use-translation';


type FabricWithSupplier = Fabric & { supplier?: Supplier };

export const getColumns = (
    t: (key: TranslationKey, values?: Record<string, string | number>) => string
): ColumnDef<FabricWithSupplier>[] => [
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
      <DataTableColumnHeader column={column} title={t('fabric')} />
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
      <DataTableColumnHeader column={column} title={t('color')} />
    ),
  },
  {
    accessorKey: 'length_in_meters',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('stockMeters')} />
    ),
    cell: ({ row }) => {
      return <div>{row.original.length_in_meters}m</div>;
    },
  },
   {
    accessorKey: 'price_per_meter',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('costPerMeter')} />
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
    header: t('supplier') as string,
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
              <DropdownMenuItem>{t('edit')}</DropdownMenuItem>
              <DropdownMenuItem>{t('delete')}</DropdownMenuItem>
              <DropdownMenuItem>{t('viewDetails')}</DropdownMenuItem>
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
  const { t } = useTranslation();
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
        title: t('success'),
        description: t('fabricAddedSuccess'),
      });
      setOpen(false);
      form.reset();
      window.location.reload(); 
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fabricAddedError'),
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
          {t('addFabric')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addFabric')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('name')}</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder={t('fabricNamePlaceholder')} />
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
                  <FormLabel className="text-right">{t('code')}</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder={t('fabricCodePlaceholder')} />
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
                  <FormLabel className="text-right">{t('color')}</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder={t('fabricColorPlaceholder')} />
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
                  <FormLabel className="text-right">{t('initialStock')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" className="col-span-3" placeholder="100" />
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
                  <FormLabel className="text-right">{t('costPerMeter')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" className="col-span-3" placeholder="25.50" />
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
                  <FormLabel className="text-right">{t('minStockMeters')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" className="col-span-3" placeholder="20" />
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
                  <FormLabel className="text-right">{t('supplier')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t('selectSupplier')} />
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
                    {form.formState.isSubmitting ? t('adding') : t('addFabric')}
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
  const { t } = useTranslation();
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
        title: t('success'),
        description: t('purchaseRecordedSuccess'),
      });
      setOpen(false);
      form.reset();
      window.location.reload(); 
    } catch (error) {
       toast({
        variant: 'destructive',
        title: t('error'),
        description: t('purchaseRecordedError'),
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
          {t('recordPurchase')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('recordPurchase')}</DialogTitle>
          <DialogDescription>
            {t('recordPurchaseDesc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('supplier')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t('selectSupplier')} />
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
                  <FormLabel className="text-right">{t('totalCost')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" className="col-span-3" placeholder="500.00" />
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
                  <FormLabel className="text-right">{t('payment')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t('selectPaymentStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">{t('paidFromCash')}</SelectItem>
                      <SelectItem value="unpaid">{t('toBePaidCredit')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('recording') : t('addPurchase')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function FabricsTableToolbar({ suppliers }: { suppliers: Supplier[] }) {
  const { t } = useTranslation();
  return (
    <>
      <Input
        placeholder={t('filterFabrics')}
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
  const { t } = useTranslation();
  const columns = getColumns(t);
  return (
    <DataTable columns={columns} data={data} toolbar={<FabricsTableToolbar suppliers={suppliers} />} />
  );
}
