/**
 * Language Context Provider
 * Manages language state and translations across the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LanguageCode } from './types/i18n';
import { DEFAULT_LANGUAGE, getBrowserLanguage, isLanguageSupported } from './types/i18n';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  translations: Record<string, string>;
  t: (key: string, defaultValue?: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'preferred_language';
const LANGUAGE_COOKIE_NAME = 'language';

/**
 * Get language from localStorage (httpOnly cookie can't be read client-side)
 */
function getLanguageFromStorage(): LanguageCode | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && isLanguageSupported(stored)) {
    return stored as LanguageCode;
  }
  return null;
}

// Cookie is now httpOnly and set by server-side API for security

/**
 * Get initial language with priority: localStorage > browser > default
 * (Cookie is httpOnly and set server-side for security)
 */
function getInitialLanguage(): LanguageCode {
  // 1. Check localStorage
  const storedLang = getLanguageFromStorage();
  if (storedLang) return storedLang;
  
  // 2. Check browser language
  const browserLang = getBrowserLanguage();
  if (browserLang !== DEFAULT_LANGUAGE) {
    return browserLang;
  }
  
  // 3. Default to English
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    const initialLang = getInitialLanguage();
    setLanguageState(initialLang);
  }, []);

  // Load translations when language changes
  useEffect(() => {
    if (!mounted) return;

    const loadTranslations = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/i18n/translations?lang=${language}`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data.translations || {});
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language, mounted]);

  // Update language and persist to storage and server
  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLanguageState(newLang);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    }
    
    // Update HTML lang attribute for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }

    // Notify server of language change (sets httpOnly cookie)
    fetch('/api/i18n/set-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: newLang })
    }).catch(err => console.error('Failed to set language on server:', err));
  }, []);

  // Translation function
  const t = useCallback((key: string, defaultValue?: string): string => {
    return translations[key] || defaultValue || key;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook to get translation function
 */
export function useTranslation() {
  const { t, language, loading } = useLanguage();
  return { t, language, loading };
}

