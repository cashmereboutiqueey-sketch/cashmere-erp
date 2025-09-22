'use client';

import { useState, useEffect } from 'react';
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
import { Product, Customer, ProductVariant, Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PlusCircle, ShoppingCart, Trash2, Search, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { getProducts } from '@/services/product-service';
import { getCustomers } from '@/services/customer-service';
import { addOrder } from '@/services/order-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

type CartItem = {
  product: Product;
  variant: ProductVariant;
  quantity: number;
};

const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

export default function PosPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [source, setSource] = useState('store');
  const [sku, setSku] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [fetchedProducts, fetchedCustomers] = await Promise.all([
        getProducts(),
        getCustomers(),
      ]);
      setProducts(fetchedProducts);
      setCustomers(fetchedCustomers);
      setIsLoading(false);
    };
    fetchData();
  }, []);


  const handleSkuSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sku) return;

    let foundProduct: Product | undefined;
    let foundVariant: ProductVariant | undefined;

    for (const p of products) {
      const v = p.variants.find(va => va.sku.toLowerCase() === sku.toLowerCase());
      if (v) {
        foundProduct = p;
        foundVariant = v;
        break;
      }
    }

    if (foundProduct && foundVariant) {
      addToCart(foundProduct, foundVariant);
      setSku('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Product not found',
        description: `No product with SKU: ${sku}`,
      });
    }
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.variant.id === variant.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, variant, quantity: 1 }];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.variant.id !== variantId)
    );
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variant.id === variantId ? { ...item, quantity } : item
      )
    );
  };
  
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Cart is empty' });
      return;
    }
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'Please select a customer' });
      return;
    }

    try {
      const newOrder: Omit<Order, 'id' | 'created_at' | 'customer'> & { items: Omit<CartItem, 'product'>[] } = {
        customer_id: selectedCustomer.id,
        status: 'pending',
        source: source as Order['source'],
        payment_status: 'unpaid',
        total_amount: total,
        items: cart.map(({variant, quantity}) => ({
          variant,
          quantity
        }))
      };

      const orderId = await addOrder(newOrder);
      
      toast({
        title: 'Order Placed!',
        description: `Order ${orderId} has been successfully created.`,
      });

      // Reset state
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');

      // Redirect to orders page
      router.push('/orders');

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error placing order',
        description: 'There was a problem creating the order. Please try again.',
      });
    }
  };


  const total = cart.reduce(
    (acc, item) => acc + item.variant.price * item.quantity,
    0
  );

  const filteredCustomers = customerSearch ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase())) : [];

  const getProductPriceRange = (product: Product) => {
    const prices = product.variants.map(v => v.price);
    if (prices.length === 0) return '$0.00';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const format = (amount: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    return min === max ? format(min) : `${format(min)} - ${format(max)}`;
  };
  
  const handleOpenVariantDialog = (product: Product) => {
    if (product.variants.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Product has no variants',
        description: `Please add variants to ${product.name} before selling.`,
      });
      return;
    }
    setSelectedProductForVariant(product);
    setSelectedSize(product.variants[0]?.size || null);
    setSelectedColor(product.variants[0]?.color || null);
    setIsVariantDialogOpen(true);
  };
  
  const handleAddToCartFromDialog = () => {
    if (!selectedProductForVariant || !selectedSize || !selectedColor) {
      toast({ variant: 'destructive', title: 'Please select size and color' });
      return;
    }

    const selectedVariant = selectedProductForVariant.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );

    if (selectedVariant) {
      addToCart(selectedProductForVariant, selectedVariant);
      setIsVariantDialogOpen(false);
      setSelectedProductForVariant(null);
      setSelectedSize(null);
      setSelectedColor(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Variant not found',
        description: 'The selected size and color combination is not available.',
      });
    }
  };
  
  const availableSizes = selectedProductForVariant ? [...new Set(selectedProductForVariant.variants.map(v => v.size).filter(Boolean))] as string[] : [];
  const availableColors = selectedProductForVariant ? [...new Set(selectedProductForVariant.variants.map(v => v.color).filter(Boolean))] as string[] : [];

  return (
    <>
    <div className="grid md:grid-cols-3 gap-4 p-4 lg:p-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
             <form onSubmit={handleSkuSubmit}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Scan product barcode..."
                  className="w-full bg-background pl-8"
                  disabled={isLoading}
                />
              </div>
            </form>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="w-full h-48" />
                      <div className="p-2 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
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
                        <p className="text-xs text-muted-foreground">{getProductPriceRange(product)}</p>
                        <Button size="sm" className="w-full mt-2" onClick={() => handleOpenVariantDialog(product)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
            {selectedCustomer ? (
                 <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                    <div>
                        <p className="font-medium text-sm">{selectedCustomer.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search for a customer..."
                        className="w-full bg-background pl-8"
                        disabled={isLoading}
                        />
                    </div>
                    {customerSearch && filteredCustomers.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
                            <CardContent className="p-2">
                                {filteredCustomers.map(c => (
                                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }} className="p-2 hover:bg-muted rounded-md cursor-pointer">
                                        <p className="font-medium text-sm">{c.name}</p>
                                        <p className="text-xs text-muted-foreground">{c.email}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                    <AddCustomerDialog />
                </div>
            )}
            
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
                  <div key={item.variant.id} className="flex items-center gap-4 py-2">
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
                        {item.variant.size && `${item.variant.size}, `}{item.variant.color && `${item.variant.color}, `}{item.variant.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.variant.id, parseInt(e.target.value))
                        }
                        className="h-8 w-16"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.variant.id)}
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
            <Button className="w-full" onClick={handlePlaceOrder} disabled={cart.length === 0 || !selectedCustomer}>Place Order</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
    <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Variant for {selectedProductForVariant?.name}</DialogTitle>
          <DialogDescription>Choose a size and color to add to your order.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {availableSizes.length > 0 && (
            <div>
              <Label>Size</Label>
              <div className="flex flex-wrap gap-2 pt-2">
                {availableSizes.map(size => (
                  <Button 
                    key={size}
                    variant={selectedSize === size ? 'secondary' : 'outline'}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {availableColors.length > 0 && (
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 pt-2">
                {availableColors.map(color => (
                  <Button 
                    key={color}
                    variant={selectedColor === color ? 'secondary' : 'outline'}
                    onClick={() => setSelectedColor(color)}
                    >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAddToCartFromDialog}>Add to Cart</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
