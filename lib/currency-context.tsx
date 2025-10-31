/**
 * Currency Context Provider
 * Manages currency selection and conversion rates across the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CurrencyCode } from './types/currency';
import { getCurrencySymbol, convertPriceClient } from './currency-utils';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: Record<string, number>;
  isLoading: boolean;
  convertPrice: (priceUSD: number) => number;
  formatPrice: (amount: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: CurrencyCode;
}

const CURRENCY_STORAGE_KEY = 'filterfast_currency';

export function CurrencyProvider({ children, initialCurrency }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency || 'USD');
  const [rates, setRates] = useState<Record<string, number>>({
    USD: 1.0,
    CAD: 1.0,
    AUD: 1.0,
    EUR: 1.0,
    GBP: 1.0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load saved currency preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && ['USD', 'CAD', 'AUD', 'EUR', 'GBP'].includes(saved)) {
        setCurrencyState(saved as CurrencyCode);
      }
    }
  }, []);

  // Fetch exchange rates on mount
  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch('/api/currency/rates');
        const data = await response.json();
        
        if (data.success && data.rates) {
          const ratesMap: Record<string, number> = {};
          for (const [code, info] of Object.entries(data.rates)) {
            ratesMap[code] = (info as any).rate;
          }
          setRates(ratesMap);
        }
      } catch (error) {
        console.error('Failed to fetch currency rates:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    }
  };

  const convertPrice = (priceUSD: number): number => {
    return convertPriceClient(priceUSD, currency, rates);
  };

  const formatPrice = (amount: number): string => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    rates,
    isLoading,
    convertPrice,
    formatPrice,
    symbol: getCurrencySymbol(currency),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to use currency context
 */
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

/**
 * Hook to convert and format a USD price in the current currency
 */
export function usePrice(priceUSD: number) {
  const { convertPrice, formatPrice, currency } = useCurrency();
  const converted = convertPrice(priceUSD);
  const formatted = formatPrice(converted);
  
  return {
    amount: converted,
    formatted,
    currency,
  };
}

/**
 * Hook to detect user's currency from geo-location
 */
export function useGeoDetectCurrency() {
  const { setCurrency } = useCurrency();
  
  useEffect(() => {
    // Check if user has already set a preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved) return; // Don't override user preference
    }
    
    // Try to detect from browser/location
    async function detectCurrency() {
      try {
        // Try Cloudflare trace API (works on edge deployments)
        const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
        const data = await response.text();
        const locMatch = data.match(/loc=([A-Z]{2})/);
        
        if (locMatch) {
          const countryCode = locMatch[1];
          // Map country to currency
          const currencyMap: Record<string, CurrencyCode> = {
            CA: 'CAD',
            AU: 'AUD',
            GB: 'GBP',
            UK: 'GBP',
            AT: 'EUR', BE: 'EUR', FR: 'EUR', DE: 'EUR',
            GR: 'EUR', IE: 'EUR', IT: 'EUR', NL: 'EUR', ES: 'EUR',
          };
          
          const detectedCurrency = currencyMap[countryCode];
          if (detectedCurrency) {
            setCurrency(detectedCurrency);
          }
        }
      } catch (error) {
        // Silently fail - user can manually select currency
        console.debug('Could not detect currency from location:', error);
      }
    }
    
    detectCurrency();
  }, [setCurrency]);
}

