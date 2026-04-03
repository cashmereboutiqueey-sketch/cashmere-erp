"use client";

import Link from "next/link";
import { ArrowRight, DollarSign, ShoppingBag, Tag, AlertCircle, CreditCard, Package, Box, TrendingUp, TrendingDown, Activity, User, Store, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import KPICard from "@/components/KPICard";
import { VelocityChart, DonutChart, SimpleBarChart } from "@/components/Charts";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
    kpis: {
        revenue: number;
        expenses: number;
        net_profit: number;
        margin: number;
    };
    charts: {
        payment_methods: { name: string; value: number }[];
        sales_by_source: { name: string; value: number }[];
        revenue_trend: { date: string; value: number }[];
        stock_value_by_location?: { name: string; value: number }[];
    };
    top_products?: { name: string; sku: string; quantity: number; revenue: number }[];
}

export default function BrandPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();
    const { token } = useAuth(); // Get token

    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        if (!token) return;

        let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/analytics/dashboard/`;
        if (dateRange.start && dateRange.end) {
            url += `?start_date=${dateRange.start}&end_date=${dateRange.end}`;
        }

        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(responseData => {
                // Validate response structure
                if (responseData && responseData.kpis && responseData.charts) {
                    setData(responseData);
                } else {
                    console.error("Invalid dashboard data structure:", responseData);
                    setError("Invalid data format received");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch brand stats", err);
                setError(err.message || "Unknown Error");
                setLoading(false);
            });
    }, [dateRange, token]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-cashmere-gold/20 rounded-full mb-4"></div>
                <div className="text-stone-400 font-serif">Loading Retail Intelligence...</div>
            </div>
        </div>
    );

    if (!data) return (
        <div className="p-8 text-center">
            <div className="text-red-500 font-bold mb-4">Error loading dashboard data.</div>
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg inline-block font-mono text-sm border border-red-200">{error}</div>}
        </div>
    );

    // Validate data structure before transforming
    if (!data || !data.charts || !data.charts.revenue_trend || !Array.isArray(data.charts.revenue_trend)) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 font-bold mb-4">Invalid dashboard data structure.</div>
                {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg inline-block font-mono text-sm border border-red-200">{error}</div>}
            </div>
        );
    }

    // Transform Trend Data for Chart
    const trendData = data.charts.revenue_trend.map(d => ({
        date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        quantity: d.value // Reusing 'quantity' prop name from VelocityChart generic logic
    }));

    return (
        <div className="p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-cashmere-maroon">{t('brandDashboard.title')}</h1>
                    <p className="text-stone-500 mt-2">{t('brandDashboard.subtitle')}</p>
                </div>
                <Link href="/brand/pos" className="bg-cashmere-black text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    <ShoppingBag size={20} />
                    {t('brandDashboard.openPos')}
                </Link>
            </header>

            {/* Date Filter */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
                <span className="text-sm font-bold text-stone-600">Period:</span>
                <input
                    type="date"
                    className="border border-stone-200 rounded px-3 py-1 text-sm"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <span className="text-stone-400">-</span>
                <input
                    type="date"
                    className="border border-stone-200 rounded px-3 py-1 text-sm"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
                <button
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="text-xs text-stone-400 underline hover:text-stone-600"
                >
                    Clear Filter
                </button>
            </div>

            {/* KPI Grid - Enhanced Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title={t('brandDashboard.totalRevenue')}
                    value={`${data.kpis.revenue.toLocaleString()} EGP`}
                    trend="up"
                    subtext={t('brandDashboard.grossSales') || "Gross Sales"} // Add grossSales key if missing, or use fallback
                    icon={DollarSign}
                />
                <KPICard
                    title={t('brandDashboard.netProfit')}
                    value={`${data.kpis.net_profit.toLocaleString()} EGP`}
                    trend={data.kpis.net_profit >= 0 ? "up" : "down"}
                    subtext={`${data.kpis.margin.toFixed(1)}% ${t('dashboard.margin')}`}
                    icon={Activity}
                />
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">{t('brandDashboard.expenses')}</p>
                        <h2 className="text-2xl font-serif text-red-700 mt-2">
                            {data.kpis.expenses.toLocaleString()} <span className="text-sm text-stone-400">EGP</span>
                        </h2>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">{t('brandDashboard.cashFlow')}</p>
                    <div className={`text-xl font-bold ${data.kpis.net_profit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {data.kpis.net_profit > 0 ? t('dashboard.positive') : t('dashboard.negative')}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Charts */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Revenue Trend */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h3 className="font-serif text-xl text-stone-800 mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-cashmere-gold" /> {t('dashboard.revenueTrend')} <span className="text-sm text-stone-400 font-sans">({t('dashboard.last7Days')})</span>
                        </h3>
                        <VelocityChart data={trendData} />
                    </div>

                    {/* Breakdown Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h3 className="font-serif text-sm font-bold text-stone-800 mb-4 uppercase tracking-wider">{t('dashboard.paymentBreakdown')}</h3>
                            <DonutChart data={data.charts.payment_methods} />
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h3 className="font-serif text-sm font-bold text-stone-800 mb-4 uppercase tracking-wider">{t('dashboard.salesSource')}</h3>
                            <SimpleBarChart data={data.charts.sales_by_source} color="#C5A059" />
                        </div>
                    </div>

                    {/* Stock Value - Added Requested Feature */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h3 className="font-serif text-xl text-stone-800 mb-6 flex items-center gap-2">
                            <Store size={20} className="text-emerald-600" /> {t('brandDashboard.stockValuation')}
                        </h3>
                        <div className="h-64">
                            <SimpleBarChart data={data.charts.stock_value_by_location || []} color="#059669" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Alerts */}
                <div className="space-y-6">
                    {/* Top Products Widget (Replaces Quick Actions) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-6 font-serif flex items-center gap-2">
                            <Package size={20} className="text-cashmere-gold" /> {t('brandDashboard.topStyles')}
                        </h3>
                        {data.top_products && data.top_products.length > 0 ? (
                            <div className="space-y-4">
                                {data.top_products.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors border-b border-stone-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-stone-600 font-bold text-xs">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-stone-800">{product.name}</p>
                                                <p className="text-xs text-stone-400">{product.sku} • {product.quantity} {t('products.sold')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-emerald-700">
                                                {Number(product.revenue).toLocaleString()} <span className="text-xs text-emerald-500">EGP</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-stone-400 text-sm">{t('common.noRecords')}</div>
                        )}

                        <div className="mt-6 pt-4 border-t border-stone-200">
                            <Link href="/brand/pos" className="flex items-center justify-center w-full py-3 bg-cashmere-black text-white rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors">
                                <Plus size={16} className="mr-2" /> {t('brandDashboard.newSale')}
                            </Link>
                        </div>
                    </div>

                    {/* Alerts Placeholder */}
                    <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                        <h3 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                            <AlertCircle size={18} /> {t('brandDashboard.systemAlerts')}
                        </h3>
                        <ul className="text-sm text-amber-800 space-y-2 list-disc pl-4">
                            <li>3 Items represent 80% of revenue today.</li>
                            <li>Warehouse stock for "Linen Shirt" is low.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
