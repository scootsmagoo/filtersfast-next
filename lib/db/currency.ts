/**
 * Currency Database Functions
 * Handles currency exchange rates and conversions
 */

import Database from 'better-sqlite3';

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to USD
  lastUpdated: number;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  countries: string[]; // ISO country codes that typically use this currency
}

// Supported currencies (matching legacy system)
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', countries: ['US'] },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', countries: ['CA'] },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', countries: ['AU'] },
  { code: 'EUR', name: 'Euro', symbol: '€', countries: ['AT', 'BE', 'FR', 'DE', 'GR', 'IE', 'IT', 'NL', 'ES'] },
  { code: 'GBP', name: 'British Pound', symbol: '£', countries: ['GB', 'UK'] },
];

const getDb = () => {
  return new Database('filtersfast.db');
};

/**
 * Initialize currency tables
 */
export function initCurrencyTables() {
  const db = getDb();
  
  try {
    // Create currency_rates table
    db.exec(`
      CREATE TABLE IF NOT EXISTS currency_rates (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        rate REAL NOT NULL DEFAULT 1.0,
        last_updated INTEGER NOT NULL
      )
    `);
    
    console.log('✅ Currency rates table initialized');
    
    // Seed with default currencies (USD = 1.0, others to be updated)
    const insert = db.prepare(`
      INSERT OR IGNORE INTO currency_rates (code, name, symbol, rate, last_updated)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const now = Date.now();
    for (const currency of SUPPORTED_CURRENCIES) {
      insert.run(currency.code, currency.name, currency.symbol, 1.0, now);
    }
    
    console.log('✅ Default currency rates seeded');
    
    // Add columns to orders table if they don't exist
    try {
      db.exec(`ALTER TABLE orders ADD COLUMN currency TEXT DEFAULT 'USD'`);
      console.log('✅ Added currency column to orders table');
    } catch (e) {
      // Column already exists, ignore
    }
    
    try {
      db.exec(`ALTER TABLE orders ADD COLUMN exchange_rate REAL DEFAULT 1.0`);
      console.log('✅ Added exchange_rate column to orders table');
    } catch (e) {
      // Column already exists, ignore
    }
    
    try {
      db.exec(`ALTER TABLE orders ADD COLUMN original_currency TEXT`);
      console.log('✅ Added original_currency column to orders table');
    } catch (e) {
      // Column already exists, ignore
    }
    
  } catch (error) {
    console.error('Error initializing currency tables:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get all currency rates
 */
export function getAllCurrencyRates(): CurrencyRate[] {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        code,
        name,
        symbol,
        rate,
        last_updated as lastUpdated
      FROM currency_rates
      ORDER BY code
    `);
    
    return stmt.all() as CurrencyRate[];
  } finally {
    db.close();
  }
}

/**
 * Get a specific currency rate
 */
export function getCurrencyRate(code: string): CurrencyRate | null {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        code,
        name,
        symbol,
        rate,
        last_updated as lastUpdated
      FROM currency_rates
      WHERE code = ?
    `);
    
    return stmt.get(code.toUpperCase()) as CurrencyRate | null;
  } finally {
    db.close();
  }
}

/**
 * Update currency rate
 */
export function updateCurrencyRate(code: string, rate: number): boolean {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      UPDATE currency_rates
      SET rate = ?, last_updated = ?
      WHERE code = ?
    `);
    
    const result = stmt.run(rate, Date.now(), code.toUpperCase());
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Update multiple currency rates at once
 */
export function updateCurrencyRates(rates: Record<string, number>): number {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      UPDATE currency_rates
      SET rate = ?, last_updated = ?
      WHERE code = ?
    `);
    
    const now = Date.now();
    let updated = 0;
    
    for (const [code, rate] of Object.entries(rates)) {
      const result = stmt.run(rate, now, code.toUpperCase());
      updated += result.changes;
    }
    
    return updated;
  } finally {
    db.close();
  }
}

/**
 * Convert price from USD to another currency
 */
export function convertPrice(priceUSD: number, toCurrency: string): number {
  if (toCurrency === 'USD') return priceUSD;
  
  const rate = getCurrencyRate(toCurrency);
  if (!rate) return priceUSD;
  
  return Math.round(priceUSD * rate.rate * 100) / 100;
}

/**
 * Convert price between any two currencies
 */
export function convertBetweenCurrencies(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first
  let amountInUSD = amount;
  if (fromCurrency !== 'USD') {
    const fromRate = getCurrencyRate(fromCurrency);
    if (!fromRate || fromRate.rate === 0) return amount;
    amountInUSD = amount / fromRate.rate;
  }
  
  // Then convert to target currency
  if (toCurrency !== 'USD') {
    const toRate = getCurrencyRate(toCurrency);
    if (!toRate) return amountInUSD;
    return Math.round(amountInUSD * toRate.rate * 100) / 100;
  }
  
  return Math.round(amountInUSD * 100) / 100;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: string): string {
  const currencyInfo = getCurrencyRate(currency);
  const symbol = currencyInfo?.symbol || '$';
  
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get currency for country code
 */
export function getCurrencyForCountry(countryCode: string): string {
  const upperCode = countryCode.toUpperCase();
  
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency.countries.includes(upperCode)) {
      return currency.code;
    }
  }
  
  return 'USD'; // Default to USD
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(code: string): boolean {
  return SUPPORTED_CURRENCIES.some(c => c.code === code.toUpperCase());
}

