"use client";

import React, { useEffect, useState } from 'react';
import DataGrid from '@/components/DataGrid';
import Dialog from '@/components/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageIcon } from 'lucide-react';

interface Material {
    id: number;
    name: string;
    description: string;
    unit: string;
    cost_per_unit: string;
    supplier_name: string;
    current_stock: number;
    reorder_level: number;
    supplier?: number;
    image?: string;
}

interface Supplier {
    id: number;
    name: string;
}

export default function InventoryPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        supplier_id: '',
        unit: 'METER',
        cost_per_unit: '',
        current_stock: '',
        reorder_level: 10,
        amount_paid: ''
    });

    // Restock State
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [restockItem, setRestockItem] = useState<Material | null>(null);
    const [restockQty, setRestockQty] = useState('');
    const [restockCost, setRestockCost] = useState('');
    const [restockPaid, setRestockPaid] = useState('');

    const fetchData = () => {
        Promise.all([
            fetch('http://127.0.0.1:8000/api/factory/materials/').then(r => r.json()),
            fetch('http://127.0.0.1:8000/api/factory/suppliers/').then(r => r.json())
        ]).then(([matData, suppData]) => {
            setMaterials(matData);
            setSuppliers(suppData);
            setLoading(false);
        }).catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (!formData.name) return alert("Name is required");

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('unit', formData.unit);
        if (formData.supplier_id) data.append('supplier', formData.supplier_id);
        data.append('cost_per_unit', formData.cost_per_unit);
        data.append('current_stock', formData.current_stock);
        data.append('reorder_level', formData.reorder_level.toString());
        data.append('amount_paid', formData.amount_paid || '0');

        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            const res = await fetch('http://127.0.0.1:8000/api/factory/materials/', {
                method: 'POST',
                // headers: { 'Content-Type': 'multipart/form-data' }, // Fails if set manually with FormData
                body: data
            });

            if (res.ok) {
                setIsDialogOpen(false);
                setFormData({
                    name: '',
                    description: '',
                    supplier_id: '',
                    unit: 'METER',
                    cost_per_unit: '',
                    current_stock: '',
                    reorder_level: 10,
                    amount_paid: ''
                });
                setImageFile(null);
                fetchData();
            } else {
                alert("Failed to add stock");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openRestock = (item: Material) => {
        setRestockItem(item);
        setRestockCost(item.cost_per_unit);
        setRestockQty('');
        setRestockPaid('');
        setIsRestockOpen(true);
    };

    const submitRestock = async () => {
        if (!restockItem || !restockQty) return;

        try {
            const res = await fetch('http://127.0.0.1:8000/api/factory/purchases/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    raw_material: restockItem.id,
                    supplier: restockItem.supplier || suppliers[0]?.id, // Fallback if missing, but should exist
                    quantity: restockQty,
                    cost_per_unit: restockCost,
                    amount_paid: restockPaid || 0,
                    total_cost: parseFloat(restockQty) * parseFloat(restockCost)
                })
            });

            if (res.ok) {
                alert("Restock Successful!");
                setIsRestockOpen(false);
                fetchData();
            } else {
                const contentType = res.headers.get("content-type");
                let errorMessage;
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const err = await res.json();
                    errorMessage = JSON.stringify(err);
                } else {
                    errorMessage = await res.text();
                    console.error("Non-JSON error:", errorMessage);
                    errorMessage = "Server Error (Check Console for details)";
                }
                alert("Failed: " + errorMessage);
            }
        } catch (e) {
            console.error(e);
            alert("Network Error - Check Console");
        }
    };

    const columns = [
        {
            key: 'image',
            label: '',
            render: (row: Material) => (
                <div className="w-10 h-10 bg-stone-100 rounded-md overflow-hidden flex items-center justify-center">
                    {row.image ? (
                        <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon size={16} className="text-stone-300" />
                    )}
                </div>
            )
        },
        {
            key: 'name',
            label: t('factoryInventory.materialName'),
            render: (row: Material) => (
                <div>
                    <span className="font-medium text-stone-800">{row.name}</span>
                    <span className="text-xs text-stone-500 ml-2">({row.description})</span>
                </div>
            )
        },
        { key: 'supplier_name', label: t('suppliers.supplier') },
        {
            key: 'current_stock',
            label: t('factoryInventory.currentStock'),
            render: (row: Material) => (
                <span className={row.current_stock < row.reorder_level ? "text-red-700 font-bold" : "text-emerald-700"}>
                    {row.current_stock} {row.unit}
                </span>
            )
        },
        { key: 'reorder_level', label: t('materials.minimumLevel') },
        { key: 'cost_per_unit', label: t('factoryInventory.unitCost') },
        {
            key: 'actions',
            label: t('common.actions'),
            render: (row: Material) => (
                <button
                    onClick={() => openRestock(row)}
                    className="text-xs bg-cashmere-maroon text-white px-3 py-1 rounded hover:bg-stone-800 transition-colors"
                >
                    {t('factoryInventory.restock')}
                </button>
            )
        }
    ];

    if (loading) return <div className="p-8 text-center text-stone-500 font-serif">Loading Inventory...</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-serif text-cashmere-maroon mb-6">{t('factoryInventory.title')}</h1>
            <DataGrid
                title={t('factoryInventory.subtitle')}
                columns={columns}
                data={materials}
                action={
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                    >
                        <span>+ {t('factoryInventory.addStock')}</span>
                    </button>
                }
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={t('factoryInventory.registerMaterial')}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.materialName')} *</label>
                            <input
                                type="text"
                                className="w-full border-stone-200 rounded-lg text-sm"
                                placeholder="e.g. Belgian Linen"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        {/* Image Upload */}
                        <div>
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.colorType')}</label>
                            <input
                                type="text"
                                className="w-full border-stone-200 rounded-lg text-sm"
                                placeholder="e.g. Off-White"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('materials.unit')}</label>
                            <select
                                className="w-full border-stone-200 rounded-lg text-sm"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="METER">{t('materials.meter') || 'Meter'}</option>
                                <option value="UNIT">{t('materials.unitItem') || 'Unit'}</option>
                                <option value="KG">{t('materials.kilogram') || 'KG'}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('suppliers.supplier')}</label>
                        <select
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={formData.supplier_id}
                            onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                        >
                            <option value="">{t('common.select') || 'Select...'}</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.unitCost')} (EGP) *</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg text-sm text-right"
                                placeholder="0.00"
                                value={formData.cost_per_unit}
                                onChange={e => setFormData({ ...formData, cost_per_unit: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.openingStock')} *</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg text-sm text-right"
                                placeholder="0"
                                value={formData.current_stock}
                                onChange={e => setFormData({ ...formData, current_stock: e.target.value })}
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
                            onClick={handleCreate}
                            className="btn-primary text-sm px-6"
                        >
                            {t('factoryInventory.confirmStockIn')}
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* Restock Dialog */}
            <Dialog
                isOpen={isRestockOpen}
                onClose={() => setIsRestockOpen(false)}
                title={`${t('factoryInventory.restock')} ${restockItem?.name}`}
            >
                <div className="space-y-4">
                    <div className="p-3 bg-stone-50 rounded border border-stone-200 text-sm">
                        <p><strong>{t('factoryInventory.currentStock')}:</strong> {restockItem?.current_stock} {restockItem?.unit}</p>
                        <p><strong>{t('suppliers.supplier')}:</strong> {restockItem?.supplier_name || 'Unknown'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.qtyToBuy')} ({restockItem?.unit})</label>
                        <input
                            type="number"
                            className="w-full border-stone-200 rounded-lg"
                            value={restockQty}
                            onChange={e => setRestockQty(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.unitCost')} (EGP)</label>
                        <input
                            type="number"
                            className="w-full border-stone-200 rounded-lg"
                            value={restockCost}
                            onChange={e => setRestockCost(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <h4 className="text-xs font-bold text-stone-500 uppercase mb-3">{t('factoryInventory.paymentDetails')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.totalCost')}</label>
                            <div className="text-lg font-bold text-stone-800">
                                {(parseFloat(restockQty || '0') * parseFloat(restockCost || '0')).toLocaleString()} EGP
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryInventory.amountPaid')}</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg font-bold text-emerald-800"
                                placeholder="0.00"
                                value={restockPaid}
                                onChange={e => setRestockPaid(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-stone-500 text-right">
                        {t('factoryInventory.remainingDebt')}: <span className="font-bold text-red-600">
                            {Math.max(0, (parseFloat(restockQty || '0') * parseFloat(restockCost || '0')) - parseFloat(restockPaid || '0')).toLocaleString()} EGP
                        </span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                    <button onClick={() => setIsRestockOpen(false)} className="px-4 py-2 text-stone-500">{t('common.cancel')}</button>
                    <button onClick={submitRestock} className="btn-primary px-6">{t('factoryInventory.confirmPurchase')}</button>
                </div>
            </Dialog>
        </div>
    );
}
