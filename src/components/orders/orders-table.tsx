
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Order } from '@/lib/types';
import { DataTable } from '../shared/data-table';
import { DataTableColumnHeader } from '../shared/data-table-column-header';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { buttonVariants, Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { deleteOrder, updateOrderStatus } from '@/services/order-service';
import { useToast } from '@/hooks/use-toast';
import { OrderDetailsDialog } from './order-details-dialog';
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

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  sold_out: 'destructive',
};

const paymentStatusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  paid: 'default',
  unpaid: 'destructive',
  partially_paid: 'secondary',
};

const statuses: Order['status'][] = ['pending', 'processing', 'completed', 'cancelled', 'sold_out'];

export function getColumns(
    onStatusChange: (orderId: string, status: Order['status']) => void,
    onViewDetails: (order: Order) => void,
    onDelete: (order: Order) => void
): ColumnDef<Order>[] {
    return [
        {
            accessorKey: 'id',
            header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Order ID" />
            ),
            cell: ({ row }) => <div className="font-mono">{row.original.id.slice(0, 8)}...</div>
        },
        {
            accessorKey: 'customer',
            header: 'Customer',
            cell: ({ row }) => {
            const customer = row.original.customer;
            if (!customer) return null;
            return (
                <div className="flex items-center gap-2">
                <Avatar className='h-8 w-8'>
                    <AvatarImage src={customer.avatarUrl} />
                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{customer.name}</span>
                </div>
            );
            },
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => (
            <Badge variant={statusVariantMap[row.original.status]} className="capitalize">
                {row.original.status.replace('_', ' ')}
            </Badge>
            ),
        },
        {
            accessorKey: 'payment_status',
            header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Payment" />
            ),
            cell: ({ row }) => (
            <Badge
                variant={paymentStatusVariantMap[row.original.payment_status]}
                className="capitalize"
            >
                {row.original.payment_status.replace('_', ' ')}
            </Badge>
            ),
        },
        {
            accessorKey: 'total_amount',
            header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Total" />
            ),
            cell: ({ row }) => {
            const amount = parseFloat(row.getValue('total_amount'));
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(amount);

            return <div className="font-medium">{formatted}</div>;
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
                    <DropdownMenuItem onClick={() => onViewDetails(order)}>View details</DropdownMenuItem>
                     <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(order.id)}
                    >
                        Copy order ID
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(order)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            );
            },
        },
    ];
}

function DeleteOrderDialog({ order, isOpen, onOpenChange, onDataChange }: { order: Order | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onDataChange: () => void }) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!order) return;
        setIsDeleting(true);
        try {
            await deleteOrder(order.id);
            toast({ title: "Success", description: "Order deleted successfully and stock replenished." });
            onOpenChange(false);
            onDataChange();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete order." });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this order?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete order #{order?.id.slice(0, 8)} and replenish the stock for all items in this order.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                        {isDeleting ? "Deleting..." : "Delete Order"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface OrdersTableProps {
  data: Order[];
  onDataChange: () => void;
}

export function OrdersTable({ data, onDataChange }: OrdersTableProps) {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      toast({
        title: 'Success',
        description: `Order status updated to ${status}.`,
      });
      onDataChange();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order status.',
      });
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };
  
  const handleDelete = (order: Order) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  }
  
  const columns = getColumns(handleStatusChange, handleViewDetails, handleDelete);

  return (
    <>
        <DataTable columns={columns} data={data} />
        <OrderDetailsDialog 
            order={selectedOrder}
            isOpen={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            onDataChange={onDataChange}
        />
         <DeleteOrderDialog
            order={selectedOrder}
            isOpen={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDataChange={onDataChange}
        />
    </>
  );
}
