"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, Layers, ChevronRight, Plus, Package } from 'lucide-react';
import Dialog from '@/components/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';

interface Product {
    id: number;
    name: string;
    sku: string;
    description: string;
    category?: string;
    style?: string;
    size?: string;
    color?: string;
    retail_price?: string;
    image?: string;
    image_url?: string;
}

interface StyleGroup {
    name: string;
    description: string;
    variants: Product[];
    totalStock: number; // Placeholder for now
}

const PREDEFINED_COLORS = ['Black', 'White', 'Navy', 'Red', 'Beige', 'Green', 'Grey'];
const PREDEFINED_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export default function FactoryProductCatalog() {
    const { t } = useLanguage();
    const { token } = useAuth();
    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<StyleGroup | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null); // New state

    const [formData, setFormData] = useState({
        name: '',
        baseSku: '',
        description: '',
        colors: [] as string[],
        sizes: [] as string[],
        retail_price: ''
    });

    const [products, setProducts] = useState<Product[]>([]);
    const [styles, setStyles] = useState<StyleGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const fetchProducts = React.useCallback(() => {
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/?lite=true&page_size=200`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then((raw: any) => {
                const data: Product[] = Array.isArray(raw) ? raw : (raw.results || []);
                setProducts(data);

                // Group by Style Name (or Name if Style is missing)
                const groups: { [key: string]: StyleGroup } = {};
                data.forEach(p => {
                    const groupName = p.style || p.name;
                    if (!groups[groupName]) {
                        groups[groupName] = {
                            name: groupName,
                            description: p.description,
                            variants: [],
                            totalStock: 0
                        };
                    }
                    groups[groupName].variants.push(p);
                });
                setStyles(Object.values(groups));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (token) fetchProducts();
    }, [fetchProducts, token]);

    const handleCreateVariants = async () => {
        if (!formData.name || !formData.baseSku) { toast.error("Name and Base SKU are required"); return; }

        setCreating(true);
        // Use selected colors/sizes or defaults
        const colors = formData.colors.length > 0 ? formData.colors : [''];
        const sizes = formData.sizes.length > 0 ? formData.sizes : [''];

        const requests = [];

        // Generate Combinations
        for (const color of colors) {
            for (const size of sizes) {
                // Suffix: -COLOR-SIZE (omit if empty)
                let skuSuffix = "";
                if (color) skuSuffix += `-${color.toUpperCase().substring(0, 3)}`;
                if (size) skuSuffix += `-${size.toUpperCase()}`;

                const finalSku = `${formData.baseSku}${skuSuffix}`;

                const data = new FormData();
                data.append('name', formData.name);
                data.append('sku', finalSku);
                data.append('style', formData.name); // Manual Creation: Style = Name
                data.append('description', formData.description);
                data.append('retail_price', formData.retail_price);
                data.append('color', color);
                data.append('size', size);

                if (imageFile) {
                    data.append('image', imageFile);
                }

                requests.push(fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: data
                }));
            }
        }

        try {
            await Promise.all(requests);
            setIsDialogOpen(false);
            setFormData({ name: '', baseSku: '', description: '', colors: [], sizes: [], retail_price: '' });
            setImageFile(null);
            fetchProducts();
            toast.success(`Created ${requests.length} variants!`);
        } catch (err) {
            console.error(err);
            toast.error("Some items failed to create. Check unique SKU constraints.");
        } finally {
            setCreating(false);
        }
    };

    const toggleItem = (list: string[], item: string, field: 'colors' | 'sizes') => {
        if (list.includes(item)) {
            setFormData({ ...formData, [field]: list.filter(i => i !== item) });
        } else {
            setFormData({ ...formData, [field]: [...list, item] });
        }
    };

    const addCustomItem = (e: React.KeyboardEvent<HTMLInputElement>, field: 'colors' | 'sizes') => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value.trim();
            if (val && !formData[field].includes(val)) {
                setFormData({ ...formData, [field]: [...formData[field], val] });
                e.currentTarget.value = '';
            }
        }
    };

    const openDetails = (style: StyleGroup) => {
        setSelectedStyle(style);
        setIsDetailsOpen(true);
    };

    // Edit Image Logic
    const [editStyle, setEditStyle] = useState<StyleGroup | null>(null);
    const [editImage, setEditImage] = useState<File | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleUpdateStyleImage = async () => {
        if (!editStyle || !editImage) return;

        try {
            // Update all variants in this style with the new image
            const updates = editStyle.variants.map(variant => {
                const data = new FormData();
                data.append('image', editImage);
                return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/${variant.id}/`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: data
                });
            });

            await Promise.all(updates);

            toast.success("Style Image Updated Successfully!");
            setIsEditOpen(false);
            setEditStyle(null);
            setEditImage(null);
            fetchProducts();
        } catch (e) {
            console.error(e);
            toast.error("Failed to update image");
        }
    };

    if (loading) return <div className="p-12 text-center text-stone-500 font-serif">{t('common.loading')}</div>;

    return (
        <div className="p-8">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-cashmere-maroon mb-2">{t('factoryProducts.title')}</h1>
                    <p className="text-stone-500">{t('factoryProducts.subtitle')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-stone-100 px-4 py-2 rounded-lg text-sm font-bold text-stone-600">
                        {styles.length} {t('factoryProducts.styles')} ({products.length} {t('factoryProducts.variants')})
                    </div>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="btn-primary flex items-center gap-2 px-4 py-2"
                    >
                        <span>{t('factoryProducts.newStyle')}</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styles.map(style => (
                    <div key={style.name} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow">
                        <div
                            className="h-40 bg-stone-100 flex items-center justify-center relative overflow-hidden cursor-pointer hover:opacity-90"
                            onClick={() => {
                                setEditStyle(style);
                                setEditImage(null);
                                setIsEditOpen(true);
                            }}
                            title="Click to Change Image"
                        >
                            {style.variants[0]?.image || style.variants[0]?.image_url ? (
                                <img src={style.variants[0].image_url || style.variants[0].image} alt={style.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                <Package size={40} className="text-stone-300" />
                            )}
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-mono font-bold text-stone-600 shadow-sm border border-stone-100">
                                {style.variants.length} {t('factoryProducts.variants')}
                            </div>
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                <span className="bg-white/90 text-xs font-bold px-2 py-1 rounded shadow-sm text-stone-700">Change Photo</span>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-serif font-bold text-lg text-cashmere-black mb-1 group-hover:text-cashmere-maroon transition-colors">
                                {style.name}
                            </h3>
                            <p className="text-sm text-stone-500 mb-4 line-clamp-2 min-h-[40px]">
                                {style.description || t('common.noDescription')}
                            </p>

                            {/* Variant List Preview */}
                            <div className="space-y-2 mb-4">
                                {style.variants.slice(0, 3).map(v => (
                                    <div key={v.id} className="flex items-center justify-between text-xs bg-stone-50 px-2 py-1.5 rounded border border-stone-100">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-medium text-stone-700">{v.sku}</span>
                                            <span className="text-stone-400">|</span>
                                            <span className="text-stone-500">{v.color || '-'} / {v.size || '-'}</span>
                                        </div>
                                        <Link
                                            href={`/factory/bom/builder?productId=${v.id}`}
                                            className="text-cashmere-gold hover:text-cashmere-maroon"
                                            title={t('factoryProducts.editBom')}
                                        >
                                            <Layers size={14} />
                                        </Link>
                                    </div>
                                ))}
                                {style.variants.length > 3 && (
                                    <div className="text-xs text-center text-stone-400 font-medium italic">
                                        + {style.variants.length - 3} {t('common.more')}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => openDetails(style)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-50 rounded transition-colors"
                            >
                                {t('factoryProducts.viewDetails')} <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={t('factoryProducts.defineValues')}
            >
                <div className="space-y-4">
                    <p className="text-sm text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-100">
                        {t('factoryProducts.wizardHelp')}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryProducts.styleName')} *</label>
                            <input
                                type="text"
                                className="w-full border-stone-200 rounded-lg text-sm"
                                placeholder="e.g. Silk Ramadan Kaftan"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryProducts.baseSku')} *</label>
                            <input
                                type="text"
                                className="w-full border-stone-200 rounded-lg text-sm font-mono uppercase"
                                placeholder="e.g. KFT-2026"
                                value={formData.baseSku}
                                onChange={e => setFormData({ ...formData, baseSku: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('brandProducts.retailPrice')}</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg text-sm"
                                placeholder="0.00"
                                value={formData.retail_price}
                                onChange={e => setFormData({ ...formData, retail_price: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 border-t border-stone-100 pt-4 mt-2">
                            <h4 className="text-xs font-bold uppercase text-cashmere-maroon mb-3 flex items-center gap-2">
                                <Plus size={14} /> {t('factoryProducts.variantGenerator')}
                            </h4>

                            {/* Colors */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-stone-700 mb-2">{t('factoryProducts.colors')}</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {PREDEFINED_COLORS.map(c => (
                                        <button key={c} onClick={() => toggleItem(formData.colors, c, 'colors')}
                                            className={`px-3 py-1 rounded-full text-xs font-bold border ${formData.colors.includes(c) ? 'bg-cashmere-black text-white border-cashmere-black' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {formData.colors.filter(c => !PREDEFINED_COLORS.includes(c)).map(c => (
                                        <span key={c} className="px-3 py-1 rounded-full text-xs font-bold bg-cashmere-black text-white flex items-center gap-1">
                                            {c} <button onClick={() => toggleItem(formData.colors, c, 'colors')} className="hover:text-red-300">×</button>
                                        </span>
                                    ))}
                                    <input type="text" placeholder="+ Custom Color (Enter)" onKeyDown={e => addCustomItem(e, 'colors')}
                                        className="text-xs border-none bg-stone-50 rounded-lg focus:ring-0 w-32" />
                                </div>
                            </div>

                            {/* Sizes */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">{t('factoryProducts.sizes')}</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {PREDEFINED_SIZES.map(s => (
                                        <button key={s} onClick={() => toggleItem(formData.sizes, s, 'sizes')}
                                            className={`px-3 py-1 rounded-full text-xs font-bold border ${formData.sizes.includes(s) ? 'bg-cashmere-black text-white border-cashmere-black' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {formData.sizes.filter(s => !PREDEFINED_SIZES.includes(s)).map(s => (
                                        <span key={s} className="px-3 py-1 rounded-full text-xs font-bold bg-cashmere-black text-white flex items-center gap-1">
                                            {s} <button onClick={() => toggleItem(formData.sizes, s, 'sizes')} className="hover:text-red-300">×</button>
                                        </span>
                                    ))}
                                    <input type="text" placeholder="+ Custom (Enter)" onKeyDown={e => addCustomItem(e, 'sizes')}
                                        className="text-xs border-none bg-stone-50 rounded-lg focus:ring-0 w-32" />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 mt-4">
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('finance.description')}</label>
                            <textarea
                                className="w-full border-stone-200 rounded-lg text-sm"
                                rows={2}
                                placeholder="Style details..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('common.image') || 'Image'}</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
                                className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cashmere-gold/20 file:text-yellow-900 hover:file:bg-cashmere-gold/30"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 mt-6">
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleCreateVariants}
                            disabled={creating}
                            className="btn-primary text-sm px-6"
                        >
                            {creating ? t('common.loading') : t('factoryProducts.generate')}
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={`${t('factoryProducts.styleDetails')}: ${selectedStyle?.name}`}>
                <div className="space-y-6">
                    <div className="bg-stone-50 p-4 rounded-lg">
                        <p className="text-sm text-stone-600">{selectedStyle?.description || t('common.noDescription')}</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-stone-800 mb-4 flex items-center justify-between">
                            <span>{t('factoryProducts.variants')} ({selectedStyle?.variants.length})</span>
                            <span className="text-xs font-normal text-stone-500">{t('factoryProducts.masterSku')}: {selectedStyle?.variants[0]?.sku.split('-')[0]}</span>
                        </h4>
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                            {selectedStyle?.variants.map(v => (
                                <div key={v.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-stone-800">{v.sku}</span>
                                        </div>
                                        <div className="text-xs text-stone-500 mt-1 flex gap-3">
                                            <span>{t('factoryProducts.colors')}: <strong className="text-stone-700">{v.color || "N/A"}</strong></span>
                                            <span>{t('factoryProducts.sizes')}: <strong className="text-stone-700">{v.size || "N/A"}</strong></span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/factory/bom/builder?productId=${v.id}`}
                                        className="btn-secondary text-xs"
                                    >
                                        Edit BOM
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex justify-end">
                        <button onClick={() => setIsDetailsOpen(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded">{t('common.close')}</button>
                    </div>
                </div>
            </Dialog>

            {/* Edit Style Image Dialog */}
            <Dialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title={t('common.editImage') || "Edit Style Image"}
            >
                <div>
                    <p className="text-sm text-stone-600 mb-4">
                        Upload a new image for <strong>{editStyle?.name}</strong>. This will update the photo for all variants ({editStyle?.variants.length}) in this style.
                    </p>
                    <div className="mb-4">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setEditImage(e.target.files[0]);
                                }
                            }}
                            className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cashmere-gold/20 file:text-yellow-900 hover:file:bg-cashmere-gold/30"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                        <button
                            onClick={() => setIsEditOpen(false)}
                            className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleUpdateStyleImage}
                            className="px-6 py-2 bg-cashmere-maroon text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
