import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: LucideIcon | any;
    positive?: boolean; // Added to suppress error, though maybe unused visually yet?
}

export default function KPICard({ title, value, subtext, trend, icon: Icon, positive }: KPICardProps) {
    return (
        <div className="card-panel flex flex-col justify-center relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-xs font-bold text-cashmere-gray uppercase tracking-widest">{title}</h3>
                {trend === 'up' && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
            </div>

            <div className="flex justify-between items-end relative z-10">
                <p className="text-3xl font-serif font-medium text-cashmere-maroon">{value}</p>
                {Icon && <Icon className="text-cashmere-gold opacity-20 absolute right-0 bottom-0 -mb-2 -mr-2" size={48} />}
            </div>

            {subtext && (
                <p className="mt-2 text-xs text-stone-400 border-t border-stone-100 pt-2 relative z-10">
                    {subtext}
                </p>
            )}
        </div>
    );
}
