"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function IntegrationsPage() {
    const { t } = useLanguage();

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-cashmere-maroon mb-2">{t('nav.integrations') || 'Integrations'}</h1>
                <p className="text-stone-500">Manage external connections and data sync.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Shopify Card */}
                <Link href="/brand/integrations/shopify" className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-[#95BF47]/10 p-3 rounded-lg">
                            <ShoppingBag className="text-[#95BF47]" size={32} />
                        </div>
                        <ChevronRight className="text-stone-300 group-hover:text-stone-600 transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg text-stone-800 mb-2">Shopify</h3>
                    <p className="text-sm text-stone-500 mb-4">
                        Connect your Shopify store to sync products, inventory, and collections automatically.
                    </p>
                    <span className="text-xs font-bold text-cashmere-maroon uppercase tracking-wider group-hover:underline">Configure Connection</span>
                </Link>

                {/* Shipping Card */}
                <Link href="/brand/integrations/shipping" className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Truck className="text-blue-600" size={32} />
                        </div>
                        <ChevronRight className="text-stone-300 group-hover:text-stone-600 transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg text-stone-800 mb-2">Shipping & Logistics</h3>
                    <p className="text-sm text-stone-500 mb-4">
                        Connect with QuiGo, Bosta, or Aramex to automate waybills and track shipments.
                    </p>
                    <span className="text-xs font-bold text-cashmere-maroon uppercase tracking-wider group-hover:underline">Manage Couriers</span>
                </Link>
            </div>
        </div>
    );
}
