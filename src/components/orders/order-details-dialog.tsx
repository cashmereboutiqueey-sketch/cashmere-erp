'use client';

import { useState } from 'react';
import { Order } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { addPaymentToOrder } from '@/services/order-service';
import { capitalize } from 'string-ts';

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

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

interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function OrderDetailsDialog({ order, isOpen, onOpenChange }: OrderDetailsDialogProps) {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const remainingBalance = order.total_amount - (order.amount_paid || 0);

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Payment amount must be positive.' });
      return;
    }
    if (paymentAmount > remainingBalance) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Payment cannot exceed the remaining balance.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
        await addPaymentToOrder(order.id, paymentAmount);
        toast({ title: 'Success', description: 'Payment added successfully.' });
        onOpenChange(false);
        window.location.reload(); // Reload to see changes. A more advanced solution would use state management.
    } catch(e) {
        const error = e as Error;
        toast({ variant: 'destructive', title: 'Payment Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order ID: {order.id}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold">Customer Details</h3>
                    <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {order.customer?.name}</p>
                        <p><strong>Email:</strong> {order.customer?.email}</p>
                        <p><strong>Phone:</strong> {order.customer?.phone || 'N/A'}</p>
                    </div>
                    <Separator />
                     <h3 className="font-semibold">Order Information</h3>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span>Status:</span> <Badge variant={statusVariantMap[order.status]} className="capitalize">{order.status}</Badge></div>
                        <div className="flex justify-between"><span>Payment:</span> <Badge variant={paymentStatusVariantMap[order.payment_status]} className="capitalize">{order.payment_status.replace('_', ' ')}</Badge></div>
                        <div className="flex justify-between"><span>Date:</span> <span>{new Date(order.created_at).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Source:</span> <span className='capitalize'>{order.source}</span></div>
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold">Items</h3>
                    <div className="space-y-3">
                    {order.items?.map(item => (
                        <div key={item.variant.id} className="flex items-center gap-4">
                            <Image src={findImage(item.productId)} alt={item.productName} width={64} height={64} className="rounded-md object-cover"/>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">{item.variant.size} - {item.variant.color}</p>
                                <p className="text-xs">{item.quantity} x {formatCurrency(item.variant.price)}</p>
                            </div>
                            <div className="font-medium text-sm">
                                {formatCurrency(item.quantity * item.variant.price)}
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold">Financials</h3>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(order.total_amount)}</span></div>
                        <div className="flex justify-between"><span>Taxes:</span> <span>{formatCurrency(0)}</span></div>
                        <div className="flex justify-between font-bold"><span>Total:</span> <span>{formatCurrency(order.total_amount)}</span></div>
                        <Separator />
                         <div className="flex justify-between"><span>Amount Paid:</span> <span>{formatCurrency(order.amount_paid || 0)}</span></div>
                         <div className="flex justify-between font-bold text-base text-destructive"><span>Balance Due:</span> <span>{formatCurrency(remainingBalance)}</span></div>
                    </div>
                </div>
                {remainingBalance > 0 && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold">Add Payment</h3>
                        <div className="space-y-2">
                            <Label htmlFor="payment-amount">Payment Amount</Label>
                            <Input 
                                id="payment-amount" 
                                type="number" 
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                placeholder={formatCurrency(remainingBalance)}
                            />
                        </div>
                        <Button onClick={handleAddPayment} disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(paymentAmount)}`}
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
