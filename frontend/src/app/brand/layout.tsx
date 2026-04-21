"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    Store, Tags, ShoppingBag, DollarSign, LayoutDashboard,
    ArrowRight, Users, Calendar, Settings, Truck, Folder,
    ClipboardList, Menu, X
} from "lucide-react";

export default function BrandLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const allModules = [
        { title: t('nav.overview'), href: "/brand", icon: LayoutDashboard, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.products'), href: "/brand/products", icon: Tags, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.collections') || 'Collections', href: "/brand/collections", icon: Folder, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.inventory'), href: "/brand/inventory", icon: Store, roles: ['Brand Manager', 'Admin', 'Worker'] },
        { title: t('nav.bazaars'), href: "/brand/events", icon: Calendar, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.orders'), href: "/brand/orders", icon: ClipboardList, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.shipping') || 'Shipping', href: "/brand/shipping", icon: Truck, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.customers'), href: "/brand/customers", icon: Users, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.pos'), href: "/brand/pos", icon: ShoppingBag, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.finance'), href: "/brand/finance", icon: DollarSign, roles: ['Brand Manager', 'Admin'] },
        { title: t('nav.integrations'), href: "/brand/integrations", icon: Settings, roles: ['Brand Manager', 'Admin'] },
    ];

    const modules = allModules.filter(mod => {
        if (!user) return false;
        if (user.is_superuser) return true;
        return mod.roles.some(role => user.groups.includes(role));
    });

    const SidebarContent = () => (
        <>
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
            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {modules.map((mod) => {
                    const isActive = pathname === mod.href;
                    return (
                        <Link key={mod.href} href={mod.href} onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                ? "bg-white/10 text-white shadow-sm border border-white/10"
                                : "text-white/80 hover:text-white hover:bg-white/5"}`}
                        >
                            <mod.icon size={18} />
                            {mod.title}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-6 border-t border-white/10">
                <Link href="/dashboard" className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-2">
                    ← Back to HQ
                </Link>
            </div>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-cashmere-cream" suppressHydrationWarning>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar — hidden on mobile, slide in when open */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-cashmere-black text-white flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full overflow-y-auto flex flex-col" suppressHydrationWarning>
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-cashmere-black text-white sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="p-1">
                        <Menu size={22} />
                    </button>
                    <span className="font-serif font-bold tracking-wide">BRAND</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
