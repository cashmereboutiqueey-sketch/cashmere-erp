"use client";

import React, { useState, useEffect } from 'react';
import { Tent, MapPin, Truck, ArrowRightLeft, Plus, PackageCheck } from 'lucide-react';
import Dialog from '@/components/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface Location {
    id: number;
    name: string;
    type: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    inventory?: { location: number, quantity: number }[];
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function EventsPage() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const [events, setEvents] = useState<Location[]>([]);
    const [warehouses, setWarehouses] = useState<Location[]>([]);
    const [showrooms, setShowrooms] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Event State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newEventName, setNewEventName] = useState('');

    // Transfer State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [transferSource, setTransferSource] = useState('');
    const [transferTarget, setTransferTarget] = useState('');
    const [transferQtys, setTransferQtys] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!token) return;
        const h = { 'Authorization': `Bearer ${token}` };

        Promise.all([
            fetch(`${API}/api/brand/locations/`, { headers: h }),
            fetch(`${API}/api/brand/products/?lite=true`, { headers: h }),
        ])
            .then(async ([locRes, prodRes]) => {
                const locData = locRes.ok ? await locRes.json() : [];
                const prodData = prodRes.ok ? await prodRes.json() : [];
                const locations = Array.isArray(locData) ? locData : (locData.results ?? []);
                const prods = Array.isArray(prodData) ? prodData : (prodData.results ?? []);
                setEvents(locations.filter((l: any) => l.type === 'EVENT'));
                setWarehouses(locations.filter((l: any) => l.type === 'WAREHOUSE'));
                setShowrooms(locations.filter((l: any) => l.type === 'SHOWROOM'));
                setProducts(prods);
            })
            .catch(err => console.error('Events page fetch error:', err))
            .finally(() => setLoading(false));
    }, [token]);

    const authHeader = { 'Authorization': `Bearer ${token}` };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${API}/api/brand/locations/`, { headers: authHeader });
            if (!res.ok) return;
            const data = await res.json();
            const locations = Array.isArray(data) ? data : (data.results ?? []);
            setEvents(locations.filter((l: any) => l.type === 'EVENT'));
            setWarehouses(locations.filter((l: any) => l.type === 'WAREHOUSE'));
            setShowrooms(locations.filter((l: any) => l.type === 'SHOWROOM'));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API}/api/brand/products/?lite=true`, { headers: authHeader });
            if (!res.ok) return;
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : (data.results ?? []));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEventName) return;
        try {
            const res = await fetch(`${API}/api/brand/locations/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: newEventName,
                    type: 'EVENT'
                })
            });
            if (res.ok) {
                setNewEventName('');
                setIsCreateOpen(false);
                fetchLocations();
            } else {
                alert("Failed to create event");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStockAt = (productId: number, locationId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product?.inventory) return 0;
        const item = product.inventory.find(i => i.location === locationId);
        return item ? item.quantity : 0;
    };

    const openTransfer = (source = '', target = '') => {
        setTransferSource(source);
        setTransferTarget(target);
        setTransferQtys({});
        setIsTransferOpen(true);
    };

    const sourceProducts = transferSource
        ? products.filter(p => getStockAt(p.id, parseInt(transferSource)) > 0)
        : [];

    const fillAll = () => {
        const filled: Record<number, string> = {};
        sourceProducts.forEach(p => {
            filled[p.id] = String(getStockAt(p.id, parseInt(transferSource)));
        });
        setTransferQtys(filled);
    };

    const handleTransfer = async () => {
        if (!transferSource || !transferTarget) {
            alert("Please select source and target locations");
            return;
        }
        const items = Object.entries(transferQtys)
            .map(([id, qty]) => ({ product: parseInt(id), quantity: parseInt(qty) }))
            .filter(i => i.quantity > 0);

        if (items.length === 0) {
            alert("Enter quantity for at least one product");
            return;
        }

        try {
            const res = await fetch(`${API}/api/brand/inventory/transfer/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ source_location: parseInt(transferSource), target_location: parseInt(transferTarget), items })
            });

            if (res.ok) {
                alert(`${items.length} item(s) transferred successfully!`);
                setIsTransferOpen(false);
                fetchProducts();
            } else {
                const err = await res.json();
                alert(`Transfer Failed: ${err.error || JSON.stringify(err)}`);
            }
        } catch (e) {
            alert("Transfer Error: Check console for details");
        }
    };

    const allLocations = [...showrooms, ...warehouses, ...events];

    if (loading) return <div className="p-8 text-center text-stone-500">{t('common.loading')}</div>;

    return (
        <div className="p-8">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-cashmere-maroon">{t('events.title')}</h1>
                    <p className="text-stone-500 mt-1">{t('events.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => openTransfer()}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <ArrowRightLeft size={16} /> {t('events.transferStock')}
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> {t('events.newEvent')}
                    </button>
                </div>
            </header>

            {/* Showrooms Section */}
            {showrooms.length > 0 && (
                <>
                    <h2 className="text-lg font-bold text-stone-700 mb-4 mt-2">{t('events.showrooms') || 'Showrooms'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {showrooms.map(showroom => (
                            <div key={showroom.id} className="bg-white p-6 rounded-xl shadow-sm border border-cashmere-maroon/20 group hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-cashmere-maroon/10 text-cashmere-maroon rounded-full">
                                        <MapPin size={24} />
                                    </div>
                                    <span className="px-2 py-1 bg-cashmere-maroon/10 text-cashmere-maroon text-xs font-bold rounded-full">SHOWROOM</span>
                                </div>
                                <h3 className="text-xl font-bold text-stone-800 mb-6">{showroom.name}</h3>
                                <div className="space-y-3 pt-4 border-t border-stone-100">
                                    <button
                                        onClick={() => openTransfer(showroom.id.toString(), '')}
                                        className="w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold rounded flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Truck size={14} /> {t('events.sendStock') || 'Send to Event'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Active Events Grid */}
            <h2 className="text-lg font-bold text-stone-700 mb-4">{t('events.activeEvents') || 'Active Events'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-stone-200 rounded-xl">
                        <Tent size={48} className="mx-auto text-stone-300 mb-4" />
                        <h3 className="text-lg font-bold text-stone-500">{t('events.noEvents')}</h3>
                        <p className="text-sm text-stone-400">{t('events.emptyDesc')}</p>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-cashmere-gold/10 text-cashmere-gold rounded-full">
                                    <Tent size={24} />
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">{t('events.active')}</span>
                            </div>

                            <h3 className="text-xl font-bold text-stone-800 mb-2">{event.name}</h3>
                            <div className="text-sm text-stone-500 flex items-center gap-1 mb-6">
                                <MapPin size={14} /> {t('events.location')}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-stone-100">
                                <button
                                    onClick={() => openTransfer((showrooms[0] ?? warehouses[0])?.id.toString() ?? '', event.id.toString())}
                                    className="w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold rounded flex items-center justify-center gap-2 text-sm"
                                >
                                    <Truck size={14} /> {t('events.sendStock')}
                                </button>
                                <button
                                    onClick={() => openTransfer(event.id.toString(), (showrooms[0] ?? warehouses[0])?.id.toString() ?? '')}
                                    className="w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold rounded flex items-center justify-center gap-2 text-sm"
                                >
                                    <ArrowRightLeft size={14} /> {t('events.returnStock')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Event Dialog */}
            <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('events.createDialog')}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('events.eventName')}</label>
                        <input
                            type="text"
                            className="w-full border-stone-200 rounded-lg"
                            placeholder="e.g. Summer Pop-up 2024"
                            value={newEventName}
                            onChange={e => setNewEventName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setIsCreateOpen(false)} className="text-stone-500 hover:text-stone-800 px-4 py-2 text-sm font-bold">{t('common.cancel')}</button>
                        <button onClick={handleCreateEvent} className="btn-primary">{t('events.newEvent')}</button>
                    </div>
                </div>
            </Dialog>

            {/* Bulk Transfer Stock Modal */}
            <Dialog isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Bulk Stock Transfer">
                <div className="space-y-4" style={{ minWidth: '560px' }}>
                    {/* From -> To */}
                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">{t('events.from')}</label>
                            <select
                                className="w-full bg-white border-stone-300 rounded text-sm"
                                value={transferSource}
                                onChange={e => { setTransferSource(e.target.value); setTransferQtys({}); }}
                            >
                                <option value="">Select Source...</option>
                                {allLocations.map(l => (
                                    <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                ))}
                            </select>
                        </div>
                        <ArrowRightLeft size={18} className="text-stone-400 mt-5 shrink-0" />
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">{t('events.to')}</label>
                            <select
                                className="w-full bg-white border-stone-300 rounded text-sm"
                                value={transferTarget}
                                onChange={e => setTransferTarget(e.target.value)}
                            >
                                <option value="">Select Target...</option>
                                {allLocations.map(l => (
                                    <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Product List */}
                    {transferSource ? (
                        sourceProducts.length === 0 ? (
                            <div className="text-center py-8 text-stone-400 text-sm">No stock available at this location</div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-stone-600">
                                        {sourceProducts.length} products available
                                        {Object.values(transferQtys).filter(q => parseInt(q) > 0).length > 0 && (
                                            <span className="ml-2 text-cashmere-maroon">
                                                · {Object.values(transferQtys).filter(q => parseInt(q) > 0).length} selected
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        onClick={fillAll}
                                        className="flex items-center gap-1 text-xs font-bold text-cashmere-maroon border border-cashmere-maroon/30 px-3 py-1.5 rounded hover:bg-cashmere-maroon/5"
                                    >
                                        <PackageCheck size={13} /> Fill All from Stock
                                    </button>
                                </div>
                                <div className="border border-stone-200 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-12 bg-stone-100 px-3 py-2 text-xs font-bold text-stone-500 uppercase">
                                        <div className="col-span-6">Product</div>
                                        <div className="col-span-3 text-center">Available</div>
                                        <div className="col-span-3 text-center">Transfer Qty</div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                                        {sourceProducts.map(p => {
                                            const available = getStockAt(p.id, parseInt(transferSource));
                                            const qty = transferQtys[p.id] ?? '';
                                            const isOver = parseInt(qty) > available;
                                            return (
                                                <div key={p.id} className={`grid grid-cols-12 px-3 py-2 items-center hover:bg-stone-50 ${parseInt(qty) > 0 ? 'bg-green-50' : ''}`}>
                                                    <div className="col-span-6">
                                                        <div className="text-sm font-medium text-stone-800 truncate">{p.name}</div>
                                                        <div className="text-xs text-stone-400">{p.sku}</div>
                                                    </div>
                                                    <div className="col-span-3 text-center text-sm font-bold text-stone-600">{available}</div>
                                                    <div className="col-span-3 flex justify-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={available}
                                                            placeholder="0"
                                                            value={qty}
                                                            onChange={e => setTransferQtys(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                            className={`w-16 text-center text-sm border rounded py-1 ${isOver ? 'border-red-400 bg-red-50' : 'border-stone-300'}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-8 text-stone-400 text-sm">Select a source location to see available stock</div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                        <span className="text-xs text-stone-400">
                            {Object.values(transferQtys).reduce((sum, q) => sum + (parseInt(q) || 0), 0)} total units to transfer
                        </span>
                        <div className="flex gap-3">
                            <button onClick={() => setIsTransferOpen(false)} className="text-stone-500 hover:text-stone-800 px-4 py-2 text-sm font-bold">{t('common.cancel')}</button>
                            <button onClick={handleTransfer} className="btn-primary">{t('common.confirm')}</button>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
