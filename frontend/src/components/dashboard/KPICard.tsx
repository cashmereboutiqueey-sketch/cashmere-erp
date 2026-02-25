import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean; // true for green, false for red, undefined for neutral
    color?: "amber" | "emerald" | "purple" | "blue" | "stone";
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp, color = "stone" }: KPICardProps) {
    const colorStyles = {
        amber: "bg-amber-50 text-amber-700",
        emerald: "bg-emerald-50 text-emerald-700",
        purple: "bg-purple-50 text-purple-700",
        blue: "bg-blue-50 text-blue-700",
        stone: "bg-stone-50 text-stone-700",
    };

    const iconStyle = colorStyles[color];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${iconStyle}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendUp === true ? "bg-green-100 text-green-700" :
                            trendUp === false ? "bg-red-100 text-red-700" :
                                "bg-stone-100 text-stone-600"
                        }`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-stone-800">{value}</h4>
            </div>
        </div>
    );
}
