import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, Calendar, MapPin, Tag, ShoppingBag, Clock, MessageCircle, Send } from 'lucide-react';
import Dialog from './Dialog';
import type { Customer } from '@/types';

interface Interaction {
    id: number;
    type: string;
    notes: string;
    staff_member: string;
    date: string;
}

interface LocalOrder {
    id: number;
    customer: number | null;
    order_number: string;
    total_price: number | null;
    created_at: string;
    status: string;
    items: { product_name?: string; quantity: number; unit_price?: number }[];
}

interface ClientProfileModalProps {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function ClientProfileModal({ customer, isOpen, onClose, onUpdate }: ClientProfileModalProps) {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [orders, setOrders] = useState<LocalOrder[]>([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            fetchDetails();
        }
    }, [customer, isOpen]);

    const fetchDetails = async () => {
        if (!customer) return;
        setLoading(true);
        try {
            // Fetch Interactions
            const intRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/interactions/?customer=${customer.id}`);
            const intData = await intRes.json();
            setInteractions(intData);

            // Fetch Orders (Filtered by customer)
            // Ideally we need an endpoint or filter. Assuming /orders/?customer=ID works or we filter client side for MVP?
            // Let's assume we fetch all orders for this customer if backend supports filtering by customer ID on OrderViewSet
            // If OrderViewSet is standard ModelViewSet, filter_fields need to be set. 
            // I'll try filtering, if not I might get all. 
            // Safer: Update backend to support filtering. But for now let's try.
            // Actually, best to just render what we have.
            const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/orders/`);
            const orderData = await orderRes.json();
            // Client-side filter for now as I didn't add filter backend (yet)
            const allOrders: LocalOrder[] = Array.isArray(orderData) ? orderData : (orderData.results || []);
            const myOrders = allOrders.filter(o => o.customer === customer.id);
            setOrders(myOrders);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!note.trim() || !customer) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/interactions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: customer.id,
                    type: 'OTHER', // Default for quick note
                    notes: note,
                    staff_member: 'Staff' // Placeholder, ideally from Auth
                })
            });
            setNote('');
            fetchDetails();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen || !customer) return null;

    const tierColors: Record<string, string> = {
        'STANDARD': 'bg-stone-100 text-stone-600',
        'VIP': 'bg-purple-100 text-purple-700',
        'VVIP': 'bg-rose-100 text-rose-700',
        'ELITE': 'bg-amber-100 text-amber-700 border-amber-200'
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-5xl bg-stone-50 h-full shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-right duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-stone-200 rounded-full z-10">
                    <X size={20} />
                </button>

                {/* Left Column: Vital Stats */}
                <div className="w-full md:w-1/3 bg-white p-8 border-r border-stone-200 overflow-y-auto">
                    <div className="text-center mb-8">
                        <div className="w-32 h-32 bg-stone-200 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-stone-400">
                            {customer.name.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-stone-900">{customer.name}</h2>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${tierColors[customer.tier] || tierColors['STANDARD']}`}>
                            {customer.tier} Client
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase text-stone-400">Contact</h3>
                            <div className="flex items-center gap-3 text-sm text-stone-600">
                                <Phone size={16} /> {customer.phone}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-stone-600">
                                <Mail size={16} /> {customer.email || 'No email'}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-stone-600">
                                <Calendar size={16} /> DOB: {customer.birth_date || 'N/A'}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-stone-100">
                            <h3 className="text-xs font-bold uppercase text-stone-400 mb-3">Sizing Profile</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(customer.sizing_profile || {}).map(([k, v]) => (
                                    <div key={k} className="bg-stone-100 p-2 rounded text-center">
                                        <div className="text-xs text-stone-500 uppercase">{k}</div>
                                        <div className="font-bold text-stone-800">{v}</div>
                                    </div>
                                ))}
                                {Object.keys(customer.sizing_profile || {}).length === 0 && (
                                    <p className="col-span-3 text-sm text-stone-400 italic">No sizing data</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-stone-100">
                            <h3 className="text-xs font-bold uppercase text-stone-400 mb-3">Style Notes</h3>
                            <div className="flex flex-wrap gap-2">
                                {(customer.style_preferences || '').split(',').filter(Boolean).map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-100">
                                        {tag.trim()}
                                    </span>
                                ))}
                                {!customer.style_preferences && <p className="text-sm text-stone-400 italic">No preferences logged</p>}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-stone-100">
                            <h3 className="text-xs font-bold uppercase text-stone-400 mb-3">Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-stone-500">Total Spent</div>
                                    <div className="text-xl font-serif text-stone-800">{Number(customer.total_spent).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-stone-500">LTV Score</div>
                                    <div className="text-xl font-serif text-stone-800">{Number(customer.ltv_score).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Visual Wardrobe / History */}
                <div className="w-full md:w-1/3 bg-stone-50 p-8 border-r border-stone-200 overflow-y-auto">
                    <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                        <ShoppingBag size={20} /> Purchase History
                    </h3>

                    <div className="space-y-4">
                        {loading && <p>Loading history...</p>}
                        {!loading && orders.length === 0 && (
                            <div className="text-center py-10 text-stone-400">
                                <ShoppingBag size={48} className="mx-auto mb-2 opacity-50" />
                                <p>No purchases yet.</p>
                            </div>
                        )}
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-stone-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-stone-800">#{order.order_number}</div>
                                        <div className="text-xs text-stone-500">{new Date(order.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="font-mono text-stone-600">{Number(order.total_price ?? 0).toLocaleString()}</div>
                                </div>
                                {/* Items Preview */}
                                <div className="space-y-1 mt-2">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm text-stone-600">
                                            <span>{item.quantity}x {item.product ? `Product #${item.product}` : 'Item'}</span> {/* Ideally resolve Product Name */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Interaction Log (The Notebook) */}
                <div className="w-full md:w-1/3 bg-white p-8 overflow-y-auto flex flex-col">
                    <h3 className="text-lg font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                        <MessageCircle size={20} /> The Notebook
                    </h3>

                    <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                        {!loading && interactions.length === 0 && (
                            <div className="text-center py-10 text-stone-400">
                                <p>No interactions logged.</p>
                            </div>
                        )}
                        {interactions.map(int => (
                            <div key={int.id} className="flex gap-3">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-stone-300 ring-4 ring-stone-100" />
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-sm text-stone-700">{int.type}</span>
                                        <span className="text-xs text-stone-400">{new Date(int.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-stone-600 mt-1">{int.notes}</p>
                                    <p className="text-xs text-stone-300 mt-1">by {int.staff_member}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-stone-100">
                        <div className="relative">
                            <textarea
                                className="w-full border-stone-200 rounded-lg pr-12 text-sm focus:ring-cashmere-gold focus:border-cashmere-gold"
                                rows={3}
                                placeholder="Add a note, call log, or observation..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!note.trim()}
                                className="absolute bottom-2 right-2 p-2 bg-stone-800 text-white rounded-md hover:bg-stone-900 disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
