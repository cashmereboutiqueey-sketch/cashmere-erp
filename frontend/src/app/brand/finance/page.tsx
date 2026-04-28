"use client";

import React, { useState, useEffect } from 'react';
import {
    DollarSign, ArrowRightLeft, TrendingUp, TrendingDown,
    Wallet, Building2, Calendar, Filter, BarChart3, Truck
} from 'lucide-react';
import DataGrid from '@/components/DataGrid';
import KPICard from '@/components/KPICard';
import Dialog from '@/components/Dialog';
import MetricsGrid, { MetricItem } from '@/components/MetricsGrid';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface Treasury {
    id: number;
    name: string;
    type: string;
    balance: string;
}

export default function BrandFinancePage() {
    const { t } = useLanguage();
    const { token } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [transactions, setTransactions] = useState<any[]>([]);
    const [treasuries, setTreasuries] = useState<{ daily: Treasury | null, main: Treasury | null }>({ daily: null, main: null });
    const [metrics, setMetrics] = useState<MetricItem[]>([]);
    const [shippingStats, setShippingStats] = useState<any[]>([]); // New State
    const [loading, setLoading] = useState(true);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferAmount, setTransferAmount] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'Rent',
        type: 'EXPENSE',
        reference_id: ''
    });

    const fetchData = async () => {
        if (!token) return;
        const authHeader = { 'Authorization': `Bearer ${token}` };
        try {
            const [txRes, trRes, metricsRes, analyticsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/transactions/?module=BRAND`, { headers: authHeader }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/treasury/`, { headers: authHeader }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/metrics/brand/`, { headers: authHeader }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/analytics/dashboard/`, { headers: authHeader }),
            ]);

            const txData = txRes.ok ? await txRes.json() : [];
            const trData = trRes.ok ? await trRes.json() : [];
            const metricsData = metricsRes.ok ? await metricsRes.json() : [];
            const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

            const txList = Array.isArray(txData) ? txData : (txData.results || []);
            setTransactions(txList);
            const treasuryList = Array.isArray(trData) ? trData : (trData.results || []);
            setTreasuries({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                daily: treasuryList.find((t: any) => t.type === 'DAILY') ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                main: treasuryList.find((t: any) => t.type === 'MAIN') ?? null,
            });
            const metricsList = Array.isArray(metricsData) ? metricsData : (metricsData.results || []);
            setMetrics(metricsList);

            if (analyticsData?.charts?.shipping_stats) {
                setShippingStats(analyticsData.charts.shipping_stats);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleTransfer = async () => {
        const amount = parseFloat(transferAmount);
        if (!transferAmount || isNaN(amount) || amount <= 0) {
            return alert(t('finance.alerts.invalidAmount') || 'Enter a valid amount');
        }
        const available = treasuries.daily ? parseFloat(treasuries.daily.balance) : 0;
        if (amount > available) {
            return alert(t('finance.alerts.insufficientFunds') || `Insufficient funds. Available: ${available.toLocaleString()} EGP`);
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/treasury/transfer_to_main/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: transferAmount })
            });
            if (res.ok) {
                setIsTransferOpen(false);
                setTransferAmount('');
                fetchData();
                alert(t('common.save') + "!"); // Generic success
            } else {
                alert(t('finance.alerts.transferFailed'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetTreasury = treasuries.daily?.id;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/transactions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    module: 'BRAND',
                    type: formData.type,
                    amount: formData.amount,
                    description: formData.description,
                    category: formData.category,
                    treasury: targetTreasury,
                    reference_id: formData.reference_id || `TX-${Date.now()}`
                })
            });

            if (res.ok) {
                setFormData({ ...formData, amount: '', description: '', reference_id: '' });
                fetchData();
            } else {
                alert("Failed to record transaction");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const columns = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { key: 'date', label: t('finance.date'), render: (row: any) => new Date(row.created_at).toLocaleDateString() },
        {
            key: 'type',
            label: t('finance.type'),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (row: any) => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${row.type === 'SALE' ? 'bg-emerald-100 text-emerald-800' :
                    row.type === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {row.type === 'SALE' ? t('finance.types.sale') :
                        row.type === 'EXPENSE' ? t('finance.types.expense') :
                            t('finance.types.transfer')}
                </span>
            )
        },
        { key: 'category', label: t('finance.category') },
        { key: 'description', label: t('finance.description') },
        {
            key: 'amount',
            label: t('finance.amount'),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (row: any) => {
                const isDebit = ['EXPENSE', 'TRANSFER'].includes(row.type);
                return (
                    <span className={`font-mono font-bold ${isDebit ? 'text-red-700' : 'text-emerald-700'}`}>
                        {isDebit ? '-' : '+'}{parseFloat(row.amount).toLocaleString()} EGP
                    </span>
                );
            }
        }
    ];

    if (loading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif text-cashmere-black">{t('finance.title')}</h1>
                <button
                    onClick={() => setIsTransferOpen(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
                >
                    <ArrowRightLeft size={18} />
                    {t('finance.transfer')}
                </button>
            </div>

            {/* Treasury & Asset Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-sm font-semibold uppercase tracking-wider">{t('finance.dailyDrawer')}</p>
                        <h2 className="text-4xl font-serif text-stone-800 mt-2">
                            {treasuries.daily ? parseFloat(treasuries.daily.balance).toLocaleString() : '0.00'} <span className="text-lg text-stone-400">EGP</span>
                        </h2>
                    </div>
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                        <Wallet size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-sm font-semibold uppercase tracking-wider">{t('finance.mainSafe')}</p>
                        <h2 className="text-4xl font-serif text-stone-800 mt-2">
                            {treasuries.main ? parseFloat(treasuries.main.balance).toLocaleString() : '0.00'} <span className="text-lg text-stone-400">EGP</span>
                        </h2>
                    </div>
                    <div className="p-4 bg-stone-100 text-stone-600 rounded-full">
                        <Building2 size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-sm font-semibold uppercase tracking-wider">{t('finance.inventoryValue')}</p>
                        <h2 className="text-4xl font-serif text-cashmere-maroon mt-2">
                            {/* @ts-ignore */}
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {metrics.find((m: any) => m.title === 'Inventory Value')?.value || "0.00"}
                        </h2>
                    </div>
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                        <BarChart3 size={32} />
                    </div>
                </div>
            </div>

            {/* Business Intelligence & Shipping Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-stone-50 p-6 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white rounded border border-stone-200 text-cashmere-gold">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-stone-800">{t('finance.bi')}</h2>
                            <p className="text-sm text-stone-500">{t('finance.biDesc')}</p>
                        </div>
                    </div>
                    <MetricsGrid metrics={metrics} />
                </div>

                {/* Shipping / Logistics Widget */}
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 className="text-xl font-serif font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <Truck size={20} className="text-stone-400" /> Shipping & Logistics
                    </h2>
                    <div className="space-y-4">
                        {shippingStats.length > 0 ? shippingStats.map((stat, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0">
                                <div>
                                    <div className="font-bold text-stone-800 text-sm">{stat.name === 'PENDING' ? 'Pending (No Courier)' : stat.name}</div>
                                    <div className="text-xs text-stone-500">{stat.count} Orders</div>
                                </div>
                                <div className="font-mono font-bold text-sm text-stone-700">
                                    {(parseFloat(stat.value) || 0).toLocaleString()} EGP
                                </div>
                            </div>
                        )) : (
                            <p className="text-stone-400 italic text-sm text-center py-4">No fulfilled orders yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-stone-200 h-fit sticky top-8">
                    <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                        <TrendingDown size={20} className="text-red-600" /> {t('finance.recordExpense')}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.type')}</label>
                            <select
                                className="w-full border-stone-200 rounded-lg"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="EXPENSE">{t('finance.types.expense')}</option>
                                <option value="SALE">{t('finance.types.sale')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.category')}</label>
                            <select
                                className="w-full border-stone-200 rounded-lg"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option>Rent</option>
                                <option>Salaries</option>
                                <option>Utilities</option>
                                <option>Marketing</option>
                                <option>Maintenance</option>
                                <option>Petty Cash</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.amount')}</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg font-mono text-lg"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.description')}</label>
                            <textarea
                                className="w-full border-stone-200 rounded-lg"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full btn-primary py-3 justify-center">
                            {t('finance.saveTx')}
                        </button>
                    </form>
                </div>

                {/* Ledger */}
                <div className="lg:col-span-2">
                    <DataGrid
                        title={t('finance.recentExpenses')}
                        columns={columns}
                        data={transactions}
                    />
                </div>
            </div>

            {/* Transfer Dialog */}
            <Dialog
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                title={t('finance.transferDialog')}
            >
                <div className="space-y-6">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
                        {t('finance.transferWarning')}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.amount')}</label>
                        <input
                            type="number"
                            autoFocus
                            className="w-full border-stone-200 rounded-lg font-mono text-2xl text-stone-800"
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={e => setTransferAmount(e.target.value)}
                        />
                        <p className="text-right text-xs text-stone-400 mt-1">
                            {t('finance.available')}: {treasuries.daily ? parseFloat(treasuries.daily.balance).toLocaleString() : '0.00'} EGP
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsTransferOpen(false)} className="px-4 py-2 rounded-lg text-stone-500 hover:bg-stone-100">{t('common.cancel')}</button>
                        <button onClick={handleTransfer} className="px-6 py-2 rounded-lg bg-stone-800 text-white font-bold hover:bg-stone-900">
                            {t('finance.confirmTransfer')}
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
