"use client";

import React, { useState, useEffect } from 'react';
import DataGrid from '@/components/DataGrid';
import KPICard from '@/components/KPICard';
import { AlertCircle, Search, Filter, Box, Printer, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductLabel from '@/components/ProductLabel';

interface InventoryItem {
    id: number;
    product: number;
    product_sku: string;
    product_name: string;
    location_name: string;
    quantity: number;
    product_cost: string;
    product_price: string;
    product_image?: string;
    product_barcode?: string;
}

import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';

// ... (existing imports)

export default function BrandInventoryPage() {
    const [originalData, setOriginalData] = useState<InventoryItem[]>([]);
    const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();
    const { token } = useAuth(); // Get token

    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('All');

    // Selection & Restock State
    const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [orderSource, setOrderSource] = useState('Store Restock');
    const [clientName, setClientName] = useState('');
    const [orderDetails, setOrderDetails] = useState('');
    const [restockQuantities, setRestockQuantities] = useState<{ [key: number]: number }>({});

    // Edit State
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editImage, setEditImage] = useState<File | null>(null);

    // Label Printing
    const [labelProducts, setLabelProducts] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/inventory/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : (data.results || []);
                setOriginalData(list);
                setFilteredData(list);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch brand inventory", err);
                setLoading(false);
            });
    }, [token]);

    // ... (rest of code)

    const handleBulkRestock = async () => {
        if (!token) return;

        let noteString = "";
        if (orderSource !== 'Store Restock') {
            noteString = `Source: ${orderSource}`;
            if (clientName) noteString += ` | Client: ${clientName}`;
            if (orderDetails) noteString += ` | Note: ${orderDetails}`;
        } else {
            noteString = "Source: Store Restock";
        }

        const requests = selectedItems.map(item => {
            const qty = restockQuantities[item.id] || 1;
            return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    product: item.product,
                    quantity: qty,
                    status: 'PENDING',
                    notes: noteString
                })
            });
        });

        try {
            await Promise.all(requests);
            toast.success("Orders Sent to Factory successfully!");
            setShowRestockModal(false);
            setSelectedItems([]);
            setOrderSource('Store Restock');
            setClientName('');
            setOrderDetails('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to send some orders.");
        }
    };

    // ... (rest of code)

    const handleUpdateProduct = async () => {
        if (!editItem || !token) return;

        const data = new FormData();
        if (editImage) {
            data.append('image', editImage);
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/${editItem.product}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // No Content-Type for FormData
                },
                body: data
            });

            if (res.ok) {
                toast.success("Product Updated Successfully!");
                setIsEditOpen(false);
                setEditItem(null);
                setEditImage(null);
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/inventory/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        // ...
                        setOriginalData(data);
                        setFilteredData(data);
                    });
            } else {
                toast.error("Failed to update product");
            }
        } catch (e) {
            console.error(e);
            toast.error("Network Error");
        }
    };

    const columns = [
        {
            key: 'image',
            label: '',
            render: (row: InventoryItem) => (
                <div
                    className="w-10 h-10 bg-stone-100 rounded-md overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                        setEditItem(row);
                        setEditImage(null);
                        setIsEditOpen(true);
                    }}
                    title="Click to Edit Image"
                >
                    {row.product_image ? (
                        <img src={row.product_image} alt={row.product_name} className="w-full h-full object-cover" />
                    ) : (
                        <Box size={16} className="text-stone-300" />
                    )}
                </div>
            )
        },
        { key: 'product_sku', label: t('brandInventory.sku'), render: (row: InventoryItem) => <span className="font-mono text-xs text-stone-500">{row.product_sku}</span> },
        { key: 'product_name', label: t('brandInventory.product'), render: (row: InventoryItem) => <span className="font-bold text-stone-800">{row.product_name}</span> },
        {
            key: 'location_name',
            label: t('inventory.location'),
            render: (row: InventoryItem) => (
                <span className={`px-2 py-0.5 text-xs font-bold rounded 
                        ${row.location_name.includes('Warehouse') ? 'bg-stone-100 text-stone-600' : 'bg-cashmere-gold/20 text-yellow-900 border border-cashmere-gold/20'}`}>
                    {row.location_name}
                </span>
            )
        },
        {
            key: 'quantity',
            label: t('inventory.quantity'),
            render: (row: InventoryItem) => <span className="font-bold text-lg">{row.quantity}</span>
        },
        {
            key: 'status',
            label: t('common.status'),
            render: (row: InventoryItem) => {
                const status = getStockStatus(row.quantity);
                return (
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit ${status.color}`}>
                        {row.quantity < 10 && <AlertCircle size={12} />}
                        {status.label}
                    </span>
                );
            }
        }
    ];

    const getStockStatus = (qty: number) => {
        if (qty <= 0) return { label: t('inventory.outOfStock') || 'Out of Stock', color: 'bg-red-100 text-red-800' };
        if (qty < 10) return { label: t('inventory.lowStock') || 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
        return { label: t('inventory.inStock') || 'In Stock', color: 'bg-emerald-100 text-emerald-800' };
    };

    const handlePrintLabels = () => {
        setLabelProducts(selectedItems.map(item => ({
            product_name: item.product_name,
            product_sku: item.product_sku,
            product_barcode: item.product_barcode,
            product_price: item.product_price
        })));
        setTimeout(() => {
            const printArea = document.getElementById('thermal-labels-print-area');
            const content = printArea?.innerHTML?.trim();
            if (!content) { window.print(); return; }

            const win = window.open('', '_blank', 'width=260,height=600,toolbar=no,scrollbars=no,menubar=no,status=no');
            if (!win) { window.print(); return; }

            win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  @page { size: 58mm auto; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  html, body { width: 58mm; height: fit-content; margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; }
</style></head>
<body>${content}
<script>window.onload=function(){setTimeout(function(){window.print();window.close();},150);};<\/script>
</body></html>`);
            win.document.close();
        }, 600);
    };

    const stats = {
        totalItems: filteredData.length,
        totalQuantity: filteredData.reduce((sum, item) => sum + item.quantity, 0),
        totalRetailValue: filteredData.reduce((sum, item) => sum + (parseFloat(item.product_price) || 0) * item.quantity, 0),
        totalCostValue: filteredData.reduce((sum, item) => sum + (parseFloat(item.product_cost) || 0) * item.quantity, 0),
        lowStockCount: filteredData.filter(item => item.quantity < 10).length
    };

    if (loading) return <div className="p-8 text-center text-stone-500 italic">{t('common.loading')}</div>;

    return (
        <div className="p-8 pb-32">
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h1 className="text-3xl font-serif font-bold text-cashmere-maroon">{t('brandInventory.title')}</h1>
                    <div className="flex flex-1 md:flex-none gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input
                                type="text"
                                placeholder={t('orders.searchPlaceholder')}
                                className="pl-9 pr-4 py-2 rounded-lg border border-stone-200 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-cashmere-gold/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <select
                                className="platform-select pl-9 pr-8 py-2 rounded-lg border border-stone-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-cashmere-gold/20"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option value="All">{t('inventory.allLocations')}</option>
                                <option value="Warehouse">{t('inventory.warehouse')}</option>
                                <option value="Store">{t('inventory.showroom')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Total Stock"
                        value={stats.totalQuantity.toLocaleString()}
                        subtext={`${stats.totalItems} Unique Items`}
                        icon={Package}
                    />
                    <KPICard
                        title="Retail Value"
                        value={stats.totalRetailValue > 0 ? `${stats.totalRetailValue.toLocaleString()} LE` : '---'}
                        subtext="Potential Revenue"
                        icon={DollarSign}
                        positive
                    />
                    <KPICard
                        title="Asset Value (Cost)"
                        value={stats.totalCostValue > 0 ? `${stats.totalCostValue.toLocaleString()} LE` : '---'}
                        subtext="Total Investment"
                        icon={TrendingUp}
                    />
                    <KPICard
                        title="Low Stock Alerts"
                        value={stats.lowStockCount}
                        subtext="Items needing restock"
                        icon={AlertTriangle}
                        trend={stats.lowStockCount > 0 ? 'down' : 'neutral'}
                    />
                </div>
            </header>

            <DataGrid
                title={`${t('brandInventory.subtitle')} (${filteredData.length} ${t('common.details')})`}
                columns={columns}
                data={filteredData}
                selectable={true}
                onSelectionChange={(indices) => {
                    const items = indices.map(i => filteredData[i]);
                    setSelectedItems(items);
                }}
                action={
                    selectedItems.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrintLabels}
                                className="bg-stone-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                <Printer size={16} />
                                Print Labels ({selectedItems.length})
                            </button>
                            <button
                                onClick={() => setShowRestockModal(true)}
                                className="bg-cashmere-maroon text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                {t('brandInventory.requestProduction')} ({selectedItems.length})
                            </button>
                        </div>
                    )
                }
            />

            {showRestockModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 border border-stone-200">
                        <div className="mb-6">
                            <h2 className="text-2xl font-serif font-bold text-cashmere-maroon">{t('brandInventory.requestProduction')}</h2>
                            <p className="text-stone-500 text-sm">{t('brandInventory.sendOrder')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">{t('brandInventory.orderSource')}</label>
                                <select
                                    className="w-full border-stone-200 rounded-lg text-sm"
                                    value={orderSource}
                                    onChange={(e) => setOrderSource(e.target.value)}
                                >
                                    <option value="Store Restock">{t('brandInventory.storeRestock')}</option>
                                    <option value="Social Media">{t('brandInventory.socialMedia')}</option>
                                    <option value="Direct Client">{t('brandInventory.directClient')}</option>
                                    <option value="Event/Bazaar">{t('brandInventory.event')}</option>
                                </select>
                            </div>
                            {orderSource !== 'Store Restock' && (
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('brandInventory.clientName')}</label>
                                    <input
                                        type="text"
                                        className="w-full border-stone-200 rounded-lg text-sm"
                                        placeholder="e.g. Mona Ahmed"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {orderSource !== 'Store Restock' && (
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-stone-700 mb-1">{t('brandInventory.orderDetails')}</label>
                                <textarea
                                    className="w-full border-stone-200 rounded-lg text-sm h-20"
                                    placeholder={t('common.notes')}
                                    value={orderDetails}
                                    onChange={(e) => setOrderDetails(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="bg-stone-50 rounded-lg p-4 border border-stone-100 max-h-60 overflow-y-auto mb-6">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-stone-500 uppercase font-bold border-b border-stone-200">
                                    <tr>
                                        <th className="pb-2">{t('common.product')}</th>
                                        <th className="pb-2 w-24">{t('common.quantity')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {selectedItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2">
                                                <div className="font-bold text-stone-800">{item.product_name}</div>
                                                <div className="text-xs text-stone-500">{item.product_sku}</div>
                                            </td>
                                            <td className="py-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border-stone-200 rounded text-center font-bold"
                                                    defaultValue={1}
                                                    onChange={(e) => {
                                                        const qty = parseInt(e.target.value) || 0;
                                                        setRestockQuantities(prev => ({ ...prev, [item.id]: qty }));
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRestockModal(false)}
                                className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleBulkRestock}
                                className="px-6 py-2 bg-cashmere-maroon text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                                {t('brandInventory.confirmOrder')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditOpen && editItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-stone-200">
                        <h2 className="text-xl font-serif font-bold text-cashmere-maroon mb-4">Edit Product Image</h2>
                        <p className="text-sm text-stone-600 mb-4">
                            Update image for <strong>{editItem.product_name}</strong> ({editItem.product_sku})
                        </p>

                        <div className="mb-4">
                            <div className="aspect-square bg-stone-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center relative">
                                {editImage ? (
                                    <img src={URL.createObjectURL(editImage)} className="w-full h-full object-cover" />
                                ) : editItem.product_image ? (
                                    <img src={editItem.product_image} className="w-full h-full object-cover opacity-50" />
                                ) : (
                                    <Box size={48} className="text-stone-300" />
                                )}
                            </div>
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
                                onClick={handleUpdateProduct}
                                className="px-6 py-2 bg-cashmere-maroon text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Label print area: off-screen so SVG barcode is always rendered with layout */}
            <div
                id="thermal-labels-print-area"
                aria-hidden="true"
                style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}
            >
                {labelProducts.map((item, idx) => (
                    <ProductLabel
                        key={idx}
                        product_name={item.product_name}
                        product_sku={item.product_sku}
                        product_barcode={item.product_barcode}
                        product_price={parseFloat(item.product_price)}
                        currency="LE"
                    />
                ))}
            </div>
        </div>
    );
}
