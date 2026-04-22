"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Truck, CheckCircle, Clock, AlertCircle, Box, X } from 'lucide-react';
import DataGrid from '@/components/DataGrid';
import { useLanguage } from '@/contexts/LanguageContext';
import Dialog from '@/components/Dialog';
import { useAuth } from '@/contexts/AuthContext';

export default function OrdersPage() {
    const { t } = useLanguage();
    const { token } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    // Fulfillment Dialog State
    const [isFulfillOpen, setIsFulfillOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [shippingCompany, setShippingCompany] = useState('BOSTA');

    useEffect(() => {
        if (token) fetchOrders();
    }, [token]);

    const fetchOrders = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/orders/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openFulfillDialog = (order: any) => {
        setSelectedOrder(order);
        setShippingCompany('BOSTA'); // Default
        setIsFulfillOpen(true);
    };

    const handleFulfillConfirm = async () => {
        if (!selectedOrder) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/orders/${selectedOrder.id}/fulfill/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ shipping_company: shippingCompany })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Success: ${data.message || 'Order Fulfilled'}`);
                setOrders(prev => prev.map((o: any) => o.id === selectedOrder.id ? { ...o, status: 'FULFILLED', shipping_company: shippingCompany } : o));
                setIsFulfillOpen(false);
                setSelectedOrder(null);
            } else {
                const errData = await res.json();
                alert(`Failed to fulfill order: ${errData.error || JSON.stringify(errData)}`);
            }
        } catch (e) {
            console.error(e);
            alert('Network error occurred while fulfilling order.');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            PENDING: "bg-amber-100 text-amber-800 border-amber-200",
            PENDING_PRODUCTION: "bg-purple-100 text-purple-800 border-purple-200",
            READY: "bg-indigo-100 text-indigo-800 border-indigo-200",
            PAID: "bg-blue-100 text-blue-800 border-blue-200",
            FULFILLED: "bg-green-100 text-green-800 border-green-200",
            CANCELLED: "bg-red-100 text-red-800 border-red-200",
        };
        // @ts-ignore
        const style = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${style} inline-flex items-center gap-1`}>
                {status === 'PENDING' && <Clock size={10} />}
                {status === 'PENDING_PRODUCTION' && <AlertCircle size={10} />}
                {status === 'READY' && <Box size={10} />}
                {status === 'FULFILLED' && <CheckCircle size={10} />}
                {status.replace('_', ' ')}
            </span>
        );
    };

    const filteredOrders = orders.filter((order: any) => {
        const matchesSearch =
            order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
            order.customer_name?.toLowerCase().includes(search.toLowerCase());

        if (statusFilter === 'ALL') return matchesSearch;

        // Custom Logic for "Undelivered"
        if (statusFilter === 'UNDELIVERED') {
            return matchesSearch && order.status !== 'FULFILLED' && order.status !== 'CANCELLED';
        }

        return matchesSearch && order.status === statusFilter;
    });

    const columns = [
        {
            key: "order_number",
            label: t('orders.orderNumber'),
            render: (row: any) => <span className="font-mono text-xs font-bold">{row.order_number}</span>
        },
        {
            key: "created_at",
            label: t('common.date'),
            render: (row: any) => <span className="text-stone-500 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>
        },
        {
            key: "customer",
            label: t('orders.customer'),
            render: (row: any) => (
                <div>
                    <div className="font-bold text-stone-800">{row.customer_name || 'Guest'}</div>
                    <div className="text-xs text-stone-400">{row.customer_phone || '-'}</div>
                </div>
            )
        },
        {
            key: "total_price",
            label: t('common.total'),
            render: (row: any) => (
                <span className="font-serif font-bold text-cashmere-maroon">
                    {row.total_price ? `${parseFloat(row.total_price).toLocaleString()} EGP` : '---'}
                </span>
            )
        },
        {
            key: "status",
            label: t('common.status'),
            render: (row: any) => <StatusBadge status={row.status} />
        },
        {
            key: "actions",
            label: t('common.actions'),
            render: (row: any) => (
                <div className="flex gap-2">
                    {row.status === 'READY' && (
                        <button
                            onClick={() => openFulfillDialog(row)}
                            className="bg-cashmere-black text-white text-xs px-2 py-1 rounded flex items-center gap-1 hover:bg-stone-800"
                            title="Mark as Shipped"
                        >
                            <Truck size={12} /> Ship
                        </button>
                    )}
                    <button className="text-stone-400 hover:text-cashmere-black transition-colors">
                        <Eye size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 w-full space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-cashmere-black">{t('orders.title')}</h1>
                    <p className="text-stone-500">{t('orders.trackOrders')}</p>
                </div>
                <div className="flex gap-2">
                    {/* Metrics could go here */}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex gap-4 items-center">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder={t('orders.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border-none rounded-lg text-sm focus:ring-2 ring-cashmere-gold/20 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
                </div>

                <div className="flex bg-stone-100 p-1 rounded-lg">
                    {[
                        { label: t('orders.all'), value: 'ALL' },
                        { label: t('orders.undelivered'), value: 'UNDELIVERED' },
                        { label: 'Ready to Ship', value: 'READY' },
                        { label: t('orders.fulfilled'), value: 'FULFILLED' }
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${statusFilter === tab.value
                                ? 'bg-white shadow text-cashmere-black'
                                : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <DataGrid
                title={t('orders.management')}
                columns={columns}
                data={filteredOrders}
            />

            {/* Fulfillment Dialog */}
            <Dialog
                isOpen={isFulfillOpen}
                onClose={() => setIsFulfillOpen(false)}
                title={`Fulfill Order #${selectedOrder?.order_number}`}
            >
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800 text-sm">
                        Select the shipping company responsible for delivering this order.
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Shipping Company</label>
                        <select
                            className="w-full border-stone-200 rounded-lg p-2.5"
                            value={shippingCompany}
                            onChange={(e) => setShippingCompany(e.target.value)}
                        >
                            <option value="BOSTA">Bosta</option>
                            <option value="ARAMEX">Aramex</option>
                            <option value="MYLERZ">Mylerz</option>
                            <option value="MANUAL">Private Representative (Manual)</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={() => setIsFulfillOpen(false)}
                            className="px-4 py-2 rounded-lg text-stone-500 hover:bg-stone-100 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleFulfillConfirm}
                            className="px-6 py-2 rounded-lg bg-cashmere-black text-white font-bold hover:bg-stone-800 flex items-center gap-2"
                        >
                            <Truck size={16} /> Confirm & Ship
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
