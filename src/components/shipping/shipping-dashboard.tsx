'use client';

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { ShippableCustomer } from '@/app/(app)/shipping/page';
import {
  ChevronDown,
  ChevronRight,
  PackageCheck,
  Ship,
  Store,
  Truck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Order, ShippingStatus } from '@/lib/types';
import { updateOrderShipping } from '@/services/order-service';
import { useToast } from '@/hooks/use-toast';
import { capitalize } from 'string-ts';

const shippingStatusVariantMap: {
  [key in ShippingStatus]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  ready_to_ship: 'secondary',
  ready_for_pickup: 'secondary',
  assigned_to_carrier_a: 'default',
  assigned_to_carrier_b: 'default',
  shipped: 'default',
  delivered: 'default',
  picked_up: 'default',
};

const CustomerRow = ({
  shippableCustomer,
}: {
  shippableCustomer: ShippableCustomer;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const { customer, orders } = shippableCustomer;

  const handleShipAll = () => {
    // This is where you would integrate with a shipping API
    console.log('Shipping all orders for:', customer.name, orders);
    toast({
      title: 'Shipment Created (Simulation)',
      description: `Preparing shipment for ${customer.name} with ${orders.length} order(s).`,
    });
  };
  
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

  return (
    <Collapsible
      asChild
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-b"
    >
      <>
        <TableRow className="hover:bg-transparent">
          <TableCell className="w-12">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage
                  src={customer.avatarUrl}
                  alt={customer.name}
                  className="h-9 w-9"
                />
                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {customer.email}
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <Badge variant="outline">{orders.length}</Badge>
          </TableCell>
          <TableCell className="text-right">
            <Button onClick={handleShipAll}>
              <Ship className="mr-2" /> Ship All
            </Button>
          </TableCell>
        </TableRow>

        <CollapsibleContent asChild>
          <TableRow>
            <TableCell colSpan={4} className="p-0">
              <div className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Orders for {customer.name}</h4>
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-background rounded-md border"
                    >
                      <div>
                        <p className="font-mono text-sm">
                          ID: {order.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                       <Badge variant={shippingStatusVariantMap[order.shipping_status || 'pending']} className="capitalize">
                            {order.shipping_status?.replace(/_/g, ' ') || 'pending'}
                       </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShippingStatusChange(order.id, 'picked_up')}
                        >
                          <Store className="mr-2 h-4 w-4" /> Mark as Picked Up
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShippingStatusChange(order.id, 'assigned_to_carrier_a')}
                        >
                          <Truck className="mr-2 h-4 w-4" /> Carrier A
                        </Button>
                         <Button
                          size="sm"
                          variant="outline"
                           onClick={() => handleShippingStatusChange(order.id, 'assigned_to_carrier_b')}
                        >
                          <Truck className="mr-2 h-4 w-4" /> Carrier B
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShippingStatusChange(order.id, 'shipped')}
                        >
                          <PackageCheck className="mr-2 h-4 w-4" /> Mark as Shipped
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};

export function ShippingDashboard({ data }: { data: ShippableCustomer[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Ready Orders</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((shippableCustomer) => (
              <CustomerRow
                key={shippableCustomer.customer.id}
                shippableCustomer={shippableCustomer}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No orders are ready for shipping.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
