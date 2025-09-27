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
import { useTranslation } from '@/hooks/use-translation';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
}

const OrderRow = ({ order }: { order: Order }) => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const handleStatusUpdate = async (status: ShippingStatus) => {
        try {
            await updateOrderShipping(order.id, status);
            toast({ title: t('success'), description: t('orderStatusUpdated', { orderId: order.id.slice(0, 4) }) });
            window.location.reload();
        } catch (e) {
            toast({ variant: 'destructive', title: t('errorUpdatingStatus') });
        }
    };
    return (
        <TableRow>
            <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
            <TableCell>{order.customer?.name}</TableCell>
            <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
            <TableCell className="text-right">
                <Button size="xs" variant="outline" onClick={() => handleStatusUpdate('out_for_delivery')}>{t('outForDelivery')}</Button>
                <Button size="xs" variant="outline" className="ml-2" onClick={() => handleStatusUpdate('delivered')}>{t('delivered')}</Button>
            </TableCell>
        </TableRow>
    );
};

const UnpaidCODOrderRow = ({ order }: { order: Order }) => {
    const { t } = useTranslation();
    return (
        <TableRow>
            <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
            <TableCell>{order.customer?.name}</TableCell>
            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
        </TableRow>
    );
};


const CarrierDashboard = ({ carrierNameKey, carrierId, orders }: { carrierNameKey: 'shippingCompanyA' | 'shippingCompanyB', carrierId: 'a' | 'b', orders: Order[] }) => {
  const { t } = useTranslation();
  const [pendingOpen, setPendingOpen] = React.useState(true);
  const [unpaidCodOpen, setUnpaidCodOpen] = React.useState(false);
  
  const assignedStatus = `assigned_to_carrier_${carrierId}` as const;
  
  const pendingShipments = orders.filter(o => o.shipping_status === assignedStatus);
  const deliveredCOD = orders.filter(o => o.shipping_status === 'delivered' && o.payment_method === 'cash' && (o.carrier_id === carrierId));
  const totalCOD = deliveredCOD.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck /> {t(carrierNameKey)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('pendingShipments')}</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingShipments.length}</div>
                        <p className="text-xs text-muted-foreground">{t('ordersToBeShipped')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('unpaidCodBalance')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalCOD)}</div>
                        <p className="text-xs text-muted-foreground">{t('fromDeliveredOrders', { count: deliveredCOD.length })}</p>
                    </CardContent>
                </Card>
            </div>

            <Separator />
            
             <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        {pendingOpen ? <ChevronDown /> : <ChevronRight />}
                        {t('pendingShipments')} ({pendingShipments.length})
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>{t('order')}</TableHead><TableHead>{t('customer')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {pendingShipments.length > 0 ? pendingShipments.map(o => <OrderRow key={o.id} order={o} />) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">{t('noPendingShipments')}</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CollapsibleContent>
            </Collapsible>
            
             <Collapsible open={unpaidCodOpen} onOpenChange={setUnpaidCodOpen}>
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        {unpaidCodOpen ? <ChevronDown /> : <ChevronRight />}
                        {t('unpaidCodOrders')} ({deliveredCOD.length})
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="p-2 space-y-2">
                        <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                            <span className="font-bold">{t('totalToBeRemitted')}: {formatCurrency(totalCOD)}</span>
                            <Button size="sm" disabled={totalCOD === 0}>{t('settleCodBalance')}</Button>
                        </div>
                        <Table>
                            <TableHeader><TableRow><TableHead>{t('order')}</TableHead><TableHead>{t('customer')}</TableHead><TableHead>{t('date')}</TableHead><TableHead className="text-right">{t('amount')}</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {deliveredCOD.length > 0 ? deliveredCOD.map(o => <UnpaidCODOrderRow key={o.id} order={o} />) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">{t('noUnpaidCodOrders')}</TableCell></TableRow>}
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
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CarrierDashboard carrierNameKey="shippingCompanyA" carrierId="a" orders={allOrders} />
        <CarrierDashboard carrierNameKey="shippingCompanyB" carrierId="b" orders={allOrders} />
    </div>
  );
}
