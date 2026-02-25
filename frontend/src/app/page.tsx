"use client";

import Link from "next/link";
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { t, language } = useLanguage();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 lg:p-24 bg-cashmere-cream" dir={language === 'ar' ? 'rtl' : 'ltr'}>

      {/* Brand Header */}
      <div className="z-10 w-full max-w-4xl text-center mb-16 space-y-4">
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-cashmere-maroon tracking-tight">
          CASHMERE
        </h1>
        <p className="text-sm md:text-base tracking-[0.2em] uppercase text-cashmere-gold font-medium">
          {t('landing.tagline')}
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid text-center lg:w-full lg:max-w-6xl lg:grid-cols-3 gap-6 lg:text-left">

        {/* CEO Dashboard Card */}
        <Link
          href="/dashboard"
          className="group card-panel flex flex-col justify-between h-48 border-l-4 border-l-cashmere-maroon hover:border-l-cashmere-gold p-6 bg-white shadow-sm rounded-xl transition-all hover:bg-stone-50"
        >
          <div>
            <h2 className="mb-2 text-xl font-serif font-bold text-cashmere-black">
              {t('landing.ceoDashboard')}
            </h2>
            <p className="text-sm opacity-80 text-cashmere-gray leading-relaxed text-stone-500">
              {t('landing.ceoDesc')}
            </p>
          </div>
          <span className="text-xs font-bold text-cashmere-maroon uppercase tracking-wide group-hover:underline mt-4 block">
            {t('landing.viewMetrics')} &rarr;
          </span>
        </Link>

        {/* Brand Portal Card (Middle) */}
        <Link
          href="/brand/orders"
          className="group card-panel flex flex-col justify-between h-48 border-l-4 border-l-indigo-400 hover:border-l-indigo-600 p-6 bg-white shadow-sm rounded-xl transition-all hover:bg-stone-50"
        >
          <div>
            <h2 className="mb-2 text-xl font-serif font-bold text-cashmere-black">
              Brand Ops
            </h2>
            <p className="text-sm opacity-80 text-cashmere-gray leading-relaxed text-stone-500">
              Manage Orders, Inventory, and Events for the main brand.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide group-hover:underline mt-4 block">
            Enter Brand &rarr;
          </span>
        </Link>

        {/* Factory Portal Card */}
        <Link
          href="/factory"
          className="group card-panel flex flex-col justify-between h-48 border-l-4 border-l-stone-400 hover:border-l-cashmere-black p-6 bg-white shadow-sm rounded-xl transition-all hover:bg-stone-50"
        >
          <div>
            <h2 className="mb-2 text-xl font-serif font-semibold text-cashmere-black">
              {t('landing.factoryPortal')}
            </h2>
            <p className="text-sm opacity-80 text-cashmere-gray leading-relaxed text-stone-500">
              {t('landing.factoryDesc')}
            </p>
          </div>
          <span className="text-xs font-bold text-cashmere-black uppercase tracking-wide group-hover:underline mt-4 block">
            {t('landing.enterFactory')} &rarr;
          </span>
        </Link>

      </div>

      <footer className="mt-20 text-xs text-cashmere-gray">
        &copy; 2026 {t('landing.rights')}
      </footer>
    </main>
  );
}
