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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  ChevronDown,
  ChevronRight,
  PackageCheck,
  Ship,
  Store,
  Truck,
  DollarSign,
  Package,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Order, ShippingStatus } from '@/lib/types';
import { updateOrderShipping } from '@/services/order-service';
import { useToast } from '@/hooks/use-toast';
import { capitalize } from 'string-ts';
import { Separator } from '../ui/separator';

const shippingStatusVariantMap: {
  [key in ShippingStatus]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  ready_to_ship: 'outline',
  ready_for_pickup: 'outline',
  assigned_to_carrier_a: 'secondary',
  assigned_to_carrier_b: 'secondary',
  out_for_delivery: 'secondary',
  shipped: 'default',
  delivered: 'default',
  picked_up: 'default',
  cod_remitted: 'default',
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
}

const OrderRow = ({ order }: { order: Order }) => {
    const { toast } = useToast();
    const handleStatusUpdate = async (status: ShippingStatus) => {
        try {
            await updateOrderShipping(order.id, status);
            toast({ title: 'Success', description: `Order ${order.id.slice(0, 4)} status updated.` });
            window.location.reload();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };
    return (
        <TableRow>
            <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
            <TableCell>{order.customer?.name}</TableCell>
            <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
            <TableCell className="text-right">
                <Button size="xs" variant="outline" onClick={() => handleStatusUpdate('out_for_delivery')}>Out for Delivery</Button>
                <Button size="xs" variant="outline" className="ml-2" onClick={() => handleStatusUpdate('delivered')}>Delivered</Button>
            </TableCell>
        </TableRow>
    );
};

const UnpaidCODOrderRow = ({ order }: { order: Order }) => (
    <TableRow>
        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
        <TableCell>{order.customer?.name}</TableCell>
        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
        <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
    </TableRow>
);


const CarrierDashboard = ({ carrierName, carrierId, orders }: { carrierName: string, carrierId: 'a' | 'b', orders: Order[] }) => {
  const [pendingOpen, setPendingOpen] = React.useState(true);
  const [unpaidCodOpen, setUnpaidCodOpen] = React.useState(false);
  
  const assignedStatus = `assigned_to_carrier_${carrierId}` as const;
  
  const pendingShipments = orders.filter(o => o.shipping_status === assignedStatus);
  const deliveredCOD = orders.filter(o => o.shipping_status === 'delivered' && o.payment_method === 'cash' && (o.carrier_id === carrierId));
  const totalCOD = deliveredCOD.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck /> {carrierName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingShipments.length}</div>
                        <p className="text-xs text-muted-foreground">Orders to be shipped</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unpaid COD Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalCOD)}</div>
                        <p className="text-xs text-muted-foreground">From {deliveredCOD.length} delivered orders</p>
                    </CardContent>
                </Card>
            </div>

            <Separator />
            
             <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        {pendingOpen ? <ChevronDown /> : <ChevronRight />}
                        Pending Shipments ({pendingShipments.length})
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {pendingShipments.length > 0 ? pendingShipments.map(o => <OrderRow key={o.id} order={o} />) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">No pending shipments</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CollapsibleContent>
            </Collapsible>
            
             <Collapsible open={unpaidCodOpen} onOpenChange={setUnpaidCodOpen}>
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        {unpaidCodOpen ? <ChevronDown /> : <ChevronRight />}
                        Unpaid COD Orders ({deliveredCOD.length})
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="p-2 space-y-2">
                        <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                            <span className="font-bold">Total to be Remitted: {formatCurrency(totalCOD)}</span>
                            <Button size="sm" disabled={totalCOD === 0}>Settle COD Balance</Button>
                        </div>
                        <Table>
                            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {deliveredCOD.length > 0 ? deliveredCOD.map(o => <UnpaidCODOrderRow key={o.id} order={o} />) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">No unpaid COD orders</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CollapsibleContent>
            </Collapsible>

        </CardContent>
    </Card>
  );
};

export function ShippingDashboard({ allOrders }: { allOrders: Order[] }) {
  
  const carrierA_Orders = allOrders.filter(o => o.shipping_status?.includes('carrier_a'));
  const carrierB_Orders = allOrders.filter(o => o.shipping_status?.includes('carrier_b'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CarrierDashboard carrierName="Shipping Co. A" carrierId="a" orders={allOrders} />
        <CarrierDashboard carrierName="Shipping Co. B" carrierId="b" orders={allOrders} />
    </div>
  );
}
