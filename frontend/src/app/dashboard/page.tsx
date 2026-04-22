"use client";

import React, { useEffect, useState } from 'react';
import KPICard from '@/components/KPICard';
import { useAuth } from '@/contexts/AuthContext';
import { VelocityChart, DonutChart, SimpleBarChart } from '@/components/Charts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

interface DashboardData {
    kpis: {
        revenue: number;
        expenses: number;
        net_profit: number;
        margin: number;
        inventory_value: number;
        inventory_cost?: number;
    };
    charts: {
        payment_methods: { name: string; value: number }[];
        sales_by_source: { name: string; value: number }[];
        revenue_trend: { date: string; value: number }[];
    };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();
    const { token, user, loading: authLoading } = useAuth();
    const [error, setError] = useState('');

    const [marketingData, setMarketingData] = useState<any>(null);

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // Not logged in — middleware handles redirect, but just in case
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const fetchDashboard = fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/analytics/dashboard/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => { if (!res.ok) throw new Error(`API error ${res.status}`); return res.json(); });

        const fetchMarketing = fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/analytics/marketing_pulse/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : null).catch(() => null);

        Promise.all([fetchDashboard, fetchMarketing])
            .then(([dashData, marketData]) => {
                setData(dashData);
                if (marketData) setMarketingData(marketData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Dashboard fetch error", err);
                setError(err.message || "Failed to load dashboard data");
                setLoading(false);
            });

    }, [token, authLoading]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-cashmere-cream">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-cashmere-gold/20 rounded-full mb-4"></div>
                <div className="text-stone-400 font-serif">Loading Insights...</div>
            </div>
        </div>
    );

    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!data) return <div className="p-8 text-stone-500">No data available</div>;

    // Safely access charts with fallback
    const revenueTrend = data.charts?.revenue_trend || [];
    const trendData = revenueTrend.map(d => ({
        date: new Date(d.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
        quantity: d.value // Reusing 'quantity' prop name from VelocityChart generic
    }));

    return (
        <div className="p-8 space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-serif text-cashmere-maroon">{t('dashboard.title')}</h1>
                    <p className="text-stone-500 mt-2">{t('dashboard.subtitle')}</p>
                </div>
                {(user?.is_superuser || user?.groups.includes('Admin')) && (
                    <Link href="/dashboard/users" className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-900 transition-colors text-sm font-medium">
                        <Shield size={15} /> Manage Users
                    </Link>
                )}
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard
                    title={t('dashboard.revenue')}
                    value={`${data.kpis.revenue.toLocaleString()} ${t('common.currency') || 'EGP'}`}
                    trend="up"
                    subtext="Gross Sales"
                    icon="DollarSign"
                />
                <KPICard
                    title="Inventory"
                    value={`${(data.kpis.inventory_value || 0).toLocaleString()} ${t('common.currency') || 'EGP'}`}
                    trend="up"
                    subtext={`${(data.kpis.inventory_cost || 0).toLocaleString()} Cost`}
                    icon="Box"
                />
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">{t('dashboard.expenses')}</p>
                        <h2 className="text-2xl font-serif text-red-700 mt-2">
                            {data.kpis.expenses.toLocaleString()} <span className="text-sm text-stone-400">{t('common.currency') || 'EGP'}</span>
                        </h2>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                </div>
                <KPICard
                    title={t('dashboard.netProfit')}
                    value={`${data.kpis.net_profit.toLocaleString()} ${t('common.currency') || 'EGP'}`}
                    trend={data.kpis.net_profit >= 0 ? "up" : "down"}
                    subtext={`${data.kpis.margin.toFixed(1)}% ${t('dashboard.margin')}`}
                    icon="Activity"
                />
            </div>

            {/* Marketing Intelligence Section */}
            {marketingData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                        <h3 className="text-indigo-900 font-serif font-bold mb-1">Ad Spend</h3>
                        <div className="text-2xl font-bold text-indigo-700">
                            {marketingData.ad_spend.toLocaleString()} <span className="text-sm font-normal">EGP</span>
                        </div>
                        <div className="text-xs text-indigo-400 mt-1">{marketingData.active_campaigns} Active Campaigns</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                        <h3 className="text-emerald-900 font-serif font-bold mb-1">ROAS</h3>
                        <div className="text-2xl font-bold text-emerald-700">
                            {marketingData.roas.toFixed(2)}x
                        </div>
                        <div className="text-xs text-emerald-400 mt-1">Return on Ad Spend</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border border-amber-100 shadow-sm">
                        <h3 className="text-amber-900 font-serif font-bold mb-1">Conversion Rate</h3>
                        <div className="text-2xl font-bold text-amber-700">
                            {marketingData.conversion_rate}%
                        </div>
                        <div className="text-xs text-amber-400 mt-1">Store Conversion</div>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main: Revenue Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h3 className="font-serif text-xl text-stone-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-cashmere-gold" /> {t('dashboard.revenueTrend')} <span className="text-sm text-stone-400 font-sans">({t('dashboard.last7Days')})</span>
                    </h3>
                    <VelocityChart data={trendData} />
                </div>

                {/* Right Column: Breakdowns */}
                <div className="space-y-8">

                    {/* Payment Methods */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h3 className="font-serif text-lg text-stone-800 mb-4">{t('dashboard.paymentBreakdown')}</h3>
                        <DonutChart data={data.charts.payment_methods} />
                    </div>

                    {/* Sales Source */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h3 className="font-serif text-lg text-stone-800 mb-4">{t('dashboard.salesSource')}</h3>
                        <SimpleBarChart data={data.charts.sales_by_source} />
                    </div>

                </div>
            </div>
        </div>
    );
}
