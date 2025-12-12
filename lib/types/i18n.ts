/**
 * Multi-Language (i18n) Type Definitions
 */

export type LanguageCode = 'en' | 'es' | 'fr' | 'fr-ca';

export type TextDirection = 'ltr' | 'rtl';

export type ContentType = 'page' | 'article' | 'support' | 'email' | 'sms' | 'other';

export type TranslationCategory = 
  | 'navigation'
  | 'actions'
  | 'product'
  | 'cart'
  | 'account'
  | 'checkout'
  | 'messages'
  | 'forms'
  | 'categories'
  | 'general';

export interface Language {
  code: LanguageCode;
  name: string;
  native_name: string;
  flag_emoji: string;
  direction: TextDirection;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Translation {
  id: number;
  key: string;
  language_code: LanguageCode;
  value: string;
  category: TranslationCategory;
  context?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductTranslation {
  id: number;
  product_id: string;
  language_code: LanguageCode;
  name: string;
  description?: string | null;
  features?: string | null;
  specifications?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryTranslation {
  id: number;
  category_id: string;
  language_code: LanguageCode;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentTranslation {
  id: number;
  content_id: string;
  content_type: ContentType;
  language_code: LanguageCode;
  title: string;
  body?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  slug?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranslationInput {
  key: string;
  language_code: LanguageCode;
  value: string;
  category?: TranslationCategory;
  context?: string;
}

export interface ProductTranslationInput {
  product_id: string;
  language_code: LanguageCode;
  name: string;
  description?: string;
  features?: string;
  specifications?: string;
}

export interface CategoryTranslationInput {
  category_id: string;
  language_code: LanguageCode;
  name: string;
  description?: string;
}

export interface ContentTranslationInput {
  content_id: string;
  content_type: ContentType;
  language_code: LanguageCode;
  title: string;
  body?: string;
  meta_description?: string;
  meta_keywords?: string;
  slug?: string;
}

export interface LanguagePreference {
  language: LanguageCode;
  auto_detect: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    native_name: 'English',
    flag_emoji: '🇺🇸',
    direction: 'ltr',
    is_active: true,
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    code: 'es',
    name: 'Spanish',
    native_name: 'Español',
    flag_emoji: '🇪🇸',
    direction: 'ltr',
    is_active: true,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    code: 'fr',
    name: 'French',
    native_name: 'Français',
    flag_emoji: '🇫🇷',
    direction: 'ltr',
    is_active: true,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    code: 'fr-ca',
    name: 'French (Canada)',
    native_name: 'Français (Canada)',
    flag_emoji: '🇨🇦',
    direction: 'ltr',
    is_active: true,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/**
 * Get language name by code
 */
export function getLanguageName(code: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || 'English';
}

/**
 * Get native language name by code
 */
export function getNativeLanguageName(code: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.native_name || 'English';
}

/**
 * Get language flag emoji by code
 */
export function getLanguageFlag(code: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.flag_emoji || '🇺🇸';
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some(l => l.code === code);
}

/**
 * Get browser language with fallback
 */
export function getBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language.toLowerCase();
  
  // Check for exact match
  if (isLanguageSupported(browserLang)) {
    return browserLang as LanguageCode;
  }
  
  // Check for language family match (e.g., 'es-MX' -> 'es')
  const langFamily = browserLang.split('-')[0];
  if (isLanguageSupported(langFamily)) {
    return langFamily as LanguageCode;
  }
  
  // Check for fr-ca special case
  if (browserLang === 'fr-ca' || browserLang === 'fr-canadian') {
    return 'fr-ca';
  }
  
  return DEFAULT_LANGUAGE;
}


