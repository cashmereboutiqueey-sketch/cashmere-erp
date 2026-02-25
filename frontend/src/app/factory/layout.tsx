"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    Factory,
    Package,
    Layers,
    ClipboardList,
    LayoutDashboard,
    ArrowRight,
    Tag,
    DollarSign,
    Users,
    Tablet
} from "lucide-react";

import OfflineBanner from "@/components/OfflineBanner";

export default function FactoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { t } = useLanguage();

    const { user, hasRole } = useAuth();

    const allModules = [
        {
            title: t('nav.overview'),
            href: "/factory",
            icon: LayoutDashboard,
            roles: ['Factory Manager', 'Admin']
        },
        {
            title: t('nav.suppliers'),
            href: "/factory/suppliers",
            icon: Factory,
            roles: ['Factory Manager', 'Admin']
        },
        {
            title: t('nav.materials'),
            href: "/factory/inventory",
            icon: Package,
            roles: ['Factory Manager', 'Admin']
        },
        {
            title: t('nav.catalog'),
            href: "/factory/products",
            icon: Tag,
            roles: ['Factory Manager', 'Admin']
        },
        {
            title: t('nav.bom'),
            href: "/factory/bom/builder",
            icon: Layers,
            roles: ['Factory Manager', 'Admin']
        },
        {
            title: t('nav.production'),
            href: "/factory/jobs",
            icon: ClipboardList,
            roles: ['Factory Manager', 'Admin', 'Worker']
        },
        {
            title: t('nav.hr'),
            href: "/factory/hr",
            icon: Users,
            roles: ['Factory Manager', 'Admin']
        },
        {
            title: t('nav.finance'),
            href: "/factory/finance",
            icon: DollarSign,
            roles: ['Factory Manager', 'Admin']
        },
        {
            title: "Production Kiosk",
            href: "/factory/kiosk",
            icon: Tablet,
            roles: ['Factory Manager', 'Admin', 'Worker']
        }
    ];

    const modules = allModules.filter(mod => {
        if (!user) return false;
        if (user.is_superuser) return true;
        return mod.roles.some(role => user.groups.includes(role));
    });

    return (
        <div className="flex h-screen overflow-hidden bg-cashmere-cream">
            <OfflineBanner />
            {/* Sidebar */}
            {/* Sidebar */}
            <div className="w-64 bg-cashmere-maroon text-white flex flex-col h-full" suppressHydrationWarning>
                <div className="p-6 border-b border-white/10" suppressHydrationWarning>
                    <div className="flex items-start justify-between mb-4" suppressHydrationWarning>
                        <div>
                            <h1 className="text-xl font-serif font-bold tracking-wide">FACTORY</h1>
                            <p className="text-xs text-white/50 mt-1">Cashmere Ops</p>
                        </div>
                        <LanguageToggle />
                    </div>
                    <Link href="/brand" className="flex items-center justify-between text-xs bg-black/20 hover:bg-black/30 text-white/80 px-3 py-2 rounded transition-colors group">
                        <span>Switch to Brand</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <nav className="p-4 space-y-2" suppressHydrationWarning>
                    {modules.map((mod) => {
                        const isActive = pathname === mod.href;
                        return (
                            <Link
                                key={mod.href}
                                href={mod.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-white/10 text-white shadow-sm border border-white/10"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <mod.icon size={18} />
                                {mod.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto p-6 border-t border-white/10" suppressHydrationWarning>
                    <Link href="/dashboard" className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-2">
                        ← Back to HQ
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full overflow-y-auto" suppressHydrationWarning>
                {children}
            </div>
        </div>
    );
}
