"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

type Language = 'ar' | 'en';
type Translations = typeof ar;

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string) => string;
    dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { ar, en };

function getInitialLanguage(): Language {
    if (typeof window === 'undefined') return 'ar';
    const saved = localStorage.getItem('language') as Language;
    return saved === 'ar' || saved === 'en' ? saved : 'ar';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Lazy initializer reads localStorage synchronously on first client render,
    // avoiding a useEffect-driven state update that causes SSR hydration mismatch.
    const [language, setLanguage] = useState<Language>(getInitialLanguage);

    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const toggleLanguage = () => {
        const newLang: Language = language === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        const safeLang = (language as Language) in translations ? (language as Language) : 'ar';
        let value: any = (translations as Record<string, any>)[safeLang];
        for (const k of keys) {
            value = value?.[k];
        }
        if (value) return value;

        // Fall back to English if the current language is missing the key
        let enValue: any = (translations as Record<string, any>)['en'];
        for (const k of keys) {
            enValue = enValue?.[k];
        }
        return enValue || key;
    };

    const dir = language === 'ar' ? 'rtl' : 'ltr';

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}
