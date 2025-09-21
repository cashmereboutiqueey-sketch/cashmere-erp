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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { mockProductFabrics, mockFabrics, mockProducts, mockOrders } from '@/lib/data';
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
import { Input } from '../ui/input';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

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

function AddProductionOrderDialog() {
  const [open, setOpen] = useState(false);
  const [orderType, setOrderType] = useState('stock');

  const pendingSalesOrders = mockOrders.filter(o => o.status === 'pending' || o.status === 'processing');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Production Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Production Order</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
               <RadioGroup
                value={orderType}
                onValueChange={setOrderType}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stock" id="stock" />
                  <Label htmlFor="stock">For Store Stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="order" id="order" />
                  <Label htmlFor="order">For Sales Order</Label>
                </div>
              </RadioGroup>
           </div>
            {orderType === 'order' && (
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sales-order" className="text-right">
                  Sales Order
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingSalesOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.id} - {order.customer?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">
              Product
            </Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {mockProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input id="quantity" type="number" className="col-span-3" placeholder="e.g., 25" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Create Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductionOrdersToolbar() {
  return (
    <>
      <Input
        placeholder="Filter production orders..."
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <AddProductionOrderDialog />
      </div>
    </>
  );
}

export function ProductionOrdersTable({ data }: ProductionOrdersTableProps) {
  return <DataTable columns={columns} data={data} toolbar={<ProductionOrdersToolbar />} />;
}
