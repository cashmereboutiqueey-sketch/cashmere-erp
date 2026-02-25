import React from 'react';
import KPICard from './KPICard';
import { LucideIcon } from 'lucide-react';

export interface MetricItem {
    title: string;
    value: string;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: any; // LucideIcon
    category?: string;
}

interface MetricsGridProps {
    title?: string;
    metrics: MetricItem[];
}

export default function MetricsGrid({ title, metrics }: MetricsGridProps) {
    // Group metrics by category
    const groupedMetrics = metrics.reduce((acc, metric) => {
        const cat = metric.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(metric);
        return acc;
    }, {} as Record<string, MetricItem[]>);

    return (
        <div className="space-y-6">
            {title && <h2 className="text-2xl font-serif text-cashmere-black mb-4">{title}</h2>}

            {Object.entries(groupedMetrics).map(([category, items]) => (
                <div key={category} className="space-y-3">
                    {category !== 'General' && (
                        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest border-b border-stone-200 pb-1">
                            {category}
                        </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {items.map((metric, idx) => (
                            <KPICard
                                key={idx}
                                title={metric.title}
                                value={metric.value}
                                subtext={metric.subtext}
                                trend={metric.trend}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
