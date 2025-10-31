/**
 * Currency Type Definitions
 */

export type CurrencyCode = 'USD' | 'CAD' | 'AUD' | 'EUR' | 'GBP';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rate: number;
  lastUpdated: Date;
}

export interface CurrencyConversion {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  convertedAmount: number;
  rate: number;
}

export interface CurrencyPreference {
  userId: string;
  currency: CurrencyCode;
  autoDetect: boolean;
  updatedAt: Date;
}

export interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export interface PriceDisplay {
  amount: number;
  currency: CurrencyCode;
  formatted: string;
  originalAmount?: number;
  originalCurrency?: CurrencyCode;
}

