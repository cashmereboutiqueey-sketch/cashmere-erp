'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Order, ShippingStatus } from '@/lib/types';
import { DataTable } from '../shared/data-table';
import { DataTableColumnHeader } from '../shared/data-table-column-header';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, PackageCheck, Store, Truck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { updateOrderShipping } from '@/services/order-service';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { capitalize } from 'string-ts';


const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  sold_out: 'destructive',
};

const shippingStatusVariantMap: { [key in ShippingStatus]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'outline',
  ready_to_ship: 'secondary',
  ready_for_pickup: 'secondary',
  assigned_to_carrier_a: 'default',
  assigned_to_carrier_b: 'default',
  shipped: 'default',
  delivered: 'default',
  picked_up: 'default',
};

const shippingStatuses: ShippingStatus[] = [
    'ready_for_pickup',
    'assigned_to_carrier_a',
    'assigned_to_carrier_b',
    'shipped'
];

export function getColumns(
  onShippingStatusChange: (orderId: string, status: ShippingStatus) => void
): ColumnDef<Order>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order ID" />
      ),
      cell: ({ row }) => <div className="font-mono">{row.original.id.slice(0, 8)}...</div>,
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customer;
        if (!customer) return null;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
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
        <DataTableColumnHeader column={column} title="Order Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={statusVariantMap[row.original.status]} className="capitalize">
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'shipping_status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fulfillment" />
      ),
      cell: ({ row }) => {
        const status = row.original.shipping_status || 'pending';
        return (
           <Badge variant={shippingStatusVariantMap[status]} className="capitalize">
                {status.replace(/_/g, ' ')}
           </Badge>
        )
      }
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
                <DropdownMenuItem onClick={() => onShippingStatusChange(order.id, 'ready_for_pickup')}>
                    <Store className="mr-2" /> Mark for Pickup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShippingStatusChange(order.id, 'assigned_to_carrier_a')}>
                    <Truck className="mr-2" /> Assign to Shipping Co. A
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onShippingStatusChange(order.id, 'assigned_to_carrier_b')}>
                    <Truck className="mr-2" /> Assign to Shipping Co. B
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onShippingStatusChange(order.id, 'shipped')}>
                    <PackageCheck className="mr-2" /> Mark as Shipped
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

interface ShippingTableProps {
  data: Order[];
}

export function ShippingTable({ data }: ShippingTableProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

  const handleShippingStatusChange = async (orderId: string, status: ShippingStatus) => {
    try {
      await updateOrderShipping(orderId, status);
      toast({
        title: 'Success',
        description: `Order fulfillment status updated to ${capitalize(status.replace(/_/g, ' '))}.`,
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

  const columns = getColumns(handleShippingStatusChange);

  const filterOrdersByTab = (tab: string) => {
    if (tab === 'all') return data;
    if (tab === 'ready_to_ship') return data.filter(o => (o.status === 'processing' || o.status === 'completed') && o.shipping_status === 'ready_to_ship');
    if (tab === 'in_production') return data.filter(o => o.status === 'pending');
    if (tab === 'ready_for_pickup') return data.filter(o => o.shipping_status === 'ready_for_pickup');
    if (tab === 'shipped') return data.filter(o => o.shipping_status === 'shipped');
    return [];
  };
  
  const filteredData = filterOrdersByTab(activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="all">All Orders</TabsTrigger>
        <TabsTrigger value="ready_for_pickup">Ready for Pickup</TabsTrigger>
        <TabsTrigger value="ready_to_ship">Ready to Ship</TabsTrigger>
        <TabsTrigger value="in_production">In Production</TabsTrigger>
        <TabsTrigger value="shipped">Shipped</TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab} className="mt-4">
         <DataTable columns={columns} data={filteredData} />
      </TabsContent>
    </Tabs>
  );
}
