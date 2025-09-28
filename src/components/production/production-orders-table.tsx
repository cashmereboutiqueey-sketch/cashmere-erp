

'use client';

import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { ProductionOrder, Product, Order, OrderItem, ProductVariant, User } from '@/lib/types';
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
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { buttonVariants, Button } from '../ui/button';
import { MoreHorizontal, PlusCircle, X } from 'lucide-react';
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
import { Input } from '../ui/input';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { addProductionOrder, updateProductionOrderStatus, deleteProductionOrder, assignWorkerToProductionOrder } from '@/services/production-service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import type { TranslationKey } from '@/lib/types';
import { DataTableFacetedFilter } from '../shared/data-table-faceted-filter';
import { ProductionOrderDetailsDialog } from './production-order-details-dialog';
import { mockUsers } from '@/lib/data';

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  in_progress: 'secondary',
  done: 'default',
};

const statuses: { label: string, value: ProductionOrder['status'] }[] = [
    { label: 'Pending', value: 'pending'},
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Done', value: 'done' }
];

export const getColumns = (
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
  onStatusChange: (orderId: string, status: ProductionOrder['status']) => void,
  onViewDetails: (order: ProductionOrder) => void,
  onDelete: (order: ProductionOrder) => void,
  onAssignWorker: (order: ProductionOrder) => void,
): ColumnDef<ProductionOrder>[] => [
  {
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('product')} />
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
    accessorFn: (row) => row.product?.name,
  },
  {
    accessorKey: 'required_quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('quantity')} />
    ),
  },
    {
    accessorKey: 'worker_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('worker' as any)} />
    ),
    cell: ({ row }) => (
      <div>{row.original.worker_name || <span className='text-xs text-muted-foreground'>Unassigned</span>}</div>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('status')} />
    ),
    cell: ({ row }) => (
      <Badge
        variant={statusVariantMap[row.original.status]}
        className="capitalize"
      >
        {t(row.original.status as TranslationKey) || row.original.status.replace('_', ' ')}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'source_order',
    header: t('source') as string,
    accessorFn: (row) => row.sales_order_id ? `${t('order')} #${row.sales_order_id.slice(0,4)}` : t('forStock'),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('date')} />
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
              <DropdownMenuItem onClick={() => onViewDetails(order)}>{t('viewDetails')}</DropdownMenuItem>
               <DropdownMenuItem onClick={() => onAssignWorker(order)}>{t('assignWorker' as any)}</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>{t('updateStatus')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {statuses.map(status => (
                      <DropdownMenuItem key={status.value} onClick={() => onStatusChange(order.id, status.value)}>
                          <span className="capitalize">{t(status.value as TranslationKey) || status.label.replace('_', ' ')}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(order)}>{t('delete')}</DropdownMenuItem>
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
  const { t } = useTranslation();

  const [orderType, setOrderType] = useState('stock');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const workers = mockUsers.filter(u => u.role === 'production' || u.role === 'admin');

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
      toast({ variant: 'destructive', title: t('invalidSelections'), description: t('invalidSelectionsDesc') });
      return;
    }
    
    const worker = workers.find(w => w.id === selectedWorkerId);

    try {
      const productionOrderData = {
        product_id: selectedProduct.id,
        variant_id: selectedVariant.id,
        sales_order_id: orderType === 'order' && selectedSalesOrder ? selectedSalesOrder.id : null,
        required_quantity: quantity,
        status: 'pending' as ProductionOrder['status'],
        worker_id: worker?.id,
        worker_name: worker?.name,
      };

      await addProductionOrder(productionOrderData);
      toast({ title: t('success'), description: t('productionOrderCreated') });
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: t('failedToCreateProductionOrder') });
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
          {t('addProductionOrder')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addProductionOrder')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('type')}</Label>
               <RadioGroup
                value={orderType}
                onValueChange={handleOrderTypeChange}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stock" id="stock" />
                  <Label htmlFor="stock">{t('forStock')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="order" id="order" />
                  <Label htmlFor="order">{t('forSalesOrder')}</Label>
                </div>
              </RadioGroup>
           </div>
            {orderType === 'order' && (
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sales-order" className="text-right">
                  {t('salesOrder')}
                </Label>
                <Select onValueChange={handleSalesOrderChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('selectAnOrder')} />
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
              {t('product')}
            </Label>
            <Select onValueChange={handleProductVariantChange} value={selectedVariant?.id || ''} disabled={(orderType === 'order' && !selectedSalesOrder)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('selectAProductVariant')} />
              </SelectTrigger>
              <SelectContent>
                {renderProductVariantOptions()}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              {t('quantity')}
            </Label>
            <Input id="quantity" type="number" className="col-span-3" placeholder="e.g., 25" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} disabled={orderType === 'order'} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="worker" className="text-right">
                {t('worker' as any)}
              </Label>
              <Select onValueChange={setSelectedWorkerId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('assignWorker' as any)} />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{t('createOrder')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignWorkerDialog({ order, isOpen, onOpenChange }: { order: ProductionOrder | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    
    const workers = mockUsers.filter(u => u.role === 'production' || u.role === 'admin');

    const handleSubmit = async () => {
        if (!order || !selectedWorkerId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a worker.' });
            return;
        }

        const worker = workers.find(w => w.id === selectedWorkerId);
        if (!worker) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected worker not found.' });
            return;
        }

        try {
            await assignWorkerToProductionOrder(order.id, worker.id, worker.name);
            toast({ title: 'Success', description: `Order assigned to ${worker.name}.` });
            onOpenChange(false);
            window.location.reload();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign worker.' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('assignWorker' as any)}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="worker" className="text-right">
                            {t('worker' as any)}
                        </Label>
                        <Select onValueChange={setSelectedWorkerId} defaultValue={order?.worker_id}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder={t('selectWorker' as any)} />
                            </SelectTrigger>
                            <SelectContent>
                                {workers.map((worker) => (
                                <SelectItem key={worker.id} value={worker.id}>
                                    {worker.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{t('assign' as any)}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ProductionOrdersToolbar({ table, products }: { table: any, products: Product[] }) {
  const { t } = useTranslation();
  const isFiltered = table.getState().columnFilters.length > 0;

  const productOptions = products.map(p => ({
    label: p.name,
    value: p.name,
  }));
  
  const workerOptions = mockUsers
    .filter(u => u.role === 'production' || u.role === 'admin')
    .map(u => ({ label: u.name, value: u.name }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
         <DataTableFacetedFilter
          column={table.getColumn('product')}
          title={t('product')}
          options={productOptions}
        />
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title={t('status')}
          options={statuses.map(s => ({...s, label: t(s.value as TranslationKey) || s.label }))}
        />
         <DataTableFacetedFilter
          column={table.getColumn('worker_name')}
          title={t('worker' as any)}
          options={workerOptions}
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <AddProductionOrderDialog products={products} salesOrders={[]} />
      </div>
    </div>
  );
}

function DeleteProductionOrderDialog({ order, isOpen, onOpenChange }: { order: ProductionOrder | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!order) return;
        setIsDeleting(true);
        try {
            await deleteProductionOrder(order.id);
            toast({ title: t('success'), description: t('productionOrderDeleted') });
            onOpenChange(false);
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: t('error'), description: t('failedToDeleteProductionOrder') });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmDeleteProductionOrder')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('confirmDeleteProductionOrderDesc', {
                            quantity: order?.required_quantity,
                            name: order?.product?.name,
                        })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                        {isDeleting ? t('deleting') : t('deleteOrder')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function ProductionOrdersTable({ data, products, salesOrders }: ProductionOrdersTableProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignWorkerOpen, setIsAssignWorkerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  
  const handleStatusChange = async (orderId: string, status: ProductionOrder['status']) => {
    try {
      await updateProductionOrderStatus(orderId, status);
      toast({
        title: t('success'),
        description: t('productionOrderStatusUpdated', { status: t(status as TranslationKey) || status.replace('_', ' ') }),
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToUpdateOrderStatus'),
      });
    }
  };

  const handleViewDetails = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleDelete = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const handleAssignWorker = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsAssignWorkerOpen(true);
  };

  const columns = getColumns(t, handleStatusChange, handleViewDetails, handleDelete, handleAssignWorker);

  return (
    <>
      <DataTable 
        columns={columns} 
        data={data} 
        toolbar={(table) => <ProductionOrdersToolbar table={table} products={products} />} 
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      />
      <ProductionOrderDetailsDialog
        order={selectedOrder}
        salesOrders={salesOrders}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
      <DeleteProductionOrderDialog
          order={selectedOrder}
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
      />
       <AssignWorkerDialog
          order={selectedOrder}
          isOpen={isAssignWorkerOpen}
          onOpenChange={setIsAssignWorkerOpen}
      />
    </>
  );
}
