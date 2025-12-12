/**
 * Price Component
 * Displays prices with automatic currency conversion
 */

'use client';

import React from 'react';
import { useCurrency } from '@/lib/currency-context';

interface PriceProps {
  /** Price in USD (base currency) */
  amountUSD: number;
  /** CSS classes for styling */
  className?: string;
  /** Show currency code alongside price */
  showCurrency?: boolean;
  /** Show "was" price (strike-through) for sale items */
  originalPrice?: number;
}

/**
 * Price component with automatic currency conversion
 */
export function Price({ amountUSD, className = '', showCurrency = false, originalPrice }: PriceProps) {
  const { convertPrice, formatPrice, currency, symbol } = useCurrency();

  const convertedAmount = convertPrice(amountUSD);
  const formattedPrice = formatPrice(convertedAmount);

  return (
    <span className={`price ${className}`}>
      {originalPrice && (
        <span className="line-through text-gray-500 mr-2">
          {formatPrice(convertPrice(originalPrice))}
        </span>
      )}
      <span className="font-bold">
        {formattedPrice}
        {showCurrency && currency !== 'USD' && (
          <span className="text-sm font-normal text-gray-600 ml-1">
            {currency}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Price range component (e.g., "$10.99 - $29.99")
 */
export function PriceRange({ 
  minUSD, 
  maxUSD, 
  className = '',
  showCurrency = false 
}: { 
  minUSD: number; 
  maxUSD: number; 
  className?: string;
  showCurrency?: boolean;
}) {
  const { convertPrice, formatPrice, currency } = useCurrency();

  const convertedMin = convertPrice(minUSD);
  const convertedMax = convertPrice(maxUSD);

  return (
    <span className={`price-range ${className}`}>
      {formatPrice(convertedMin)} - {formatPrice(convertedMax)}
      {showCurrency && currency !== 'USD' && (
        <span className="text-sm font-normal text-gray-600 ml-1">
          {currency}
        </span>
      )}
    </span>
  );
}

/**
 * Display price with "Starting at" prefix
 */
export function StartingAtPrice({ amountUSD, className = '' }: { amountUSD: number; className?: string }) {
  const { convertPrice, formatPrice } = useCurrency();

  return (
    <span className={`starting-price ${className}`}>
      Starting at {formatPrice(convertPrice(amountUSD))}
    </span>
  );
}

/**
 * Display savings amount
 */
export function Savings({ amountUSD, className = '' }: { amountUSD: number; className?: string }) {
  const { convertPrice, formatPrice } = useCurrency();

  return (
    <span className={`savings text-green-600 ${className}`}>
      Save {formatPrice(convertPrice(amountUSD))}
    </span>
  );
}

/**
 * Display price per unit (e.g., "$5.99 per filter")
 */
export function PricePerUnit({ 
  amountUSD, 
  unit = 'ea',
  className = '' 
}: { 
  amountUSD: number; 
  unit?: string;
  className?: string;
}) {
  const { convertPrice, formatPrice } = useCurrency();

  return (
    <span className={`price-per-unit ${className}`}>
      {formatPrice(convertPrice(amountUSD))} <span className="text-gray-600">per {unit}</span>
    </span>
  );
}

/**
 * Large hero price display (for product pages)
 */
export function HeroPrice({ 
  amountUSD, 
  originalPrice,
  className = '' 
}: { 
  amountUSD: number;
  originalPrice?: number;
  className?: string;
}) {
  const { convertPrice, formatPrice, currency } = useCurrency();

  const convertedAmount = convertPrice(amountUSD);
  const formattedPrice = formatPrice(convertedAmount);

  return (
    <div className={`hero-price ${className}`}>
      {originalPrice && (
        <div className="text-xl text-gray-500 line-through mb-1">
          {formatPrice(convertPrice(originalPrice))}
        </div>
      )}
      <div className="text-4xl font-bold text-brand-orange flex items-baseline gap-2">
        {formattedPrice}
        {currency !== 'USD' && (
          <span className="text-xl text-gray-600">
            {currency}
          </span>
        )}
      </div>
    </div>
  );
}

export default Price;

