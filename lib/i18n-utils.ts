/**
 * Multi-Language Utilities
 * Helper functions for translation management
 */

import type { LanguageCode, Translation, TranslationCategory } from './types/i18n';
import { DEFAULT_LANGUAGE } from './types/i18n';

/**
 * Translation cache to reduce database queries
 */
const translationCache = new Map<string, Map<string, string>>();

/**
 * Generate cache key for translation
 */
function getCacheKey(language: LanguageCode, key: string): string {
  return `${language}:${key}`;
}

/**
 * Get translation from cache
 */
function getCachedTranslation(language: LanguageCode, key: string): string | undefined {
  const langCache = translationCache.get(language);
  return langCache?.get(key);
}

/**
 * Set translation in cache
 */
function setCachedTranslation(language: LanguageCode, key: string, value: string): void {
  if (!translationCache.has(language)) {
    translationCache.set(language, new Map());
  }
  translationCache.get(language)!.set(key, value);
}

/**
 * Clear translation cache for a specific language or all languages
 */
export function clearTranslationCache(language?: LanguageCode): void {
  if (language) {
    translationCache.delete(language);
  } else {
    translationCache.clear();
  }
}

/**
 * Translate a key with fallback to English
 * Server-side version that fetches from database
 */
export async function translate(
  key: string,
  language: LanguageCode = DEFAULT_LANGUAGE,
  defaultValue?: string
): Promise<string> {
  // Check cache first
  const cached = getCachedTranslation(language, key);
  if (cached) return cached;

  try {
    // Fetch from API
    const response = await fetch(`/api/i18n/translate?key=${encodeURIComponent(key)}&lang=${language}`, {
      cache: 'force-cache',
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      // Fallback to English if translation not found
      if (language !== DEFAULT_LANGUAGE) {
        const enResponse = await fetch(`/api/i18n/translate?key=${encodeURIComponent(key)}&lang=en`, {
          cache: 'force-cache',
          next: { revalidate: 3600 }
        });
        
        if (enResponse.ok) {
          const data = await enResponse.json();
          return data.value || defaultValue || key;
        }
      }
      
      return defaultValue || key;
    }

    const data = await response.json();
    const value = data.value || defaultValue || key;
    
    // Cache the result
    setCachedTranslation(language, key, value);
    
    return value;
  } catch (error) {
    console.error('Translation error:', error);
    return defaultValue || key;
  }
}

/**
 * Client-side translation hook
 * Uses translations loaded in the language context
 */
export function useTranslate(translations: Record<string, string> = {}) {
  return (key: string, defaultValue?: string): string => {
    return translations[key] || defaultValue || key;
  };
}

/**
 * Translate multiple keys at once
 */
export async function translateMany(
  keys: string[],
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {};

  // Check cache first
  const uncachedKeys: string[] = [];
  for (const key of keys) {
    const cached = getCachedTranslation(language, key);
    if (cached) {
      translations[key] = cached;
    } else {
      uncachedKeys.push(key);
    }
  }

  // Fetch uncached translations
  if (uncachedKeys.length > 0) {
    try {
      const response = await fetch('/api/i18n/translate-many', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: uncachedKeys, language }),
        cache: 'force-cache',
        next: { revalidate: 3600 }
      });

      if (response.ok) {
        const data = await response.json();
        for (const key of uncachedKeys) {
          const value = data.translations[key] || key;
          translations[key] = value;
          setCachedTranslation(language, key, value);
        }
      } else {
        // Fallback to keys
        for (const key of uncachedKeys) {
          translations[key] = key;
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      for (const key of uncachedKeys) {
        translations[key] = key;
      }
    }
  }

  return translations;
}

/**
 * Get all translations for a language and category
 */
export async function getTranslationsByCategory(
  language: LanguageCode,
  category: TranslationCategory
): Promise<Record<string, string>> {
  try {
    const response = await fetch(`/api/i18n/translations?lang=${language}&category=${category}`, {
      cache: 'force-cache',
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    return data.translations || {};
  } catch (error) {
    console.error('Error fetching translations by category:', error);
    return {};
  }
}

/**
 * Format number according to language locale
 */
export function formatNumber(
  value: number,
  language: LanguageCode = DEFAULT_LANGUAGE,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getLocaleFromLanguage(language);
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency according to language locale
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  language: LanguageCode = DEFAULT_LANGUAGE
): string {
  const locale = getLocaleFromLanguage(language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Format date according to language locale
 */
export function formatDate(
  date: Date | string,
  language: LanguageCode = DEFAULT_LANGUAGE,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocaleFromLanguage(language);
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Get locale string from language code
 */
export function getLocaleFromLanguage(language: LanguageCode): string {
  const localeMap: Record<LanguageCode, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'fr-ca': 'fr-CA'
  };
  return localeMap[language] || 'en-US';
}

/**
 * Pluralization helper
 * Simple English-style pluralization (can be extended for other languages)
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
  language: LanguageCode = DEFAULT_LANGUAGE
): string {
  if (count === 1) return singular;
  
  // If plural form is provided, use it
  if (plural) return plural;
  
  // Simple English pluralization rules
  if (language === 'en') {
    if (singular.endsWith('y')) {
      return singular.slice(0, -1) + 'ies';
    }
    if (singular.endsWith('s') || singular.endsWith('sh') || singular.endsWith('ch')) {
      return singular + 'es';
    }
    return singular + 's';
  }
  
  // For other languages, just return singular form if no plural provided
  return singular;
}

/**
 * Interpolate variables in translation strings
 * Example: interpolate("Hello {name}!", { name: "John" }) => "Hello John!"
 */
export function interpolate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return String(variables[key] ?? match);
  });
}

/**
 * Get direction for a language (ltr or rtl)
 */
export function getTextDirection(language: LanguageCode): 'ltr' | 'rtl' {
  // Currently all supported languages are LTR
  // If you add Arabic or Hebrew in the future, add them here
  return 'ltr';
}

