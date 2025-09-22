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
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { updateOrderStatus } from '@/services/order-service';
import { useToast } from '@/hooks/use-toast';
import { OrderDetailsDialog } from './order-details-dialog';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
};

const paymentStatusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  paid: 'default',
  unpaid: 'destructive',
  partially_paid: 'secondary',
};

const statuses: Order['status'][] = ['pending', 'processing', 'completed', 'cancelled'];

export function getColumns(
    onStatusChange: (orderId: string, status: Order['status']) => void,
    onViewDetails: (order: Order) => void
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
                {row.original.status}
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
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(order.id)}
                    >
                        Copy order ID
                    </DropdownMenuItem>
                     <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {statuses.map(status => (
                                    <DropdownMenuItem key={status} onClick={() => onStatusChange(order.id, status)}>
                                        <span className="capitalize">{status}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={() => onViewDetails(order)}>View details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            );
            },
        },
    ];
}


interface OrdersTableProps {
  data: Order[];
}

export function OrdersTable({ data }: OrdersTableProps) {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      toast({
        title: 'Success',
        description: `Order status updated to ${status}.`,
      });
      // This will cause a full page reload. For a smoother UX,
      // consider a state management solution to update just the table.
      window.location.reload();
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
  
  const columns = getColumns(handleStatusChange, handleViewDetails);

  return (
    <>
        <DataTable columns={columns} data={data} />
        <OrderDetailsDialog 
            order={selectedOrder}
            isOpen={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
        />
    </>
  );
}
