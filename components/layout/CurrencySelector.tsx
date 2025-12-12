/**
 * Currency Selector Component
 * Allows users to select their preferred currency
 * 
 * WCAG 2.1 AA Compliant:
 * - Full keyboard navigation (Arrow keys, Enter, Escape, Home, End)
 * - Focus management and focus trap
 * - ARIA attributes for screen readers
 * - Focus visible indicators (2px ring with offset)
 * - Screen reader announcements
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/lib/currency-context';
import type { CurrencyCode } from '@/lib/types/currency';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/lib/currency-utils';

const CURRENCIES: Array<{ code: CurrencyCode; name: string; symbol: string }> = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    setIsOpen(false);
    // Return focus to trigger button
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
    // Return focus to trigger button
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      // Open menu on Enter, Space, or Arrow Down
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % CURRENCIES.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + CURRENCIES.length) % CURRENCIES.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(CURRENCIES.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleSelect(CURRENCIES[focusedIndex].code);
        }
        break;
      case 'Tab':
        // Allow natural tab behavior to close menu
        handleClose();
        break;
    }
  };

  // Focus the menu item when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const buttons = menuRef.current.querySelectorAll('[role="menuitem"]');
      const button = buttons[focusedIndex] as HTMLElement;
      button?.focus();
    }
  }, [focusedIndex, isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        aria-label={`Select currency. Current currency: ${currentCurrency.code} ${currentCurrency.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="font-semibold">{currentCurrency.symbol} {currentCurrency.code}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Menu */}
          <div 
            ref={menuRef}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-50"
            role="menu"
            aria-label="Currency selection menu"
            aria-orientation="vertical"
          >
            <div className="p-2">
              <div 
                className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                id="currency-menu-label"
              >
                Select Currency
              </div>
              {CURRENCIES.map((curr, index) => (
                <button
                  key={curr.code}
                  onClick={() => handleSelect(curr.code)}
                  onKeyDown={handleKeyDown}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${
                    currency === curr.code
                      ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  role="menuitem"
                  tabIndex={-1}
                  aria-current={currency === curr.code ? 'true' : undefined}
                  aria-label={`${curr.code} ${curr.name}, ${curr.symbol}${currency === curr.code ? ', currently selected' : ''}`}
                >
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-400" aria-hidden="true">{curr.symbol}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{curr.code}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{curr.name}</div>
                  </div>
                  {currency === curr.code && (
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div 
              className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
              role="note"
              aria-live="polite"
            >
              <p>Prices shown in your selected currency.</p>
              <p className="mt-1">Charged in USD at checkout using current exchange rates.</p>
            </div>
          </div>
          
          {/* Screen reader announcement */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {isOpen && 'Currency selection menu opened. Use arrow keys to navigate, Enter to select, Escape to close.'}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact Currency Selector for Mobile
 * WCAG 2.1 AA Compliant with proper labeling and focus indicators
 */
export function CurrencySelectorCompact() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency-select" className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Currency:
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        aria-label="Select currency for price display"
      >
        {CURRENCIES.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code} - {curr.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Currency Badge - Shows current currency without dropdown
 */
export function CurrencyBadge() {
  const { currency, symbol } = useCurrency();

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded">
      <span>{symbol}</span>
      <span>{currency}</span>
    </div>
  );
}

