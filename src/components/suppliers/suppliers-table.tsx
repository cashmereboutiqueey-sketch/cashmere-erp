
'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { Supplier, TranslationKey } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { addSupplier, deleteSupplier, updateSupplier } from '@/services/supplier-service';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { DataTableToolbar } from '../shared/data-table-toolbar';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { flexRender, useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { useTranslation } from '@/hooks/use-translation';


interface SuppliersTableProps {
  data: Supplier[];
  onRowClick: (supplier: Supplier) => void;
  selectedSupplierId?: string | null;
  onDataChange: () => void;
}


const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;


function AddEditSupplierDialog({ supplier, onFinished, isOpen, onOpenChange }: { supplier: Supplier | null, onFinished: () => void, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEditMode = !!supplier;
  
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', phone: '' }
  });

  const { handleSubmit, control, reset } = form;

  useEffect(() => {
      if (isOpen) {
          if (isEditMode && supplier) {
            reset(supplier);
          } else {
            reset({ name: '', phone: '' });
          }
      }
  }, [isOpen, isEditMode, supplier]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (isEditMode && data.id) {
        await updateSupplier(data.id, data);
        toast({ title: t('success'), description: "Supplier updated successfully." });
      } else {
        await addSupplier(data);
        toast({ title: t('success'), description: t('supplierAddedSuccess') });
      }
      onOpenChange(false);
      onFinished();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: 'destructive',
            title: t('error'),
            description: isEditMode ? `Failed to update supplier: ${errorMessage}` : `Failed to add supplier: ${errorMessage}`,
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Supplier" : t('addSupplier')}</DialogTitle>
          <DialogDescription>{isEditMode ? "Update the supplier's details." : t('addSupplierDesc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField control={control} name="name" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('name')}</FormLabel>
                  <FormControl><Input {...field} className="col-span-3" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
            )}/>
             <FormField control={control} name="phone" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('phone')}</FormLabel>
                  <FormControl><Input {...field} className="col-span-3" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
            )}/>
            <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (isEditMode ? "Saving..." : t('adding')) : (isEditMode ? "Save Changes" : t('addSupplier'))}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function SuppliersTableToolbar({ table, onAdd }: { table: any, onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <DataTableToolbar table={table}>
        <Input
            placeholder={t('filterSuppliers')}
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="ml-auto">
            <Button size="sm" className="h-8" onClick={onAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addSupplier')}
            </Button>
        </div>
    </DataTableToolbar>
  );
}

export const getColumns = (
    t: (key: TranslationKey) => string,
    onEdit: (supplier: Supplier) => void,
    onDelete: (supplier: Supplier) => void
): ColumnDef<Supplier>[] => [
  {
    accessorKey: 'name',
    header: t('supplier') as string,
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{supplier.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{supplier.name}</div>
          </div>
        </div>
      );
    },
  },
   {
    accessorKey: 'phone',
    header: t('phone') as string,
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

function DeleteSupplierDialog({ supplier, isOpen, onOpenChange, onFinished }: { supplier: Supplier | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onFinished: () => void }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!supplier) return;
        setIsDeleting(true);
        try {
            await deleteSupplier(supplier.id);
            toast({ title: t('success'), description: "Supplier deleted successfully." });
            onOpenChange(false);
            onFinished();
        } catch (error) {
            toast({ variant: "destructive", title: t('error'), description: "Failed to delete supplier." });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this supplier?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the supplier "{supplier?.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                        {isDeleting ? t('deleting') : t('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function SuppliersTable({ data, onRowClick, selectedSupplierId, onDataChange }: SuppliersTableProps) {
  const { t } = useTranslation();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const handleAdd = () => {
    setSelectedSupplier(null);
    setIsDialogOpen(true);
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  }

  const columns = getColumns(t, handleEdit, handleDelete);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  
  const handleRowClick = (row: Row<Supplier>) => {
    onRowClick(row.original);
  };


  return (
      <div className="space-y-4">
        <SuppliersTableToolbar table={table} onAdd={handleAdd} />
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => handleRowClick(row)}
                    className={cn("cursor-pointer", selectedSupplierId === row.original.id && "bg-muted")}
                    >
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
                    <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    >
                    {t('noResults')}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
         <div className="flex items-center justify-end space-x-2 py-4">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            >
            {t('previous')}
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            {t('next')}
            </Button>
        </div>
        <AddEditSupplierDialog 
            supplier={selectedSupplier}
            onFinished={onDataChange}
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
        />
        <DeleteSupplierDialog 
            supplier={selectedSupplier}
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onFinished={onDataChange}
        />
    </div>
  );
}
