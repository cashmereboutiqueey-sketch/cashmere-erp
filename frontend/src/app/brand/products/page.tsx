"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Dialog from '@/components/Dialog';
import DataGrid from '@/components/DataGrid';
import { useLanguage } from '@/contexts/LanguageContext';
import { Printer, LayoutGrid, List, Plus, Search, Image as ImageIcon, Upload, X, Save, Edit, Filter, ShoppingBag } from 'lucide-react';
import ProductLabel from '@/components/ProductLabel';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    description: string;
    image?: string;
    image_url?: string;
    size?: string;
    color?: string;
    standard_cost?: number;
    retail_price?: number;
    brand_overhead?: number;
    brand_profit_margin?: number;
    total_produced?: number;
    total_sold?: number;
    stock_remaining?: number;
    style?: string; // e.g. "Summer 2024"
    category?: number; // ID
    category_name?: string;
}

interface Category {
    id: number;
    name: string;
}

import { useAuth } from '@/contexts/AuthContext';

// ... (existing imports)

export default function ProductCatalogPage() {
    const { t, dir } = useLanguage();
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<{ name: string, variants: Product[] } | null>(null);

    const fetchProducts = useCallback(() => {
        if (!token) return;

        setLoading(true);
        // Products
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProducts(data);
                } else {
                    console.error("Products API returned non-array:", data);
                    setProducts([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch products", err);
                setProducts([]);
                setLoading(false);
            });

        // Categories
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/categories/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCategories(data);
                } else {
                    console.error("Categories API returned non-array:", data);
                    setCategories([]);
                }
            })
            .catch(err => console.error("Failed to fetch categories", err));
    }, [token]);

    useEffect(() => {
        if (!token) return;
        fetchProducts();
    }, [fetchProducts, token]);

    // Label Printing
    const [labelProduct, setLabelProduct] = useState<Product | null>(null);
    const handlePrintLabel = (product: Product) => {
        setLabelProduct(product);
        // 500ms lets React commit the new labelProduct and the browser paint the SVG
        setTimeout(() => {
            window.print();
        }, 500);
    };

    // Edit / Create Logic
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEdit = (product: Product) => {
        setEditingProduct({ ...product });
        setImagePreview(product.image || product.image_url || null);
        setImageFile(null);
        setIsEditOpen(true);
    };

    const handleCreate = () => {
        setEditingProduct({
            name: '',
            sku: '',
            description: '',
            retail_price: 0,
            standard_cost: 0,
            brand_overhead: 0,
            brand_profit_margin: 0
        });
        setImagePreview(null);
        setImageFile(null);
        setIsEditOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file (JPG, PNG, WEBP, etc.)');
                e.target.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image too large. Maximum size is 5MB.');
                e.target.value = '';
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Pricing Calculation
    const calculateRetail = () => {
        if (!editingProduct) return 0;
        const cost = Number(editingProduct.standard_cost) || 0;
        const overhead = Number(editingProduct.brand_overhead) || 0;
        const margin = Number(editingProduct.brand_profit_margin) || 0;
        const basis = cost + overhead;
        return (basis * (1 + margin / 100)).toFixed(2);
    };

    useEffect(() => {
        if (editingProduct) {
            const retail = Number(calculateRetail());
            if (retail !== Number(editingProduct.retail_price ?? 0)) {
                setEditingProduct(prev => prev ? { ...prev, retail_price: retail } : null);
            }
        }
    }, [editingProduct?.standard_cost, editingProduct?.brand_overhead, editingProduct?.brand_profit_margin]);

    const handleSave = async () => {
        if (!editingProduct || !token) return;

        const formData = new FormData();
        // ... (append logic)
        formData.append('name', editingProduct.name || '');
        formData.append('sku', editingProduct.sku || '');
        formData.append('description', editingProduct.description || '');
        formData.append('retail_price', editingProduct.retail_price?.toString() || '0');
        formData.append('brand_overhead', editingProduct.brand_overhead?.toString() || '0');
        formData.append('brand_profit_margin', editingProduct.brand_profit_margin?.toString() || '0');

        if (editingProduct.style) formData.append('style', editingProduct.style);
        if (editingProduct.color) formData.append('color', editingProduct.color);
        if (editingProduct.size) formData.append('size', editingProduct.size);
        if (editingProduct.category) formData.append('category', editingProduct.category.toString());

        if (imageFile) {
            formData.append('image', imageFile);
        }

        const isNew = !editingProduct.id;
        const url = isNew
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/`
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/${editingProduct.id}/`;

        const method = isNew ? 'POST' : 'PATCH';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                    // No Content-Type for FormData
                },
                body: formData,
            });

            if (res.ok) {
                alert(t('common.saved') || 'Saved successfully!');
                setIsEditOpen(false);
                fetchProducts();
            } else {
                const err = await res.json();
                alert(`Error: ${JSON.stringify(err)}`);
            }
        } catch (error) {
            console.error(error);
            alert("Save failed");
        }
    };

    const handlePushToShopify = async (product: Product) => {
        if (!confirm(`Push "${product.name}" to Shopify?`)) return;
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/shopify/push_product/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: product.id })
            });
            // ...
            const data = await res.json();
            if (res.ok) {
                alert('Success: Pushed to Shopify');
            } else {
                alert('Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Network Error');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    // Grid Card Component
    const ProductCard = ({ product }: { product: Product }) => (
        <div
            onClick={() => handleEdit(product)}
            className="group bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
        >
            {/* Image Area */}
            <div className="aspect-[4/5] bg-stone-100 relative overflow-hidden">
                {product.image || product.image_url ? (
                    <img
                        src={product.image || product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ImageIcon size={48} strokeWidth={1} />
                    </div>
                )}

                {/* Overlay Badge */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {product.total_sold && product.total_sold > 0 ? (
                        <div className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {product.total_sold} {t('brandProducts.sold') || 'SOLD'}
                        </div>
                    ) : null}
                </div>

                {/* Push to Shopify (Hover) */}
                <button
                    onClick={(e) => { e.stopPropagation(); handlePushToShopify(product); }}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-[#95BF47] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="Push to Shopify"
                >
                    <ShoppingBag size={14} />
                </button>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className="font-bold text-stone-800 line-clamp-1 group-hover:text-cashmere-gold transition-colors">{product.name}</h3>
                        {product.category_name && <p className="text-[10px] text-stone-400 font-bold uppercase">{product.category_name}</p>}
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-1 py-0.5 rounded">{product.sku}</span>
                </div>

                <p className="text-xs text-stone-500 line-clamp-2 mb-3 flex-1">{product.description || 'No description'}</p>

                <div className="flex justify-between items-end border-t border-stone-100 pt-3">
                    <div>
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Retail Price</span>
                        <div className="font-serif font-bold text-lg text-cashmere-maroon">
                            {Number(product.retail_price).toLocaleString()} <span className="text-xs font-sans text-stone-500">LE</span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrintLabel(product); }}
                        className="text-stone-300 hover:text-stone-800 p-1.5 hover:bg-stone-100 rounded-full transition-all"
                        title="Print Label"
                    >
                        <Printer size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    // List Columns
    const listColumns = [
        {
            key: 'image',
            label: '',
            render: (row: Product) => (
                <div className="w-10 h-10 bg-stone-100 rounded overflow-hidden relative group">
                    {row.image || row.image_url ? (
                        <img src={row.image || row.image_url} alt={row.name} className="w-full h-full object-cover" />
                    ) : <ImageIcon size={16} className="m-2 text-stone-300" />}
                </div>
            )
        },
        { key: 'sku', label: t('brandProducts.sku') || 'SKU' },
        {
            key: 'name',
            label: t('brandProducts.product') || 'Product',
            render: (row: Product) => (
                <div
                    className="font-bold hover:text-cashmere-gold cursor-pointer"
                    onClick={() => handleEdit(row)}
                >
                    {row.name}
                </div>
            )
        },
        {
            key: 'retail_price',
            label: t('brandProducts.retailPrice') || 'Price',
            render: (row: Product) => <span className="font-bold">{row.retail_price} EGP</span>
        },
        {
            key: 'total_sold',
            label: t('brandProducts.sold') || 'Lifetime Sales',
            render: (row: Product) => <span className="text-emerald-700 font-bold">{row.total_sold || 0}</span>
        },
        {
            key: 'actions',
            label: '',
            render: (row: Product) => (
                <div className="flex gap-2">
                    <button onClick={() => handlePushToShopify(row)} className="p-1 hover:text-[#95BF47]" title="Push to Shopify"><ShoppingBag size={16} /></button>
                    <button onClick={() => handleEdit(row)} className="p-1 hover:text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => handlePrintLabel(row)} className="p-1 hover:text-stone-800"><Printer size={16} /></button>
                </div>
            )
        }
    ];

    if (loading) return <div className="p-12 text-center text-stone-400 animate-pulse">Loading Catalog...</div>;

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-cashmere-black font-bold mb-1">{t('brandProducts.title') || 'Product Collection'}</h1>
                    <p className="text-stone-500 text-sm">Manage merchandising, pricing, and master data.</p>
                </div>

                <div className="flex bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <div className="w-px bg-stone-200 my-1 mx-1"></div>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('common.search') || "Search products by name or SKU..."}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cashmere-gold/20 outline-none transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        dir={dir}
                    />
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm text-stone-600 font-bold text-sm flex items-center gap-2 hover:bg-stone-50 transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-6 py-3 bg-cashmere-black text-white rounded-xl shadow-lg shadow-stone-200 font-bold text-sm flex items-center gap-2 hover:bg-stone-800 transition-transform active:scale-95"
                    >
                        <Plus size={18} />
                        {t('brandProducts.add') || 'Add Product'}
                    </button>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {/* Render Groups */}
                    {Object.entries(
                        filteredProducts.reduce((acc, product) => {
                            // Group by Style if available, otherwise by Name (cleaning up variant suffixes if strictly consistent naming used, but simple Name fallback is safer for now)
                            const key = product.style || product.name;
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(product);
                            return acc;
                        }, {} as Record<string, Product[]>)
                    ).map(([groupName, groupVariants]) => {
                        const mainProduct = groupVariants[0]; // Use first product as representative
                        const totalStock = groupVariants.reduce((sum, p) => sum + (p.stock_remaining || 0), 0);
                        const variantCount = groupVariants.length;
                        const minPrice = Math.min(...groupVariants.map(p => Number(p.retail_price) || 0));
                        const maxPrice = Math.max(...groupVariants.map(p => Number(p.retail_price) || 0));
                        const priceDisplay = minPrice === maxPrice
                            ? `${minPrice.toLocaleString()} LE`
                            : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} LE`;

                        return (
                            <div
                                key={groupName}
                                onClick={() => setSelectedGroup({ name: groupName, variants: groupVariants })}
                                className="group bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col relative"
                            >
                                {/* Image Area */}
                                <div className="aspect-[4/5] bg-stone-100 relative overflow-hidden">
                                    {mainProduct.image || mainProduct.image_url ? (
                                        <div className="w-full h-full relative">
                                            {/* Stack effect for groups */}
                                            {variantCount > 1 && (
                                                <>
                                                    <div className="absolute top-2 left-2 right-2 bottom-0 bg-white/50 rounded-t-lg transform scale-x-95 -translate-y-2 z-0 border border-stone-100"></div>
                                                </>
                                            )}

                                            <img
                                                src={mainProduct.image || mainProduct.image_url}
                                                alt={groupName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                                            <ImageIcon size={48} strokeWidth={1} />
                                        </div>
                                    )}

                                    {/* Variant Badge */}
                                    <div className="absolute top-2 right-2 z-20">
                                        <div className="bg-white/90 backdrop-blur-sm text-cashmere-black text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-stone-100 flex items-center gap-1">
                                            <LayoutGrid size={12} className="text-stone-400" />
                                            {variantCount} {variantCount === 1 ? 'Variant' : 'Variants'}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-4 flex flex-col flex-1 relative z-20 bg-white">
                                    <div className="mb-1">
                                        <h3 className="font-bold text-stone-800 line-clamp-1 group-hover:text-cashmere-gold transition-colors text-lg font-serif">{groupName}</h3>
                                        {/* Show SKU of main product or range? Just show collection name */}
                                        {mainProduct.style && <p className="text-xs text-stone-400">Collection: {mainProduct.style}</p>}
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-stone-100">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Starting From</p>
                                                <p className="font-bold text-cashmere-maroon font-serif">{priceDisplay}</p>
                                            </div>
                                            {variantCount > 1 && (
                                                <div className="flex -space-x-2">
                                                    {groupVariants.slice(0, 3).map((v, i) => (
                                                        <div key={v.id} className="w-6 h-6 rounded-full border-2 border-white bg-stone-100 text-[8px] flex items-center justify-center font-bold text-stone-500 overflow-hidden" title={`${v.color} - ${v.size}`}>
                                                            {v.color ? v.color[0].toUpperCase() : v.size || '?'}
                                                        </div>
                                                    ))}
                                                    {variantCount > 3 && (
                                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-stone-200 text-[8px] flex items-center justify-center font-bold text-stone-600">
                                                            +{variantCount - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Card */}
                    <button
                        onClick={handleCreate}
                        className="min-h-[360px] rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-4 text-stone-400 hover:border-cashmere-gold hover:text-cashmere-gold hover:bg-amber-50/50 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold">Add New Product</span>
                    </button>
                </div>
            ) : (
                <DataGrid
                    title="Product List"
                    data={filteredProducts}
                    columns={listColumns}
                />
            )}

            {/* Group Details Modal */}
            <Dialog
                isOpen={!!selectedGroup}
                onClose={() => setSelectedGroup(null)}
                title={selectedGroup?.name || 'Product Group'}
            >
                <div className="min-w-[50vw]">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-stone-500">Manage all variants for this style.</p>
                        <button
                            onClick={() => {
                                // Create new variant in this group
                                handleCreate();
                                // Pre-fill style/name
                                setTimeout(() => {
                                    setEditingProduct(prev => ({
                                        ...prev,
                                        name: selectedGroup?.name || '',
                                        style: selectedGroup?.variants[0]?.style || '',
                                        description: selectedGroup?.variants[0]?.description || '',
                                        // Copy financials from first variant
                                        standard_cost: selectedGroup?.variants[0]?.standard_cost,
                                        brand_overhead: selectedGroup?.variants[0]?.brand_overhead,
                                        brand_profit_margin: selectedGroup?.variants[0]?.brand_profit_margin,
                                        retail_price: selectedGroup?.variants[0]?.retail_price
                                    }));
                                    // Pre-fill image if possible?
                                    if (selectedGroup?.variants[0]?.image || selectedGroup?.variants[0]?.image_url) {
                                        setImagePreview(selectedGroup.variants[0].image || selectedGroup.variants[0].image_url || null);
                                    }
                                }, 0);
                            }}
                            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                        >
                            <Plus size={16} /> Add Variant
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
                        {selectedGroup?.variants.map(variant => (
                            <div key={variant.id} className="flex gap-4 p-3 rounded-lg border border-stone-100 hover:border-stone-300 hover:shadow-sm transition-all bg-white group relative">
                                <div className="w-16 h-20 bg-stone-100 rounded-md overflow-hidden shrink-0">
                                    {variant.image || variant.image_url ? (
                                        <img src={variant.image || variant.image_url} className="w-full h-full object-cover" />
                                    ) : <div className="w-full h-full flex items-center justify-center text-stone-300"><ImageIcon size={16} /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-stone-800 text-sm truncate pr-6">{variant.name}</h4>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(variant); }}
                                            className="text-stone-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs font-mono text-stone-400 mb-2">{variant.sku}</p>

                                    <div className="flex gap-2 text-xs">
                                        {variant.size && <span className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200 text-stone-600 font-bold">{variant.size}</span>}
                                        {variant.color && <span className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200 text-stone-600 font-bold">{variant.color}</span>}
                                    </div>
                                </div>
                                {/* Label Print Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrintLabel(variant); }}
                                    className="absolute bottom-3 right-3 text-stone-300 hover:text-stone-800 transition-colors"
                                    title="Print Label"
                                >
                                    <Printer size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Dialog>

            {/* Edit Modal Layout */}
            {isEditOpen && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <div>
                                <h2 className="text-xl font-bold font-serif">{editingProduct.id ? 'Edit Product' : 'New Product'}</h2>
                                <p className="text-xs text-stone-500">{editingProduct.sku || 'Draft'}</p>
                            </div>
                            <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-800">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left: Image & Branding */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Product Image</label>
                                    <div
                                        className="aspect-[4/5] bg-stone-100 rounded-xl relative overflow-hidden group border-2 border-dashed border-stone-200 hover:border-cashmere-gold transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-2">
                                                <Upload size={32} />
                                                <span className="text-xs">Click to upload</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold border border-white px-3 py-1 rounded-full">Change Image</span>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            {/* Right: Details & Pricing */}
                            <div className="md:col-span-2 space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="label-text">Product Name</label>
                                        <input
                                            className="input-field text-lg font-serif"
                                            value={editingProduct.name || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            placeholder="e.g. Classic White Linen Shirt"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-text">SKU</label>
                                        <input
                                            className="input-field font-mono"
                                            value={editingProduct.sku || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label-text">Style</label>
                                        <input
                                            className="input-field"
                                            value={editingProduct.style || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, style: e.target.value })}
                                            placeholder="e.g. Summer 2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-text">Collection (Category)</label>
                                        <select
                                            className="input-field"
                                            value={editingProduct.category || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, category: Number(e.target.value) })}
                                        >
                                            <option value="">-- None --</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="label-text">Description</label>
                                        <textarea
                                            className="input-field min-h-[100px]"
                                            value={editingProduct.description || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Pricing Section */}
                                <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                                    <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                                        Pricing Calculator
                                        <span className="text-xs font-normal text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-200">Auto-updates Retail</span>
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="label-text">Factory Cost</label>
                                            <div className="relative">
                                                <input
                                                    type="number" className="input-field pl-8"
                                                    value={editingProduct.standard_cost || ''}
                                                    onChange={e => setEditingProduct({ ...editingProduct, standard_cost: parseFloat(e.target.value) })}
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">£</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label-text">Brand Overhead</label>
                                            <div className="relative">
                                                <input
                                                    type="number" className="input-field pl-8"
                                                    value={editingProduct.brand_overhead || ''}
                                                    onChange={e => setEditingProduct({ ...editingProduct, brand_overhead: parseFloat(e.target.value) })}
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">£</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label-text">Target Margin %</label>
                                            <div className="relative">
                                                <input
                                                    type="number" className="input-field pr-8"
                                                    value={editingProduct.brand_profit_margin || ''}
                                                    onChange={e => setEditingProduct({ ...editingProduct, brand_profit_margin: parseFloat(e.target.value) })}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-stone-200">
                                        <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">Calculated Retail Price</span>
                                        <span className="text-2xl font-bold font-serif text-cashmere-maroon">
                                            {editingProduct.retail_price?.toLocaleString()} <span className="text-sm font-sans text-stone-400">LE</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="px-6 py-2 rounded-lg font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-2 bg-cashmere-black text-white rounded-lg font-bold shadow-lg hover:bg-black transition-transform active:scale-95 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Label print area: off-screen so SVG barcode is always rendered with layout */}
            <div
                id="thermal-labels-print-area"
                aria-hidden="true"
                style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}
            >
                {labelProduct && (
                    <ProductLabel
                        product_name={labelProduct.name}
                        product_sku={labelProduct.sku}
                        product_barcode={labelProduct.barcode}
                        product_price={labelProduct.retail_price || 0}
                    />
                )}
            </div>

            <style jsx global>{`
                .label-text {
                    @apply block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide;
                }
                .input-field {
                    @apply w-full px-4 py-2.5 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-cashmere-gold/20 transition-all font-medium text-stone-800;
                }
            `}</style>
        </div >
    );
}
