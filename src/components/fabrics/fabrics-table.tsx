
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
import { Button, buttonVariants } from '../ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addExpense } from '@/services/finance-service';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { useTranslation } from '@/hooks/use-translation';
import { useFabricStore } from '@/stores/fabric-store';


type FabricWithSupplier = Fabric & { supplier?: Supplier };

interface FabricsTableProps {
  data: FabricWithSupplier[];
  suppliers: Supplier[];
}

const fabricSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  color: z.string().min(1, "Color is required"),
  length_in_meters: z.preprocess(val => Number(val), z.number().min(0)),
  price_per_meter: z.preprocess(val => Number(val), z.number().min(0)),
  min_stock_level: z.preprocess(val => Number(val), z.number().min(0)),
  supplier_id: z.string().min(1, "Supplier is required"),
});

type FabricFormData = z.infer<typeof fabricSchema>;

function AddEditFabricDialog({ fabric, suppliers, isOpen, onOpenChange }: { fabric: Fabric | null, suppliers: Supplier[], isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addFabric, updateFabric, isLoading } = useFabricStore();
  const isEditMode = !!fabric;

  const form = useForm<FabricFormData>({
    resolver: zodResolver(fabricSchema),
    defaultValues: { name: '', code: '', color: '', length_in_meters: 0, price_per_meter: 0, min_stock_level: 0, supplier_id: '' }
  });

  const { handleSubmit, control, reset } = form;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && fabric) {
            reset(fabric);
        } else {
            reset({ name: '', code: '', color: '', length_in_meters: 0, price_per_meter: 0, min_stock_level: 0, supplier_id: '' });
        }
    }
  }, [isOpen, fabric, isEditMode, reset]);


  const onSubmit = async (data: FabricFormData) => {
    try {
      if (isEditMode && data.id) {
        await updateFabric(data.id, data);
        toast({ title: t('success'), description: "Fabric updated successfully." });
      } else {
        await addFabric(data as Omit<Fabric, 'id'>);
        toast({ title: t('success'), description: t('fabricAddedSuccess') });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: isEditMode ? "Failed to update fabric." : t('fabricAddedError'),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Fabric" : t('addFabric')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <FormField control={control} name="name" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('name')}</FormLabel>
                  <FormControl><Input {...field} className="col-span-3" placeholder={t('fabricNamePlaceholder')} /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )} />
            <FormField control={control} name="code" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('code')}</FormLabel>
                  <FormControl><Input {...field} className="col-span-3" placeholder={t('fabricCodePlaceholder')} /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )} />
             <FormField control={control} name="color" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('color')}</FormLabel>
                  <FormControl><Input {...field} className="col-span-3" placeholder={t('fabricColorPlaceholder')} /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )} />
            <FormField control={control} name="length_in_meters" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{isEditMode ? "Stock (m)" : t('initialStock')}</FormLabel>
                  <FormControl><Input {...field} type="number" className="col-span-3" placeholder="100" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )} />
             <FormField control={control} name="price_per_meter" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('costPerMeter')}</FormLabel>
                  <FormControl><Input {...field} type="number" className="col-span-3" placeholder="25.50" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )} />
            <FormField control={control} name="min_stock_level" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('minStockMeters')}</FormLabel>
                  <FormControl><Input {...field} type="number" className="col-span-3" placeholder="20" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )} />
            <FormField control={control} name="supplier_id" render={({ field }) => (
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
              )} />
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (isEditMode ? "Saving..." : t('adding')) : (isEditMode ? "Save Changes" : t('addFabric'))}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export const getColumns = (
    t: (key: TranslationKey, values?: Record<string, string | number>) => string,
    onEdit: (fabric: Fabric) => void,
    onDelete: (fabric: Fabric) => void
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
              <DropdownMenuItem onClick={() => onEdit(row.original)}>{t('edit')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive">{t('delete')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

const purchaseSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  cost: z.preprocess((val) => Number(val), z.number().min(0.01, "Cost must be greater than zero")),
  payment_status: z.enum(['paid', 'unpaid']),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

function RecordPurchaseDialog({ suppliers }: { suppliers: Supplier[]}) {
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

function DeleteFabricDialog({ fabric, isOpen, onOpenChange }: { fabric: Fabric | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { deleteFabric, isLoading } = useFabricStore();

    const handleDelete = async () => {
        if (!fabric) return;
        try {
            await deleteFabric(fabric.id);
            toast({ title: t('success'), description: "Fabric deleted successfully." });
            onOpenChange(false);
        } catch (error) {
            toast({ variant: "destructive", title: t('error'), description: "Failed to delete fabric." });
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this fabric?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the fabric "{fabric?.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isLoading} className={buttonVariants({ variant: "destructive" })}>
                        {isLoading ? t('deleting') : t('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function FabricsTableToolbar({ onAdd, suppliers }: { onAdd: () => void, suppliers: Supplier[]}) {
  const { t } = useTranslation();
  return (
    <>
      <Input
        placeholder={t('filterFabrics')}
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="h-8" onClick={onAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('addFabric')}
        </Button>
        <RecordPurchaseDialog suppliers={suppliers} />
      </div>
    </>
  );
}

export function FabricsTable({ data, suppliers }: FabricsTableProps) {
  const { t } = useTranslation();
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleAdd = () => {
    setSelectedFabric(null);
    setIsDialogOpen(true);
  }

  const handleEdit = (fabric: Fabric) => {
    setSelectedFabric(fabric);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (fabric: Fabric) => {
    setSelectedFabric(fabric);
    setIsDeleteOpen(true);
  };
  
  const columns = getColumns(t, handleEdit, handleDelete);
  return (
    <>
    <DataTable columns={columns} data={data} toolbar={<FabricsTableToolbar onAdd={handleAdd} suppliers={suppliers} />} />
    <AddEditFabricDialog
      fabric={selectedFabric}
      suppliers={suppliers}
      isOpen={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    />
    <DeleteFabricDialog 
        fabric={selectedFabric}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
    />
    </>
  );
}
