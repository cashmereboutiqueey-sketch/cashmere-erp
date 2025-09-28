
'use client';

import { ProductionOrder, Order } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '../ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { useMemo } from 'react';

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

const statusVariantMap: {
  [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
} = {
  pending: 'outline',
  in_progress: 'secondary',
  done: 'default',
};

interface ProductionOrderDetailsDialogProps {
  order: ProductionOrder | null;
  salesOrders: Order[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProductionOrderDetailsDialog({ order, salesOrders, isOpen, onOpenChange }: ProductionOrderDetailsDialogProps) {
  const { t } = useTranslation();

  const salesOrder = useMemo(() => {
    if (!order?.sales_order_id) return null;
    return salesOrders.find(so => so.id === order.sales_order_id);
  }, [order, salesOrders]);

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('production')} {t('order')} #{order.id.slice(0, 8)}...</DialogTitle>
          <DialogDescription>
            {t('detailsForProductionOrder')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <Image
                    src={findImage(order.product_id) || "https://picsum.photos/seed/placeholder/80/80"}
                    alt={order.product?.name || 'Product Image'}
                    width={80}
                    height={80}
                    className="rounded-md"
                />
                <div>
                    <h3 className="font-bold">{order.product?.name}</h3>
                    <p className="text-sm text-muted-foreground">{order.variant?.sku}</p>
                    <div className="flex gap-1 mt-1">
                        {order.variant?.color && <Badge variant="secondary">{order.variant.color}</Badge>}
                        {order.variant?.size && <Badge variant="secondary">{order.variant.size}</Badge>}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground">{t('quantity')}</p>
                    <p className="font-bold text-lg">{order.required_quantity}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">{t('status')}</p>
                    <p>
                        <Badge variant={statusVariantMap[order.status]} className="capitalize text-lg">
                            {t(order.status as any)}
                        </Badge>
                    </p>
                </div>
            </div>

            <Separator />

            <div>
                <h4 className="font-medium mb-2">{t('source')}</h4>
                {salesOrder ? (
                    <div className="p-3 rounded-md border text-sm space-y-1">
                        <p><strong>{t('salesOrder')}:</strong> #{salesOrder.id.slice(0, 8)}...</p>
                        <p><strong>{t('customer')}:</strong> {salesOrder.customer?.name}</p>
                    </div>
                ) : (
                     <div className="p-3 rounded-md border text-sm text-center text-muted-foreground">
                        <p>{t('forStock')}</p>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// A new translation key needs to be added
// detailsForProductionOrder: 'Details for the production order.',

