'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { Supplier } from '@/lib/types';
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
import { Button } from '../ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { addSupplier } from '@/services/supplier-service';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { DataTableToolbar } from '../shared/data-table-toolbar';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { flexRender, useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table';


interface SuppliersTableProps {
  data: Supplier[];
  onRowClick: (supplier: Supplier) => void;
  selectedSupplierId?: string | null;
}


const supplierSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;


function AddSupplierDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  const onSubmit = async (data: SupplierFormData) => {
    try {
      await addSupplier(data);
      toast({
        title: 'Success',
        description: 'New supplier has been added.',
      });
      setOpen(false);
      form.reset();
      window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add supplier.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
    }}>
      <DialogTrigger asChild>
         <Button size="sm" className="h-8 ml-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>Enter the details for the new supplier.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Name</FormLabel>
                  <FormControl><Input {...field} className="col-span-3" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
            )}/>
             <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Email</FormLabel>
                  <FormControl><Input {...field} type="email" className="col-span-3" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
            )}/>
             <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Phone</FormLabel>
                  <FormControl><Input {...field} className="col-span-3" /></FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
            )}/>
            <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adding...' : 'Add Supplier'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function SuppliersTableToolbar({ table }: { table: any }) {
  return (
    <DataTableToolbar table={table}>
        <Input
            placeholder="Filter suppliers..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="ml-auto">
            <AddSupplierDialog />
        </div>
    </DataTableToolbar>
  );
}

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: 'name',
    header: 'Supplier',
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{supplier.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{supplier.name}</div>
            <div className="text-sm text-muted-foreground">{supplier.email}</div>
          </div>
        </div>
      );
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];


export function SuppliersTable({ data, onRowClick, selectedSupplierId }: SuppliersTableProps) {
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
        <SuppliersTableToolbar table={table} />
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
                    No results.
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
            Previous
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            Next
            </Button>
        </div>
    </div>
  );
}
