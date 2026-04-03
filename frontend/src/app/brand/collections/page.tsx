"use client";

import React, { useState, useEffect } from 'react';
import DataGrid from '@/components/DataGrid';
import Dialog from '@/components/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, ShoppingBag, Folder } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
    id: number;
    name: string;
    description: string;
    product_count: number;
    shopify_collection_id?: string;
    items_sold?: number;
    revenue?: number;
    profit?: number;
}

export default function CollectionsPage() {
    const { t } = useLanguage();
    const { token } = useAuth(); // Get token
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Category>>({});

    useEffect(() => {
        if (token) {
            fetchCategories();
        }
    }, [token]);

    const fetchCategories = () => {
        if (!token) return;
        setLoading(true);
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
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setCategories([]);
                setLoading(false);
            });
    };

    const handleSave = async () => {
        if (!token) return;

        const url = formData.id
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/categories/${formData.id}/`
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/categories/`;

        const method = formData.id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                fetchCategories();
            } else {
                alert("Failed to save");
            }
        } catch (e) {
            alert("Error saving category");
        }
    };

    const handlePushToShopify = async (category: Category) => {
        if (!token) return;
        if (!confirm(`Push Collection "${category.name}" to Shopify?`)) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/shopify/push_collection/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ category_id: category.id })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Success: Collection Sync Initiated');
                fetchCategories();
            } else {
                alert('Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Network Error');
        }
    };

    const columns = [
        { key: 'name', label: 'Name', render: (row: Category) => <span className="font-bold">{row.name}</span> },
        { key: 'description', label: 'Description' },
        { key: 'product_count', label: 'Products', render: (row: Category) => <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold">{row.product_count}</span> },
        {
            key: 'shopify',
            label: 'Shopify Status',
            render: (row: Category) => (
                row.shopify_collection_id
                    ? <span className="text-green-600 text-xs font-bold flex items-center gap-1">Synced</span>
                    : <span className="text-stone-400 text-xs">Not Synced</span>
            )
        },
        { key: 'items_sold', label: 'Sold', render: (row: Category) => <span className="font-mono">{row.items_sold || 0}</span> },
        {
            key: 'revenue',
            label: 'Revenue',
            render: (row: Category) => <span className="font-bold text-emerald-700">{Number(row.revenue || 0).toLocaleString()} LE</span>
        },
        {
            key: 'profit',
            label: 'Profit',
            render: (row: Category) => (
                <span className={`font-bold ${(row.profit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {Number(row.profit || 0).toLocaleString()} LE
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (row: Category) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePushToShopify(row)}
                        className={`p-1 ${row.shopify_collection_id ? 'text-green-600' : 'text-stone-400 hover:text-[#95BF47]'}`}
                        title="Push to Shopify"
                    >
                        <ShoppingBag size={16} />
                    </button>
                    <button onClick={() => { setFormData(row); setIsDialogOpen(true); }} className="p-1 hover:text-blue-600"><Edit size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 max-w-[1200px] mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-cashmere-maroon mb-2">Collections</h1>
                    <p className="text-stone-500">Manage product categories and sync to Shopify.</p>
                </div>
                <button
                    onClick={() => { setFormData({}); setIsDialogOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> New Collection
                </button>
            </header>

            <DataGrid
                title="Your Collections"
                data={categories}
                columns={columns}
                loading={loading}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={formData.id ? "Edit Collection" : "New Collection"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Name</label>
                        <input
                            className="w-full border-stone-200 rounded-lg"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Summer Essentials"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Description</label>
                        <textarea
                            className="w-full border-stone-200 rounded-lg"
                            rows={3}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-50 rounded">Cancel</button>
                        <button onClick={handleSave} className="btn-primary">Save</button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
