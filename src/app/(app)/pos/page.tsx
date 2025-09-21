'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProducts, mockFabrics, mockProductFabrics } from '@/lib/data';
import { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PlusCircle, ShoppingCart, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type CartItem = {
  product: Product;
  quantity: number;
};

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

export default function PosPage() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [source, setSource] = useState('store');

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const checkAvailability = () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cart is empty',
        description: 'Please add products to the cart first.',
      });
      return;
    }
    
    let alertMessages: string[] = [];

    cart.forEach(item => {
        const product = item.product;
        const quantity = item.quantity;
        if (product.stock_quantity >= quantity) {
            // Sufficient stock
        } else {
            const fabricsNeeded = mockProductFabrics.filter(pf => pf.product_id === product.id);
            if (fabricsNeeded.length > 0) {
                let canManufacture = true;
                fabricsNeeded.forEach(pf => {
                    const fabric = mockFabrics.find(f => f.id === pf.fabric_id);
                    if (!fabric || fabric.length_in_meters < pf.fabric_quantity_meters * quantity) {
                        canManufacture = false;
                        const required = pf.fabric_quantity_meters * quantity;
                        const available = fabric?.length_in_meters || 0;
                        alertMessages.push(`${product.name}: Needs ${required}m of ${fabric?.name}, but only ${available}m available.`);
                    }
                });
                if (!canManufacture) {
                    toast({
                        variant: 'destructive',
                        title: 'Insufficient Fabric',
                        description: `Not enough fabric to produce ${product.name}. Check alerts for details.`,
                    });
                } else {
                     toast({
                        title: 'Production Required',
                        description: `Sufficient fabric available to produce ${product.name}.`,
                    });
                }
            } else {
                alertMessages.push(`${product.name} is out of stock and fabric information is unavailable.`);
                toast({
                    variant: 'destructive',
                    title: 'Out of Stock',
                    description: `${product.name} is totally sold out.`,
                });
            }
        }
    });

    if (alertMessages.length > 0) {
        // Display all alerts
    } else {
         toast({
            title: 'Inventory Check Complete',
            description: 'All items are available or can be produced.',
        });
    }
  };

  const total = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <div className="grid md:grid-cols-3 gap-4 p-4 lg:p-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <Image
                      src={findImage(product.id) || "https://picsum.photos/seed/placeholder/200/200"}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-auto object-cover"
                    />
                    <div className="p-2">
                      <h3 className="text-sm font-medium truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                      <Button size="sm" className="w-full mt-2" onClick={() => addToCart(product)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart /> Current Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid gap-2">
              <Label htmlFor="source">Order Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">In-Store</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <ScrollArea className="h-[350px]">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 py-2">
                    <Image
                      src={findImage(item.product.id) || "https://picsum.photos/seed/placeholder/40/40"}
                      alt={item.product.name}
                      width={40}
                      height={40}
                      className="rounded-md"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product.id, parseInt(e.target.value))
                        }
                        className="h-8 w-16"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  Your cart is empty.
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
             <div className="w-full flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={checkAvailability}>Check Availability & Place Order</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
