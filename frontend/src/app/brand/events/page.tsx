"use client";

import React, { useState, useEffect } from 'react';
import { Tent, MapPin, Truck, Box, ArrowRightLeft, Plus } from 'lucide-react';
import Dialog from '@/components/Dialog';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

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

export default function EventsPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [events, setEvents] = useState<Location[]>([]);
    const [warehouses, setWarehouses] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Event State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newEventName, setNewEventName] = useState('');

    // Transfer State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [transferData, setTransferData] = useState({
        source: '',
        target: '',
        product: '',
        quantity: ''
    });

    useEffect(() => {
        fetchLocations();
        fetchProducts();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/brand/locations/');
            const data = await res.json();
            setEvents(data.filter((l: any) => l.type === 'EVENT'));
            setWarehouses(data.filter((l: any) => l.type === 'WAREHOUSE'));
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/brand/products/');
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEventName) return;
        try {
            const res = await fetch('http://localhost:8000/api/brand/locations/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    const handleTransfer = async () => {
        // Logging for Debugging
        console.log("Starting Transfer...", transferData);

        if (!transferData.source || !transferData.target || !transferData.product || !transferData.quantity) {
            alert("All fields are required");
            return;
        }

        try {
            const payload = {
                source_location: parseInt(transferData.source),
                target_location: parseInt(transferData.target),
                items: [
                    { product: parseInt(transferData.product), quantity: parseInt(transferData.quantity) }
                ]
            };
            console.log("Sending Payload:", payload);

            const res = await fetch('http://localhost:8000/api/brand/inventory/transfer/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Stock Transferred Successfully!");
                setIsTransferOpen(false);
                setTransferData({ source: '', target: '', product: '', quantity: '' });
                fetchProducts();
            } else {
                const err = await res.json();
                console.error("Server Error:", err);
                alert(`Transfer Failed: ${err.error || JSON.stringify(err)}`);
            }
        } catch (e) {
            console.error("Network Error:", e);
            alert("Transfer Error: Check console for details");
        }
    };

    const getStockAt = (productId: number, locationId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product?.inventory) return 0;
        const item = product.inventory.find(i => i.location === locationId);
        return item ? item.quantity : 0;
    };

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
                        onClick={() => setIsTransferOpen(true)}
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

            {/* Active Events Grid */}
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
                                    onClick={() => {
                                        setTransferData({ ...transferData, target: event.id.toString(), source: warehouses[0]?.id.toString() });
                                        setIsTransferOpen(true);
                                    }}
                                    className="w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold rounded flex items-center justify-center gap-2 text-sm"
                                >
                                    <Truck size={14} /> {t('events.sendStock')}
                                </button>
                                <button
                                    onClick={() => {
                                        // Quick Return Logic pre-fill
                                        setTransferData({ ...transferData, source: event.id.toString(), target: warehouses[0]?.id.toString() });
                                        setIsTransferOpen(true);
                                    }}
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

            {/* Transfer Stock Modal */}
            <Dialog isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title={t('events.transferDialog')}>
                <div className="space-y-6">
                    {/* From -> To */}
                    <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-lg border border-stone-200">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">{t('events.from')}</label>
                            <select
                                className="w-full bg-white border-stone-300 rounded text-sm"
                                value={transferData.source}
                                onChange={e => setTransferData({ ...transferData, source: e.target.value })}
                            >
                                <option value="">Select Source...</option>
                                {[...warehouses, ...events].map(l => (
                                    <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                ))}
                            </select>
                        </div>
                        <ArrowRightLeft size={20} className="text-stone-400 mt-4" />
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">{t('events.to')}</label>
                            <select
                                className="w-full bg-white border-stone-300 rounded text-sm"
                                value={transferData.target}
                                onChange={e => setTransferData({ ...transferData, target: e.target.value })}
                            >
                                <option value="">Select Target...</option>
                                {[...warehouses, ...events].map(l => (
                                    <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('products.product')}</label>
                        <select
                            className="w-full border-stone-200 rounded-lg"
                            value={transferData.product}
                            onChange={e => setTransferData({ ...transferData, product: e.target.value })}
                        >
                            <option value="">Select Product...</option>
                            {products.map(p => {
                                const stock = transferData.source ? getStockAt(p.id, parseInt(transferData.source)) : 0;
                                return (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.sku}) - {transferData.source ? `${stock} Available` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('common.quantity')}</label>
                        <input
                            type="number"
                            className="w-full border-stone-200 rounded-lg"
                            value={transferData.quantity}
                            onChange={e => setTransferData({ ...transferData, quantity: e.target.value })}
                            min="1"
                        />
                        {transferData.product && transferData.source && (
                            <p className="text-xs text-stone-400 mt-1">
                                {t('events.maxAvailable')}: {getStockAt(parseInt(transferData.product), parseInt(transferData.source))}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                        <button onClick={() => setIsTransferOpen(false)} className="text-stone-500 hover:text-stone-800 px-4 py-2 text-sm font-bold">{t('common.cancel')}</button>
                        <button onClick={handleTransfer} className="btn-primary">{t('common.confirm')}</button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
