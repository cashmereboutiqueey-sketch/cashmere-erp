'use client';

import { useEffect, useRef, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
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
import { Textarea } from '../ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';

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


export const columns: ColumnDef<Product>[] = [
    {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => row.toggleSelected(!row.getIsSelected())}>
              {row.getIsSelected() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="sr-only">Toggle variants</span>
            </Button>
          </CollapsibleTrigger>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="ml-2"
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
      const product = row.original;
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
              <DropdownMenuItem>Generate Description</DropdownMenuItem>
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

function AddProductDialog({ allSizes, allColors }: { allSizes: string[], allColors: string[] }) {
  const [open, setOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const skuInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        skuInputRef.current?.focus();
      }, 100);
    } else {
        setSelectedSizes([]);
        setSelectedColors([]);
    }
  }, [open]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter product details and select the sizes and colors to generate variants.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sku" className="text-right">
              SKU / Code
            </Label>
            <Input id="sku" ref={skuInputRef} className="col-span-3" placeholder="Scan or enter SKU" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" className="col-span-3" placeholder="e.g., Silk Abaya" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Input id="category" className="col-span-3" placeholder="e.g., Abayas" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Sizes
            </Label>
            <div className="col-span-3 flex flex-wrap gap-2">
              {allSizes.map(size => (
                <Button 
                  key={size} 
                  variant={selectedSizes.includes(size) ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => toggleSize(size)}
                  className="h-8"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Colors
            </Label>
            <div className="col-span-3 flex flex-wrap gap-2">
              {allColors.map(color => (
                 <Button 
                  key={color} 
                  variant={selectedColors.includes(color) ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => toggleColor(color)}
                   className="h-8"
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input id="price" type="number" className="col-span-3" placeholder="e.g., 150.00" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Initial Stock
            </Label>
            <Input id="stock" type="number" className="col-span-3" placeholder="e.g., 50" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min-stock" className="text-right">
             Min. Stock
            </Label>
            <Input id="min-stock" type="number" className="col-span-3" placeholder="e.g., 10" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Add Product</Button>
        </DialogFooter>
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
  
  const renderSubComponent = React.useCallback(({ row }: { row: any }) => {
    return (
        <td colSpan={columns.length} className='p-0'>
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
        </td>
    );
  }, []);


  return (
    <DataTable 
      columns={columns} 
      data={data} 
      toolbar={<ProductsTableToolbar allSizes={allSizes} setAllSizes={setAllSizes} allColors={allColors} setAllColors={setAllColors} />}
      renderSubComponent={renderSubComponent}
    />
  );
}
