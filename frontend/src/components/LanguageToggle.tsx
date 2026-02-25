"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-300"
            title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
            <span className="text-lg">{language === 'ar' ? '🇸🇦' : '🇬🇧'}</span>
            <span className="text-sm font-bold text-stone-700">
                {language === 'ar' ? 'عربي' : 'EN'}
            </span>
        </button>
    );
}
