'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en } from '@/locales/en';
import { ar } from '@/locales/ar';

const dictionaries = { en, ar };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('app-lang') || 'en';
    setLang(storedLang);
    document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = storedLang;
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const t = useCallback((keyString) => {
    const keys = keyString.split('.');
    let current = dictionaries[lang] || dictionaries['en'];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return keyString; // Fallback to key if not found
      }
      current = current[key];
    }
    return current;
  }, [lang]);

  const tData = useCallback((value, category) => {
    if (!value) return value;
    
    // Check if the value is a native bilingual JSON string directly from the DB
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        const obj = JSON.parse(value);
        return obj[lang] || obj.en || value;
      } catch (e) {
        // Not a valid JSON, fallback to standard dictionary mapping
      }
    }

    // Standard dictionary mapping fallback
    const keyPath = `data.${category}.${value}`;
    const keys = ['data', category, value];
    let current = dictionaries[lang] || dictionaries['en'];
    
    for (const key of keys) {
      if (!current || current[key] === undefined) {
        return value; // Fallback to original db value if not found
      }
      current = current[key];
    }
    return current;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, tData }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
