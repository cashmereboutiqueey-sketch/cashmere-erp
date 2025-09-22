'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ProductionOrder, Product, Fabric, Order, OrderItem, ProductVariant } from '@/lib/types';
import { DataTable } from '../shared/data-table';
import { DataTableColumnHeader } from '../shared/data-table-column-header';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
import { addProductionOrder, updateProductionOrderStatus } from '@/services/production-service';
import { useToast } from '@/hooks/use-toast';

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  in_progress: 'secondary',
  done: 'default',
};

const statuses: ProductionOrder['status'][] = ['pending', 'in_progress', 'done'];

export const getColumns = (onStatusChange: (orderId: string, status: ProductionOrder['status']) => void): ColumnDef<ProductionOrder>[] => [
  {
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      const product = row.original.product;
      const variant = row.original.variant;
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
          <div>
            <span className="font-medium">{product.name}</span>
            {variant && <div className="text-sm text-muted-foreground">{variant.color} {variant.size}</div>}
          </div>
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
    id: 'source_order',
    header: 'Source',
    accessorFn: (row) => row.sales_order_id ? `Order #${row.sales_order_id.slice(0,4)}` : 'For Stock',
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
                    {statuses.map(status => (
                      <DropdownMenuItem key={status} onClick={() => onStatusChange(order.id, status)}>
                          <span className="capitalize">{status.replace('_', ' ')}</span>
                      </DropdownMenuItem>
                    ))}
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
  products: Product[];
  salesOrders: Order[];
}

function AddProductionOrderDialog({ products, salesOrders }: { products: Product[], salesOrders: Order[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [orderType, setOrderType] = useState('stock');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const pendingSalesOrders = salesOrders.filter(o => o.status === 'pending' || o.status === 'processing');

  const handleOrderTypeChange = (type: string) => {
    setOrderType(type);
    setSelectedSalesOrder(null);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
  }

  const handleSalesOrderChange = (orderId: string) => {
    const order = salesOrders.find(o => o.id === orderId);
    setSelectedSalesOrder(order || null);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
  };
  
  const getProductsForOrder = (orderId: string): {product: Product, variant: ProductVariant}[] => {
      const order = salesOrders.find(o => o.id === orderId);
      if (!order || !order.items) return [];

      return order.items.map(item => {
          for (const p of products) {
            const v = p.variants.find(va => va.id === item.variant.id);
            if(v) return { product: p, variant: v };
          }
          return null;
      }).filter(item => item !== null) as {product: Product, variant: ProductVariant}[];
  }
  
  const handleProductVariantChange = (variantId: string) => {
    if (orderType === 'order' && selectedSalesOrder) {
      const { product, variant } = getProductsForOrder(selectedSalesOrder.id).find(p => p.variant.id === variantId) || {};
      setSelectedProduct(product || null);
      setSelectedVariant(variant || null);
      const orderItem = selectedSalesOrder.items?.find(i => i.variant.id === variantId);
      setQuantity(orderItem?.quantity || 1);
    } else {
      for (const p of products) {
        const v = p.variants.find(va => va.id === variantId);
        if (v) {
          setSelectedProduct(p);
          setSelectedVariant(v);
          break;
        }
      }
    }
  }
  
  const handleSubmit = async () => {
    if (!selectedProduct || !selectedVariant || quantity <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Selections', description: 'Please select a product, variant, and quantity.' });
      return;
    }
    
    try {
      const productionOrderData = {
        product_id: selectedProduct.id,
        variant_id: selectedVariant.id,
        sales_order_id: orderType === 'order' && selectedSalesOrder ? selectedSalesOrder.id : null,
        required_quantity: quantity,
        status: 'pending' as ProductionOrder['status'],
      };

      await addProductionOrder(productionOrderData);
      toast({ title: 'Success', description: 'Production order created.' });
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create production order.' });
    }
  }
  
  const renderProductVariantOptions = () => {
    if (orderType === 'order' && selectedSalesOrder) {
      return getProductsForOrder(selectedSalesOrder.id).map(({ product, variant }) => (
        <SelectItem key={variant.id} value={variant.id}>
          {product.name} - {variant.size} {variant.color}
        </SelectItem>
      ));
    }
    return products.flatMap(product => 
      product.variants.map(variant => (
        <SelectItem key={variant.id} value={variant.id}>
          {product.name} - {variant.size} {variant.color}
        </SelectItem>
      ))
    );
  };


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
                onValueChange={handleOrderTypeChange}
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
                <Select onValueChange={handleSalesOrderChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingSalesOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        #{order.id.slice(0,4)}... - {order.customer?.name}
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
            <Select onValueChange={handleProductVariantChange} value={selectedVariant?.id || ''} disabled={(orderType === 'order' && !selectedSalesOrder)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a product variant" />
              </SelectTrigger>
              <SelectContent>
                {renderProductVariantOptions()}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input id="quantity" type="number" className="col-span-3" placeholder="e.g., 25" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} disabled={orderType === 'order'} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Create Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductionOrdersToolbar({ products, salesOrders }: { products: Product[], salesOrders: Order[] }) {
  return (
    <>
      <Input
        placeholder="Filter production orders..."
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <AddProductionOrderDialog products={products} salesOrders={salesOrders} />
      </div>
    </>
  );
}

export function ProductionOrdersTable({ data, products, salesOrders }: ProductionOrdersTableProps) {
  const { toast } = useToast();
  
  const handleStatusChange = async (orderId: string, status: ProductionOrder['status']) => {
    try {
      await updateProductionOrderStatus(orderId, status);
      toast({
        title: 'Success',
        description: `Production order status updated to ${status.replace('_', ' ')}.`,
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order status.',
      });
    }
  };

  const columns = getColumns(handleStatusChange);

  return <DataTable columns={columns} data={data} toolbar={<ProductionOrdersToolbar products={products} salesOrders={salesOrders} />} />;
}
