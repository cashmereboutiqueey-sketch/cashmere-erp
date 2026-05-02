'use client';

import React, { useState, useEffect } from 'react';
import {
    DollarSign, ArrowRightLeft, TrendingUp, TrendingDown,
    Wallet, Building2, Calendar, Filter, Activity
} from 'lucide-react';
import DataGrid from '@/components/DataGrid';
import KPICard from '@/components/KPICard';
import MetricsGrid, { MetricItem } from '@/components/MetricsGrid';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';

interface Treasury {
    id: number;
    name: string;
    type: string;
    balance: string;
}

export default function FactoryFinancePage() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [treasuries, setTreasuries] = useState<{ daily: Treasury | null, main: Treasury | null }>({ daily: null, main: null });
    const [metrics, setMetrics] = useState<MetricItem[]>([]);
    const [intercompany, setIntercompany] = useState<{ total_produced_value: number, total_settled: number, brand_owes_factory: number } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'Maintenance',
        type: 'EXPENSE',
        reference_id: ''
    });

    const fetchData = async () => {
        if (!token) return;
        try {
            const authHeader = { 'Authorization': `Bearer ${token}` };
            const [txRes, trRes, metricsRes, icRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/transactions/?module=FACTORY`, { headers: authHeader }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/treasury/`, { headers: authHeader }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/metrics/factory/`, { headers: authHeader }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/metrics/intercompany_summary/`, { headers: authHeader }),
            ]);

            const txData = await txRes.json();
            const trData = await trRes.json();
            const metricsData = await metricsRes.json();
            const icData = icRes.ok ? await icRes.json() : null;

            const txList = Array.isArray(txData) ? txData : (txData.results || []);
            const allTreasuries = Array.isArray(trData) ? trData : (trData.results || []);
            const metricsList = Array.isArray(metricsData) ? metricsData : (metricsData.results || metricsData);

            setTransactions(txList);
            // Show factory/shared treasuries; fallback to all if no module distinction yet
            const factoryTreasuries = allTreasuries.filter((t: any) => t.module === 'FACTORY' || t.module === 'SHARED');
            const displayList = factoryTreasuries.length > 0 ? factoryTreasuries : allTreasuries;
            setTreasuries({
                daily: displayList.find((t: any) => t.type === 'DAILY') ?? null,
                main: displayList.find((t: any) => t.type === 'MAIN') ?? null,
            });
            setMetrics(metricsList);
            if (icData) setIntercompany(icData);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Factory expenses usually come from Main Treasury
            const targetTreasury = treasuries.main?.id;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/transactions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    module: 'FACTORY',
                    type: formData.type,
                    amount: formData.amount,
                    description: formData.description,
                    category: formData.category,
                    treasury: targetTreasury,
                    reference_id: formData.reference_id || `FAC-${Date.now()}`
                })
            });

            if (res.ok) {
                setFormData({ ...formData, amount: '', description: '', reference_id: '' });
                fetchData();
            } else {
                toast.error("Failed to record transaction");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const columns = [
        { key: 'date', label: t('finance.date'), render: (row: any) => new Date(row.created_at).toLocaleDateString() },
        {
            key: 'type',
            label: t('finance.type'),
            render: (row: any) => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${row.type === 'SALE' ? 'bg-emerald-100 text-emerald-800' :
                    row.type === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {row.type === 'EXPENSE' ? t('finance.types.expense') : row.type === 'SALE' ? t('finance.types.sale') : row.type}
                </span>
            )
        },
        { key: 'category', label: t('finance.category') },
        { key: 'description', label: t('finance.description') },
        {
            key: 'amount',
            label: t('finance.amount'),
            render: (row: any) => (
                <span className={`font-mono font-bold ${['EXPENSE', 'TRANSFER'].includes(row.type) && row.amount > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}>
                    {parseFloat(row.amount).toLocaleString()} {t('common.currency') || 'EGP'}
                </span>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-serif text-cashmere-black">{t('factoryFinance.title')}</h1>

            {/* Treasury Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-sm font-semibold uppercase tracking-wider">{t('factoryFinance.mainSafeBalance')}</p>
                        <h2 className="text-4xl font-serif text-stone-800 mt-2">
                            {treasuries.main ? parseFloat(treasuries.main.balance).toLocaleString() : '0.00'} <span className="text-lg text-stone-400">{t('common.currency') || 'EGP'}</span>
                        </h2>
                    </div>
                    <div className="p-4 bg-stone-100 text-stone-600 rounded-full">
                        <Building2 size={32} />
                    </div>
                </div>

                {/* Inter-Company Receivable from Brand */}
                {intercompany && (
                    <div className={`p-6 rounded-xl border-2 flex items-center justify-between ${intercompany.brand_owes_factory > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                        <div>
                            <p className="text-stone-500 text-sm font-semibold uppercase tracking-wider">Due from Brand</p>
                            <h2 className={`text-4xl font-serif mt-2 ${intercompany.brand_owes_factory > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {intercompany.brand_owes_factory.toLocaleString()} <span className="text-lg font-sans text-stone-400">EGP</span>
                            </h2>
                            <p className="text-xs text-stone-400 mt-1">
                                {intercompany.total_settled.toLocaleString()} EGP received · {intercompany.total_produced_value.toLocaleString()} EGP produced
                            </p>
                        </div>
                        <div className={`p-4 rounded-full ${intercompany.brand_owes_factory > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <TrendingUp size={32} />
                        </div>
                    </div>
                )}
            </div>

            {/* Business Intelligence */}
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white rounded border border-stone-200 text-cashmere-gold">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif font-bold text-stone-800">{t('factoryFinance.operationalIntel')}</h2>
                        <p className="text-sm text-stone-500">{t('factoryFinance.efficiencyMetrics')}</p>
                    </div>
                </div>
                <MetricsGrid metrics={metrics} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-stone-200 h-fit sticky top-8">
                    <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                        <TrendingDown size={20} className="text-red-600" /> {t('factoryFinance.recordCost')}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.type')}</label>
                            <select
                                className="w-full border-stone-200 rounded-lg"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="EXPENSE">{t('factoryFinance.expenseCost')}</option>
                                <option value="SALE">{t('factoryFinance.recoveryIncome')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.category')}</label>
                            <select
                                className="w-full border-stone-200 rounded-lg"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Raw Materials">{t('factoryFinance.rawMaterials')}</option>
                                <option value="Labor Wages">{t('factoryFinance.wages')}</option>
                                <option value="Maintenance">{t('factoryFinance.maintenance')}</option>
                                <option value="Electricity">{t('factoryFinance.electricity')}</option>
                                <option value="Transport">{t('factoryFinance.transport')}</option>
                                <option value="Other">{t('common.other')}</option>
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
                            {t('factoryFinance.saveRecord')}
                        </button>
                    </form>
                </div>

                {/* Ledger */}
                <div className="lg:col-span-2">
                    <DataGrid
                        title={t('factoryFinance.ledger')}
                        columns={columns}
                        data={transactions}
                    />
                </div>
            </div>
        </div>
    );
}
