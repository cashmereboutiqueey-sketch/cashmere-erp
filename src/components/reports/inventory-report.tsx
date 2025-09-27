'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { getProducts } from '@/services/product-service';
import { getFabrics } from '@/services/fabric-service';
import { Product, Fabric } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';

export function InventoryReport() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedProducts, fetchedFabrics] = await Promise.all([
        getProducts(),
        getFabrics(),
      ]);
      setProducts(fetchedProducts);
      setFabrics(fetchedFabrics);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const productStock = products.map(p => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
    const minStock = p.variants.reduce((sum, v) => sum + v.min_stock_level, 0);
    return {
      id: p.id,
      name: p.name,
      stock_quantity: totalStock,
      min_stock_level: minStock,
    };
  });

  if (isLoading) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div>
                <h3 className="text-lg font-medium mb-2">{t('productStockLevels')}</h3>
                <div className="rounded-md border p-4 space-y-2">
                    {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-medium mb-2">{t('fabricStockLevels')}</h3>
                <div className="rounded-md border p-4 space-y-2">
                    {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-medium mb-2">{t('productStockLevels')}</h3>
        <div className="rounded-md border">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products')}</TableHead>
                  <TableHead className="text-right">{t('stock')}</TableHead>
                  <TableHead className="text-right">{t('minStock')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productStock.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">
                       <Badge
                        variant={
                          product.stock_quantity < product.min_stock_level && product.min_stock_level > 0
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {product.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.min_stock_level}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">{t('fabricStockLevels')}</h3>
        <div className="rounded-md border">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fabrics')}</TableHead>
                  <TableHead className="text-right">{t('stockMeters')}</TableHead>
                  <TableHead className="text-right">{t('minStockMeters')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fabrics.map((fabric) => (
                  <TableRow key={fabric.id}>
                    <TableCell className="font-medium">{fabric.name}</TableCell>
                    <TableCell className="text-right">
                       <Badge
                        variant={
                          fabric.length_in_meters < fabric.min_stock_level && fabric.min_stock_level > 0
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {fabric.length_in_meters}m
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                      {fabric.min_stock_level}m
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
