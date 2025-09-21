
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockProducts, mockFabrics } from '@/lib/data';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

export function InventoryReport() {
  const lowStockProducts = mockProducts.filter(
    (p) => p.stock_quantity < p.min_stock_level
  );
  const lowStockFabrics = mockFabrics.filter(
    (f) => f.length_in_meters < f.min_stock_level
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-medium mb-2">Product Stock Levels</h3>
        <div className="rounded-md border">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Min. Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">
                       <Badge
                        variant={
                          product.stock_quantity < product.min_stock_level
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
        <h3 className="text-lg font-medium mb-2">Fabric Stock Levels</h3>
        <div className="rounded-md border">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fabric</TableHead>
                  <TableHead className="text-right">Stock (m)</TableHead>
                  <TableHead className="text-right">Min. Stock (m)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFabrics.map((fabric) => (
                  <TableRow key={fabric.id}>
                    <TableCell className="font-medium">{fabric.name}</TableCell>
                    <TableCell className="text-right">
                       <Badge
                        variant={
                          fabric.length_in_meters < fabric.min_stock_level
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
