
'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Product, ProductVariant, Fabric, ProductFabric, TranslationKey } from '@/lib/types';
import { DataTable } from '../shared/data-table';
import { DataTableColumnHeader } from '../shared/data-table-column-header';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { buttonVariants, Button } from '../ui/button';
import { MoreHorizontal, PlusCircle, ChevronDown, ChevronRight, Settings, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct, deleteProduct } from '@/services/product-service';
import { getProductFabricsForProduct } from '@/services/product-fabric-service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { ScrollArea } from '../ui/scroll-area';
import { generateProductDescription } from '@/ai/flows/product-description-generator';
import { getFabrics } from '@/services/fabric-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';


const findImage = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

const ExpandedRowContent = ({ row }: { row: Row<Product> }) => {
    const { t } = useTranslation();
    return (
        <TableCell colSpan={99} className='p-4 bg-muted/50'>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-medium mb-2">{t('variants')}</h4>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('sku')}</TableHead>
                                    <TableHead>{t('variant')}</TableHead>
                                    <TableHead>{t('cost')}</TableHead>
                                    <TableHead>{t('price')}</TableHead>
                                    <TableHead>{t('stock')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {row.original.variants.map((variant: ProductVariant) => (
                                     <TableRow key={variant.id}>
                                        <TableCell>
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
                                            }).format(variant.cost)}
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                            }).format(variant.price)}
                                        </TableCell>
                                        <TableCell>{variant.stock_quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                 <div>
                    <h4 className="font-medium mb-2">{t('productRecipe')}</h4>
                     <div className="rounded-md border">
                         {row.original.fabrics && row.original.fabrics.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('fabric')}</TableHead>
                                        <TableHead className="text-right">{t('metersPerPc')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {row.original.fabrics.map(pf => (
                                        <TableRow key={pf.fabric_id}>
                                            <TableCell>{pf.name}</TableCell>
                                            <TableCell className="text-right">{pf.fabric_quantity_meters}m</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {t('noRecipeDefined')}
                            </div>
                         )}
                     </div>
                </div>
            </div>
        </TableCell>
    );
};

const ProductDescriptionGenerator = ({ product }: { product: Product }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [description, setDescription] = useState('');
    const [open, setOpen] = useState(false);
    
    const firstVariant = product.variants[0];

    const handleGenerate = async () => {
        if (!firstVariant) {
             toast({ variant: "destructive", title: t('noVariantsFound') });
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
            toast({ variant: "destructive", title: t('failedToGenerateDesc') });
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>{t('generateDescription')}</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('generateProductDescriptionFor', { productName: product.name })}</DialogTitle>
                     <DialogDescription>
                        {t('generateProductDescriptionDesc')}
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
                                {isGenerating ? t('generating') : t('clickToGenerate')}
                            </p>
                        </div>
                     )}
                     <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? t('generating') : t('generateWithAI')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
};


