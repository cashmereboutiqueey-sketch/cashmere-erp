
'use client';

import { useState, useEffect, useCallback } from 'react';
import { translations, Language, TranslationKey } from '@/lib/i18n';

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language | null;
    if (storedLang && (storedLang === 'en' || storedLang === 'ar')) {
      setLanguage(storedLang);
    }

    const handleStorageChange = () => {
      const newStoredLang = localStorage.getItem('language') as Language | null;
      if (newStoredLang && (newStoredLang === 'en' || newStoredLang === 'ar')) {
        setLanguage(newStoredLang);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event listener for language change from header
    const handleLanguageChange = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if(detail.lang && (detail.lang === 'en' || detail.lang === 'ar')) {
            setLanguage(detail.lang);
        }
    }
    window.addEventListener('languageChanged', handleLanguageChange);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || translations['en'][key];
    },
    [language]
  );

  return { t, language };
};
