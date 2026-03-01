"use client";

import React, { useState, useEffect } from 'react';
import DataGrid from '@/components/DataGrid';
import { useLanguage } from '@/contexts/LanguageContext';
import { Truck, FileText, CheckSquare, Printer, Plus, Search, Archive } from 'lucide-react';
import Dialog from '@/components/Dialog';
import WaybillModal from '@/components/WaybillModal';

import { useAuth } from '@/contexts/AuthContext';

// ... (existing imports)

export default function ShippingPage() {
    const { t } = useLanguage();
    const { token } = useAuth(); // Get token
    const [activeTab, setActiveTab] = useState<'READY' | 'MANIFESTS' | 'RECONCILE'>('READY');
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWaybillModal, setShowWaybillModal] = useState(false);

    // Reconciliation State
    const [reconcileData, setReconcileData] = useState<{ [key: number]: { status: string, net_amount: string } }>({});

    // Fetch orders based on active tab
    useEffect(() => {
        if (!token) return;

        setSelectedIndices([]);
        fetchOrders();
    }, [activeTab, token]); // Added token dependency

    const fetchOrders = () => {
        if (!token) return;

        setLoading(true);
        // Different endpoints/filters based on tab
        let url = '`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/`api/brand/orders/';
        if (activeTab === 'READY') {
            // "Ready to Ship" means status is READY or PENDING_PRODUCTION (if ready) or just READY
            // Let's assume we filter by status=READY for now, or use detailed_status=READY_TO_SHIP if set
            url += '?status=READY';
        } else if (activeTab === 'RECONCILE') {
            url += '?detailed_status=SHIPPED'; // Only reconcile shipped orders
        }

        // For MANIFESTS we would fetch manifests endpoint.
        // Simplified for now.

        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setOrders(data);
                } else {
                    console.error("API returned non-array:", data);
                    setOrders([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleCreateManifest = () => {
        if (selectedIndices.length === 0) return alert("Select orders first");
        // Logic to create manifest
        alert(`Creating manifest for ${selectedIndices.length} orders...`);
    };

    const renderReadyTab = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={handleCreateManifest}
                        className="bg-cashmere-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800"
                    >
                        <FileText size={16} /> Create Manifest
                    </button>
                    <button
                        onClick={() => {
                            if (selectedIndices.length === 0) return alert("Select orders to print");
                            setShowWaybillModal(true);
                        }}
                        className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-50"
                    >
                        <Printer size={16} /> Print Waybills
                    </button>
                </div>
            </div>

            <DataGrid
                title="Ready for Shipping"
                data={orders}
                columns={[
                    { key: 'order_number', label: 'Order #', render: (row: any) => <span className="font-bold">{row.order_number}</span> },
                    { key: 'customer', label: 'Customer', render: (row: any) => row.customer_name || 'Guest' },
                    { key: 'location', label: 'Location', render: (row: any) => row.location_name || '-' },
                    { key: 'total_price', label: 'Total', render: (row: any) => `${row.total_price} LE` },
                    { key: 'status', label: 'Status', render: (row: any) => <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">{row.status}</span> },
                ]}
                loading={loading}
                selectable
                onSelectionChange={setSelectedIndices}
            />
        </div>
    );

    const handleReconcileSubmit = async () => {
        if (!token) return;

        const updates = Object.entries(reconcileData).map(([id, data]) => ({
            id: parseInt(id),
            status: data.status,
            net_amount: parseFloat(data.net_amount || '0')
        })).filter(u => u.status || u.net_amount > 0);

        if (updates.length === 0) return;

        if (!confirm(`Apply updates to ${updates.length} orders?`)) return;

        try {
            const res = await fetch('`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/`api/brand/orders/update_shipping_status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ updates })
            });
            if (res.ok) {
                alert("Reconciliation Complete!");
                fetchOrders();
                setReconcileData({});
            } else {
                alert("Failed to update status");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting updates");
        }
    };


    const renderReconcileTab = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bulk Reconciliation</h2>
                <button
                    onClick={handleReconcileSubmit}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700"
                >
                    Submit Updates
                </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="p-4 text-sm font-bold text-stone-600">Order #</th>
                            <th className="p-4 text-sm font-bold text-stone-600">Customer</th>
                            <th className="p-4 text-sm font-bold text-stone-600">Total Value</th>
                            <th className="p-4 text-sm font-bold text-stone-600">Current Status</th>
                            <th className="p-4 text-sm font-bold text-stone-600">New Status</th>
                            <th className="p-4 text-sm font-bold text-stone-600">Net Cash Received</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {orders.map(order => (
                            <tr key={order.order_number} className="hover:bg-stone-50">
                                <td className="p-4 font-mono font-bold">{order.order_number}</td>
                                <td className="p-4">{order.customer_name}</td>
                                <td className="p-4 font-bold">{order.total_price} LE</td>
                                <td className="p-4"><span className="text-xs bg-stone-100 px-2 py-1 rounded">{order.detailed_status || order.status}</span></td>
                                <td className="p-4">
                                    <select
                                        className="border border-stone-300 rounded p-2 text-sm w-full"
                                        onChange={(e) => setReconcileData(prev => ({
                                            ...prev,
                                            [order.id]: { ...prev[order.id], status: e.target.value }
                                        }))}
                                        value={reconcileData[order.id]?.status || ''}
                                    >
                                        <option value="">No Change</option>
                                        <option value="DELIVERED">Delivered (Paid)</option>
                                        <option value="RETURNED">Returned</option>
                                        <option value="REFUSED">Refused</option>
                                        <option value="PARTIAL_DELIVERY">Partial</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <input
                                        type="number"
                                        className="border border-stone-300 rounded p-2 text-sm w-32"
                                        placeholder="0.00"
                                        onChange={(e) => setReconcileData(prev => ({
                                            ...prev,
                                            [order.id]: { ...prev[order.id], net_amount: e.target.value }
                                        }))}
                                        value={reconcileData[order.id]?.net_amount || ''}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && <div className="p-8 text-center text-stone-400">No Orders to Reconcile</div>}
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-cashmere-maroon mb-2 flex items-center gap-3">
                    <Truck size={32} /> Shipping Integration
                </h1>
                <p className="text-stone-500">Manage shipments, manifests, and reconciliation.</p>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-stone-200 mb-8">
                <button
                    onClick={() => setActiveTab('READY')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'READY' ? 'border-cashmere-gold text-cashmere-black' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                    Ready to Ship
                </button>
                <button
                    onClick={() => setActiveTab('MANIFESTS')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'MANIFESTS' ? 'border-cashmere-gold text-cashmere-black' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                    Manifests History
                </button>
                <button
                    onClick={() => setActiveTab('RECONCILE')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'RECONCILE' ? 'border-cashmere-gold text-cashmere-black' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                    Reconciliation
                </button>
            </div>

            {activeTab === 'READY' && renderReadyTab()}
            {activeTab === 'MANIFESTS' && <div className="text-stone-400 text-center py-12">Manifest History Coming Soon</div>}
            {activeTab === 'RECONCILE' && renderReconcileTab()}

            <WaybillModal
                isOpen={showWaybillModal}
                onClose={() => setShowWaybillModal(false)}
                orders={selectedIndices.map(i => orders[i])}
            />
        </div>
    );
}
