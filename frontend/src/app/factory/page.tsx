"use client";

import { ArrowRight, Hammer, ClipboardList, AlertTriangle, Boxes, Factory, Layers, ScrollText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import { useLanguage } from '@/contexts/LanguageContext';

interface FactoryStats {
    kpis: {
        active_jobs: number;
        pending_jobs: number;
        low_stock_materials: number;
        completed_qty_this_month: number;
    };
    production_velocity: { date: string; value: number }[];
}

export default function FactoryPage() {
    const [stats, setStats] = useState<FactoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        fetch('http://localhost:8000/api/factory/jobs/dashboard_stats/')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch factory stats", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-serif font-bold text-cashmere-maroon mb-2">{t('factoryDashboard.title')}</h1>
                <p className="text-stone-500 text-lg">
                    {t('factoryDashboard.subtitle')}
                </p>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-stone-100 rounded-xl"></div>
                    <div className="h-64 bg-stone-100 rounded-xl"></div>
                </div>
            ) : (
                <>
                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <KPICard
                            title={t('factoryDashboard.activeJobs')}
                            value={stats?.kpis?.active_jobs || 0}
                            icon={Hammer}
                            color="purple"
                            trend={t('jobs.inProgress') || "In Progress"}
                            trendUp={true}
                        />
                        <KPICard
                            title={t('factoryDashboard.pendingJobs')}
                            value={stats?.kpis?.pending_jobs || 0}
                            icon={ClipboardList}
                            color="blue"
                        />
                        <KPICard
                            title={t('factoryDashboard.lowStock')}
                            value={stats?.kpis?.low_stock_materials || 0}
                            icon={AlertTriangle}
                            color="amber"
                        // trend={(stats?.kpis?.low_stock_materials ?? 0) > 0 ? "Restock Needed" : "Healthy"}
                        // trendUp={(stats?.kpis?.low_stock_materials ?? 0) === 0}
                        />
                        <KPICard
                            title={t('factoryDashboard.monthlyOutput')}
                            value={`${stats?.kpis?.completed_qty_this_month || 0} ${t('common.units') || 'Units'}`}
                            icon={Boxes}
                            color="emerald"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Production Chart */}
                        <div className="lg:col-span-2 h-96">
                            <AnalyticsChart
                                title={t('factoryDashboard.productionVelocity')}
                                data={stats?.production_velocity || []}
                                dataKey="value"
                                color="#7e22ce" // Purple 600
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                            <h3 className="text-lg font-bold text-stone-800 mb-6">{t('factoryDashboard.quickActions')}</h3>
                            <div className="space-y-4">
                                <Link href="/factory/jobs" className="flex items-center justify-between p-4 bg-purple-50 rounded-lg text-purple-900 font-medium hover:bg-purple-100 transition-colors">
                                    <span className="flex items-center gap-3">
                                        <Factory size={18} />
                                        {t('factoryDashboard.manageJobs')}
                                    </span>
                                    <ArrowRight size={16} />
                                </Link>
                                <Link href="/factory/inventory" className="flex items-center justify-between p-4 bg-stone-50 rounded-lg text-stone-900 font-medium hover:bg-stone-100 transition-colors">
                                    <span className="flex items-center gap-3">
                                        <Layers size={18} />
                                        {t('factoryDashboard.rawMaterials')}
                                    </span>
                                    <ArrowRight size={16} />
                                </Link>
                                <Link href="/factory/bom" className="flex items-center justify-between p-4 bg-stone-50 rounded-lg text-stone-900 font-medium hover:bg-stone-100 transition-colors">
                                    <span className="flex items-center gap-3">
                                        <ScrollText size={18} />
                                        {t('factoryDashboard.bom')}
                                    </span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