export const getColumns = (
  t: (key: TranslationKey, values?: any) => string,
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void
): ColumnDef<Product>[] => [
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
      <DataTableColumnHeader column={column} title={t('product')} />
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
      <DataTableColumnHeader column={column} title={t('category')} />
    ),
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
   {
    id: 'fabrics',
    accessorKey: 'fabrics',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('fabricsUsed')} />
    ),
    cell: ({ row }) => {
        const fabrics = row.original.fabrics;
        if (!fabrics || fabrics.length === 0) return <span className="text-muted-foreground text-xs">{t('none')}</span>;
        
        const displayFabrics = fabrics.slice(0, 2);
        const remainingCount = fabrics.length - displayFabrics.length;

        return (
            <div className="flex items-center gap-1">
                {displayFabrics.map(f => <Badge key={f.fabric_id} variant="secondary">{f.name}</Badge>)}
                {remainingCount > 0 && (
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="outline">+{remainingCount}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                {fabrics.slice(2).map(f => <p key={f.fabric_id}>{f.name}</p>)}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        );
    }
   },
  {
    id: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('price')} />
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
      <DataTableColumnHeader column={column} title={t('totalStock')} />
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
              <DropdownMenuItem onClick={() => onEdit(row.original)}>{t('edit')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive">{t('delete')}</DropdownMenuItem>
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

const productFabricSchema = z.object({
  fabric_id: z.string().min(1, "Fabric is required."),
  fabric_quantity_meters: z.preprocess((val) => Number(val), z.number().min(0.1, "Quantity must be greater than 0.")),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  fabrics: z.array(productFabricSchema).min(1, "At least one fabric is required for the recipe."),
});

type ProductFormData = z.infer<typeof productSchema>;


function ProductEditDialog({ 
    product,
    isOpen,
    onOpenChange,
    allSizes,
    allColors 
}: { 
    product: Product | null,
    isOpen: boolean,
    onOpenChange: (isOpen: boolean) => void,
    allSizes: string[],
    allColors: string[] 
}) {
  const { t } = useTranslation();
  const [availableFabrics, setAvailableFabrics] = useState<Fabric[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const { toast } = useToast();

  const isEditMode = !!product;

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { id: '', name: '', category: '', difficulty: 'medium', variants: [], fabrics: [] },
  });
  const { control, handleSubmit, setValue, watch, reset } = methods;

  const { fields: variantFields, update: updateVariant } = useFieldArray({ control, name: "variants" });
  const { fields: fabricFields, append: appendFabric, remove: removeFabric } = useFieldArray({ control, name: "fabrics" });

  const productName = watch("name");

  useEffect(() => {
    const fetchFabricsData = async () => {
        const fabrics = await getFabrics();
        setAvailableFabrics(fabrics);
    }
    fetchFabricsData();
  }, []);

  useEffect(() => {
    if (isOpen && product) {
        reset({
            id: product.id,
            name: product.name,
            category: product.category,
            difficulty: product.difficulty || 'medium',
            variants: product.variants,
        });

        const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[];
        const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))] as string[];
        setSelectedSizes(sizes);
        setSelectedColors(colors);

        const fetchProductFabrics = async () => {
            const fetchedFabrics = await getProductFabricsForProduct(product.id);
            setValue('fabrics', fetchedFabrics);
        };
        fetchProductFabrics();
    } else if (!isOpen) {
        reset({ id: '', name: '', category: '', difficulty: 'medium', variants: [], fabrics: [] });
        setSelectedSizes([]);
        setSelectedColors([]);
    }
  }, [isOpen, product, reset, setValue]);


  useEffect(() => {
    if (isEditMode || !productName || selectedSizes.length === 0 || selectedColors.length === 0) {
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
  }, [selectedSizes, selectedColors, productName, setValue, isEditMode]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditMode && data.id) {
        await updateProduct(data.id, data);
        toast({ title: t('success'), description: t('productUpdated') });
      } else {
        await addProduct(data);
        toast({ title: t('success'), description: t('productAdded') });
      }
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      const action = isEditMode ? 'update' : 'add';
      toast({ variant: "destructive", title: t('error'), description: t('failedToActionProduct', { action }) });
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        reset();
        setSelectedSizes([]);
        setSelectedColors([]);
    }
    onOpenChange(isOpen);
  }

  const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (isEditMode) return; // Don't allow changing sizes/colors in edit mode to avoid complexity
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editProduct') : t('addNewProduct')}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? t('editProductDesc', { productName: product?.name || '' })
              : t('addProductDesc')
            }
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <Form {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productName')}</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Silk Abaya" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('category')}</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Abayas" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField
                    control={control}
                    name="difficulty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('productionDifficulty')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectDifficulty')} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="easy">{t('easy')}</SelectItem>
                                    <SelectItem value="medium">{t('medium')}</SelectItem>
                                    <SelectItem value="hard">{t('hard')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

            <div className="space-y-2 pt-4">
                <h3 className="text-lg font-medium">{t('productRecipe')}</h3>
                 {fabricFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 p-2 rounded-md border">
                        <FormField control={control} name={`fabrics.${index}.fabric_id`} render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>{t('fabric')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder={t('selectFabric')} /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableFabrics.map(fabric => <SelectItem key={fabric.id} value={fabric.id}>{fabric.name} ({fabric.color})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={control} name={`fabrics.${index}.fabric_quantity_meters`} render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('metersPerPc')}</FormLabel>
                                <FormControl><Input {...field} type="number" step="0.1" placeholder="e.g., 3.5" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFabric(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                ))}
                 <Button type="button" size="sm" variant="outline" onClick={() => appendFabric({ fabric_id: '', fabric_quantity_meters: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('addFabricToRecipe')}
                </Button>
                <FormField control={control} name="fabrics" render={() => (<FormItem><FormMessage /></FormItem>)} />
            </div>

              {!isEditMode && (
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">{t('variantGeneration')}</h3>
                  <div className="space-y-2">
                      <Label>{t('sizes')}</Label>
                      <div className="flex flex-wrap gap-2">
                      {allSizes.map(size => (
                          <Button key={size} type="button" variant={selectedSizes.includes(size) ? 'secondary' : 'outline'} size="sm" onClick={() => toggleSelection(size, selectedSizes, setSelectedSizes)}>{size}</Button>
                      ))}
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label>{t('colors')}</Label>
                      <div className="flex flex-wrap gap-2">
                      {allColors.map(color => (
                          <Button key={color} type="button" variant={selectedColors.includes(color) ? 'secondary' : 'outline'} size="sm" onClick={() => toggleSelection(color, selectedColors, setSelectedColors)}>{color}</Button>
                      ))}
                      </div>
                  </div>
                </div>
              )}
              
              {variantFields.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">{t('generatedVariants')}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('variant')}</TableHead>
                          <TableHead>{t('sku')}</TableHead>
                           <TableHead>{t('cost')}</TableHead>
                          <TableHead>{t('price')}</TableHead>
                          <TableHead>{t('stock')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variantFields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                                <Badge variant="outline">{watch(`variants.${index}.size`)}</Badge>
                                <Badge variant="outline" className="ml-1">{watch(`variants.${index}.color`)}</Badge>
                            </TableCell>
                            <TableCell>
                                <FormField name={`variants.${index}.sku`} control={control} render={({ field }) => (
                                    <Input {...field} className="h-8" />
                                )}/>
                            </TableCell>
                             <TableCell>
                                <FormField name={`variants.${index}.cost`} control={control} render={({ field }) => (
                                    <Input {...field} type="number" step="0.01" className="h-8" />
                                )}/>
                            </TableCell>
                            <TableCell>
                                <FormField name={`variants.${index}.price`} control={control} render={({ field }) => (
                                    <Input {...field} type="number" step="0.01" className="h-8" />
                                )}/>
                            </TableCell>
                            <TableCell>
                                <FormField name={`variants.${index}.stock_quantity`} control={control} render={({ field }) => (
                                    <Input {...field} type="number" className="h-8" />
                                )}/>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              )}
               <FormField control={control} name="variants" render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )} />
              </ScrollArea>
              <DialogFooter>
                <Button type="submit">{isEditMode ? t('saveChanges') : t('addProduct')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductDialog({ product, isOpen, onOpenChange }: { product: Product | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!product) return;
        setIsDeleting(true);
        try {
            await deleteProduct(product.id);
            toast({ title: t('success'), description: t('productDeleted') });
            onOpenChange(false);
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: t('error'), description: t('failedToDeleteProduct') });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmDeleteProduct')}</AlertDialogTitle>
                    <AlertDialogDescription>
                       {t('confirmDeleteProductDesc', { productName: product?.name || '' })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                        {isDeleting ? t('deleting') : t('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function ManageAttributesDialog({ allSizes, setAllSizes, allColors, setAllColors }: { allSizes: string[], setAllSizes: (sizes: string[]) => void, allColors: string[], setAllColors: (colors: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const { t } = useTranslation();

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
          {t('manageAttributes')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('manageAttributes')}</DialogTitle>
          <DialogDescription>
            {t('manageAttributesDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-size" className="text-right">
              {t('newSize')}
            </Label>
            <Input id="new-size" value={newSize} onChange={(e) => setNewSize(e.target.value)} className="col-span-2" placeholder="e.g., XXXL" />
            <Button onClick={handleAddSize} className="col-span-1">{t('add')}</Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-color" className="text-right">
              {t('newColor')}
            </Label>
            <Input id="new-color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="col-span-2" placeholder="e.g., Green" />
             <Button onClick={handleAddColor} className="col-span-1">{t('add')}</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>{t('done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ProductsTableToolbar({ 
  onAdd, 
  allSizes, setAllSizes, allColors, setAllColors 
}: { 
  onAdd: () => void,
  allSizes: string[], setAllSizes: (sizes: string[]) => void, 
  allColors: string[], setAllColors: (colors: string[]) => void 
}) {
  const { t } = useTranslation();
  return (
    <>
      <Input
        placeholder={t('filterProducts')}
        className="h-8 w-[150px] lg:w-[250px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="h-8" onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addProduct')}
        </Button>
        <ManageAttributesDialog allSizes={allSizes} setAllSizes={setAllSizes} allColors={allColors} setAllColors={setAllColors} />
      </div>
    </>
  );
}

export function ProductsTable({ data }: ProductsTableProps) {
  const { t } = useTranslation();
  const [allSizes, setAllSizes] = useState(INITIAL_SIZES);
  const [allColors, setAllColors] = useState(INITIAL_COLORS);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
  };
  
  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsEditOpen(true);
  };

  const columns = getColumns(t, handleEdit, handleDelete);
  
  const renderSubComponent = React.useCallback(({ row }: { row: Row<Product> }) => {
    return (
        <ExpandedRowContent row={row} />
    );
  }, [t]);


  return (
    <>
    <DataTable 
      columns={columns} 
      data={data} 
      toolbar={<ProductsTableToolbar onAdd={handleAdd} allSizes={allSizes} setAllSizes={setAllSizes} allColors={allColors} setAllColors={setAllColors} />}
      getRowCanExpand={(row) => row.original.variants && row.original.variants.length > 0}
      renderSubComponent={renderSubComponent}
    />
    <ProductEditDialog 
        product={selectedProduct}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        allSizes={allSizes}
        allColors={allColors}
    />
    <DeleteProductDialog
        product={selectedProduct}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
    />
    </>
  );
}

    