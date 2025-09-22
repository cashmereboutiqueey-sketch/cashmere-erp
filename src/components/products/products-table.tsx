'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Product, ProductVariant } from '@/lib/types';
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
import { MoreHorizontal, PlusCircle, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addProduct } from '@/services/product-service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { ScrollArea } from '../ui/scroll-area';
import { generateProductDescription } from '@/ai/flows/product-description-generator';


const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

const VariantRow = ({ variant }: { variant: ProductVariant }) => {
  return (
    <TableRow>
      <TableCell className="pl-12">
        <Badge variant="outline">{variant.sku}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {variant.color && <Badge variant="secondary">{variant.color}</Badge>}
          {variant.size && <Badge variant="secondary">{variant.size}</Badge>}
        </div>
      </TableCell>
      <TableCell>
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(variant.price)}
      </TableCell>
      <TableCell>{variant.stock_quantity}</TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
};

const ProductDescriptionGenerator = ({ product }: { product: Product }) => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [description, setDescription] = useState('');
    const [open, setOpen] = useState(false);
    
    // For this demo, we'll just use the first variant's details for generation
    const firstVariant = product.variants[0];

    const handleGenerate = async () => {
        if (!firstVariant) {
             toast({ variant: "destructive", title: "No variants found for this product." });
             return;
        }

        setIsGenerating(true);
        setDescription('');
        try {
            const result = await generateProductDescription({
                name: product.name,
                category: product.category,
                fabricCode: "F001" // Note: This is hardcoded as product-fabric relation is not yet defined
            });
            setDescription(result.description);
        } catch (e) {
            toast({ variant: "destructive", title: "Failed to generate description." });
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Generate Description</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Product Description for {product.name}</DialogTitle>
                     <DialogDescription>
                        Use AI to generate a compelling product description.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     {description ? (
                         <div className="prose prose-sm text-sm text-muted-foreground border rounded-md p-4 bg-muted/50">
                             <p>{description}</p>
                         </div>
                     ) : (
                        <div className="flex items-center justify-center h-24 border rounded-md bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                                {isGenerating ? "Generating..." : "Click the button to generate a description."}
                            </p>
                        </div>
                     )}
                     <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? "Generating..." : "Generate with AI"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
};


export const getColumns = (): ColumnDef<Product>[] => [
    {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      const canExpand = row.original.variants && row.original.variants.length > 0;
      return (
        <div className="flex items-center">
            {canExpand && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => row.toggleExpanded(!row.getIsExpanded())}>
                    {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="sr-only">Toggle variants</span>
                </Button>
            )}
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className={cn(!canExpand && "ml-8")}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      const imageUrl =
        findImage(product.id) || 'https://picsum.photos/seed/placeholder/40/40';
      return (
        <div className="flex items-center gap-2">
          <Image
            src={imageUrl}
            alt={product.name}
            width={40}
            height={40}
            className="rounded-md"
          />
          <span className="font-medium">{product.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
  {
    id: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      const prices = row.original.variants.map(v => v.price);
      if(prices.length === 0) return 'N/A';
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const format = (amount: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

      return <div className="font-medium">{min === max ? format(min) : `${format(min)} - ${format(max)}`}</div>;
    },
  },
  {
    id: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Stock" />
    ),
     cell: ({ row }) => {
      const totalStock = row.original.variants.reduce((acc, v) => acc + v.stock_quantity, 0);
      return <span>{totalStock}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
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
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
              <ProductDescriptionGenerator product={row.original} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

interface ProductsTableProps {
  data: Product[];
}

const INITIAL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const INITIAL_COLORS = ["Black", "White", "Gray", "Navy", "Beige", "Gold", "Rose Gold", "Blue"];

const variantSchema = z.object({
    id: z.string().optional(),
    sku: z.string().min(1, "SKU is required"),
    price: z.preprocess((val) => Number(val), z.number().min(0)),
    cost: z.preprocess((val) => Number(val), z.number().min(0)),
    stock_quantity: z.preprocess((val) => Number(val), z.number().min(0)),
    showroom_quantity: z.preprocess((val) => Number(val), z.number().min(0)),
    min_stock_level: z.preprocess((val) => Number(val), z.number().min(0)),
    size: z.string().optional(),
    color: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

type ProductFormData = z.infer<typeof productSchema>;


function AddProductDialog({ allSizes, allColors }: { allSizes: string[], allColors: string[] }) {
  const [open, setOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const { toast } = useToast();

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', category: '', variants: [] },
  });
  const { control, handleSubmit, setValue, watch, reset } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const productName = watch("name");

  useEffect(() => {
    if (!productName || selectedSizes.length === 0 || selectedColors.length === 0) {
      setValue("variants", []);
      return;
    }

    const newVariants = selectedSizes.flatMap(size => 
      selectedColors.map(color => {
        const namePart = productName.slice(0, 3).toUpperCase();
        const sizePart = size.slice(0, 2).toUpperCase();
        const colorPart = color.slice(0, 3).toUpperCase();
        const sku = `SKU-${namePart}-${sizePart}-${colorPart}`;
        return {
          sku,
          price: 0,
          cost: 0,
          stock_quantity: 0,
          showroom_quantity: 0,
          min_stock_level: 0,
          size,
          color
        };
      })
    );
    setValue("variants", newVariants);
  }, [selectedSizes, selectedColors, productName, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      await addProduct(data);
      toast({ title: "Success", description: "Product added successfully." });
      setOpen(false);
      reset();
      setSelectedSizes([]);
      setSelectedColors([]);
      window.location.reload();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add product." });
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        reset();
        setSelectedSizes([]);
        setSelectedColors([]);
    }
    setOpen(isOpen);
  }

  const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter product details and select attributes to generate variants.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <Form {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Silk Abaya" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Abayas" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="space-y-2">
                <Label>Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map(size => (
                    <Button key={size} type="button" variant={selectedSizes.includes(size) ? 'secondary' : 'outline'} size="sm" onClick={() => toggleSelection(size, selectedSizes, setSelectedSizes)}>{size}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {allColors.map(color => (
                    <Button key={color} type="button" variant={selectedColors.includes(color) ? 'secondary' : 'outline'} size="sm" onClick={() => toggleSelection(color, selectedColors, setSelectedColors)}>{color}</Button>
                  ))}
                </div>
              </div>
              
              {fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Generated Variants</h3>
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                                <Badge variant="outline">{watch(`variants.${index}.size`)}</Badge>
                                <Badge variant="outline" className="ml-1">{watch(`variants.${index}.color`)}</Badge>
                                <Input {...control.register(`variants.${index}.sku`)} className="mt-1 h-8" />
                            </TableCell>
                            <TableCell>
                                <Input type="number" {...control.register(`variants.${index}.price`)} className="h-8" />
                            </TableCell>
                            <TableCell>
                                <Input type="number" {...control.register(`variants.${index}.stock_quantity`)} className="h-8" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
               <FormField control={control} name="variants" render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )} />

              <DialogFooter>
                <Button type="submit">Add Product & Variants</Button>
              </DialogFooter>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function ManageAttributesDialog({ allSizes, setAllSizes, allColors, setAllColors }: { allSizes: string[], setAllSizes: (sizes: string[]) => void, allColors: string[], setAllColors: (colors: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const handleAddSize = () => {
    if (newSize && !allSizes.includes(newSize)) {
      setAllSizes([...allSizes, newSize]);
      setNewSize('');
    }
  };

  const handleAddColor = () => {
    if (newColor && !allColors.includes(newColor)) {
      setAllColors([...allColors, newColor]);
      setNewColor('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
          <Settings className="mr-2 h-4 w-4" />
          Manage Attributes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Attributes</DialogTitle>
          <DialogDescription>
            Add new sizes and colors to be available when creating products.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-size" className="text-right">
              New Size
            </Label>
            <Input id="new-size" value={newSize} onChange={(e) => setNewSize(e.target.value)} className="col-span-2" placeholder="e.g., XXXL" />
            <Button onClick={handleAddSize} className="col-span-1">Add</Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-color" className="text-right">
              New Color
            </Label>
            <Input id="new-color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="col-span-2" placeholder="e.g., Green" />
             <Button onClick={handleAddColor} className="col-span-1">Add</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ProductsTableToolbar({ allSizes, setAllSizes, allColors, setAllColors }: { allSizes: string[], setAllSizes: (sizes: string[]) => void, allColors: string[], setAllColors: (colors: string[]) => void }) {
  return (
    <>
      <Input
        placeholder="Filter products..."
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <AddProductDialog allSizes={allSizes} allColors={allColors} />
        <ManageAttributesDialog allSizes={allSizes} setAllSizes={setAllSizes} allColors={allColors} setAllColors={setAllColors} />
      </div>
    </>
  );
}

export function ProductsTable({ data }: ProductsTableProps) {
  const [allSizes, setAllSizes] = useState(INITIAL_SIZES);
  const [allColors, setAllColors] = useState(INITIAL_COLORS);
  const columns = getColumns();
  
  const renderSubComponent = React.useCallback(({ row }: { row: Product }) => {
    return (
        <TableCell colSpan={columns.length} className='p-0 bg-muted/50'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-12">SKU</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {row.original.variants.map((variant: ProductVariant) => (
                <VariantRow key={variant.id} variant={variant} />
              ))}
            </TableBody>
          </Table>
        </TableCell>
    );
  }, []);


  return (
    <DataTable 
      columns={columns} 
      data={data} 
      toolbar={<ProductsTableToolbar allSizes={allSizes} setAllSizes={setAllSizes} allColors={allColors} setAllColors={setAllColors} />}
      getRowCanExpand={(row) => row.original.variants && row.original.variants.length > 0}
      renderSubComponent={renderSubComponent}
    />
  );
}
