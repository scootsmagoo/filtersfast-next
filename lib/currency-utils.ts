/**
 * Currency Utilities
 * Client-side currency conversion and formatting utilities
 * Server-side utilities are in lib/db/currency.ts
 */

import type { CurrencyCode, PriceDisplay } from './types/currency';

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  CAD: 'CA$',
  AUD: 'A$',
  EUR: '€',
  GBP: '£',
};

// Currency names
export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: 'US Dollar',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
};

// Country to currency mapping
export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  US: 'USD',
  CA: 'CAD',
  AU: 'AUD',
  AT: 'EUR',
  BE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  GR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  ES: 'EUR',
  GB: 'GBP',
  UK: 'GBP',
};

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCY_SYMBOLS[code] || '$';
}

/**
 * Get currency name for a currency code
 */
export function getCurrencyName(code: CurrencyCode): string {
  return CURRENCY_NAMES[code] || code;
}

/**
 * Get currency code from country code
 */
export function getCurrencyFromCountry(countryCode: string): CurrencyCode {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: CurrencyCode = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format price with currency code
 */
export function formatPriceWithCode(amount: number, currency: CurrencyCode = 'USD'): string {
  return `${formatPrice(amount, currency)} ${currency}`;
}

/**
 * Convert price from USD to target currency (client-side with provided rates)
 * For server-side conversion, use convertPriceFromUSD from lib/db/currency.ts
 */
export function convertPriceFromUSDClient(
  priceUSD: number, 
  toCurrency: CurrencyCode, 
  rates: Record<string, number>
): number {
  if (toCurrency === 'USD') return priceUSD;
  
  const rate = rates[toCurrency];
  if (!rate) return priceUSD;
  
  return Math.round(priceUSD * rate * 100) / 100;
}

/**
 * Create a price display object
 */
export function createPriceDisplay(
  amount: number,
  currency: CurrencyCode = 'USD',
  originalAmount?: number,
  originalCurrency?: CurrencyCode
): PriceDisplay {
  return {
    amount,
    currency,
    formatted: formatPrice(amount, currency),
    originalAmount,
    originalCurrency,
  };
}

/**
 * Client-side currency conversion using rates from context
 */
export function convertPriceClient(
  priceUSD: number,
  toCurrency: CurrencyCode,
  rates: Record<string, number>
): number {
  if (toCurrency === 'USD') return priceUSD;
  
  const rate = rates[toCurrency];
  if (!rate) return priceUSD;
  
  return Math.round(priceUSD * rate * 100) / 100;
}

/**
 * Parse currency from locale/country header
 */
export function parseCurrencyFromHeaders(
  headers: Headers,
  options: { fallback?: CurrencyCode | null } = {}
): CurrencyCode | null {
  const fallback = options.fallback ?? 'USD';

  // Try country headers provided by edge networks (Cloudflare, Vercel, etc.)
  const countryHeaders = ['cf-ipcountry', 'x-vercel-ip-country'];
  for (const headerName of countryHeaders) {
    const countryCode = headers.get(headerName);
    if (countryCode) {
      const currency = COUNTRY_TO_CURRENCY[countryCode.toUpperCase()];
      if (currency) return currency;
    }
  }
  
  // Try to parse from Accept-Language header
  const acceptLanguage = headers.get('accept-language');
  if (acceptLanguage) {
    const locales = acceptLanguage.split(',');
    for (const locale of locales) {
      const parts = locale.trim().split('-');
      if (parts.length > 1) {
        const country = parts[1].toUpperCase();
        const currency = COUNTRY_TO_CURRENCY[country];
        if (currency) return currency;
      }
    }
  }
  
  return fallback;
}

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return ['USD', 'CAD', 'AUD', 'EUR', 'GBP'].includes(code.toUpperCase());
}

/**
 * Get all supported currencies
 */
export function getAllSupportedCurrencies(): Array<{
  code: CurrencyCode;
  name: string;
  symbol: string;
}> {
  return Object.keys(CURRENCY_SYMBOLS).map(code => ({
    code: code as CurrencyCode,
    name: CURRENCY_NAMES[code as CurrencyCode],
    symbol: CURRENCY_SYMBOLS[code as CurrencyCode],
  }));
}

