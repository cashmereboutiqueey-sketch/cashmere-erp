"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    Store,
    Tags,
    ShoppingBag,
    DollarSign,
    LayoutDashboard,
    CreditCard,
    ArrowRight,
    Users,
    Calendar, // Replacement for Tent
    Settings, // Replacement for Globe
    Truck,
    Folder,
    ClipboardList
} from "lucide-react";

export default function BrandLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { t } = useLanguage();

    const { user, hasRole } = useAuth();

    // Define all potential modules
    const allModules = [
        {
            title: t('nav.overview'),
            href: "/brand",
            icon: LayoutDashboard,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.products'),
            href: "/brand/products",
            icon: Tags,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.collections') || 'Collections',
            href: "/brand/collections",
            icon: Folder,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.inventory'),
            href: "/brand/inventory",
            icon: Store,
            roles: ['Brand Manager', 'Admin', 'Worker'] // Maybe workers need read access?
        },
        {
            title: t('nav.bazaars'),
            href: "/brand/events",
            icon: Calendar,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.orders'),
            href: "/brand/orders",
            icon: ClipboardList,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.shipping') || 'Shipping',
            href: "/brand/shipping",
            icon: Truck,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.customers'),
            href: "/brand/customers",
            icon: Users,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.pos'),
            href: "/brand/pos",
            icon: ShoppingBag,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.finance'),
            href: "/brand/finance",
            icon: DollarSign,
            roles: ['Brand Manager', 'Admin']
        },
        {
            title: t('nav.integrations'),
            href: "/brand/integrations",
            icon: Settings,
            roles: ['Brand Manager', 'Admin']
        }
    ];

    const modules = allModules.filter(mod => {
        if (!user) return false;
        if (user.is_superuser) return true;
        return mod.roles.some(role => user.groups.includes(role));
    });

    return (
        <div
            className="flex h-screen overflow-hidden bg-cashmere-cream"
            suppressHydrationWarning
        >
            {/* Sidebar - Distinct 'Cashmere Black' for Brand side */}
            <div className="w-64 bg-cashmere-black text-white flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-xl font-serif font-bold tracking-wide">BRAND</h1>
                            <p className="text-xs text-white/50 mt-1">Retail Operations</p>
                        </div>
                        <LanguageToggle />
                    </div>
                    <Link href="/factory" className="flex items-center justify-between text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded transition-colors group">
                        <span>{t('nav.switchToFactory')}</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <nav className="p-4 space-y-2">
                    {modules.map((mod) => {
                        const isActive = pathname === mod.href;
                        return (
                            <Link
                                key={mod.href}
                                href={mod.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-white/10 text-white shadow-sm border border-white/10"
                                    : "text-white/80 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <mod.icon size={18} />
                                {mod.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto p-6 border-t border-white/10">
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
