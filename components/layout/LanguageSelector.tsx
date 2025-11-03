/**
 * Language Selector Component
 * Dropdown to switch between supported languages
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/language-context';
import { SUPPORTED_LANGUAGES } from '@/lib/types/i18n';
import type { LanguageCode } from '@/lib/types/i18n';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === language);

  const handleLanguageChange = (newLang: LanguageCode) => {
    setLanguage(newLang);
    setIsOpen(false);
  };

  // Hide language selector until translations are generated
  // Uncomment this return to show the selector once translations are ready
  return null;

  /* eslint-disable-next-line no-unreachable */
  return (
    <div ref={dropdownRef} className="relative">
      <button
        id="language-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
        aria-label={`Select language. Current language: ${currentLanguage?.name || 'English'}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="language-menu"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {currentLanguage?.code.toUpperCase() || 'EN'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="language-menu"
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu-button"
        >
          <div className="py-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  language === lang.code ? 'bg-brand-orange bg-opacity-10 dark:bg-opacity-20' : ''
                }`}
                role="menuitem"
                aria-current={language === lang.code ? 'page' : undefined}
                aria-label={`${lang.name} (${lang.native_name})${language === lang.code ? ' - Current language' : ''}`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {lang.flag_emoji}
                </span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {lang.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {lang.native_name}
                  </div>
                </div>
                {language === lang.code && (
                  <svg
                    className="w-5 h-5 text-brand-orange"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
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
        </div>
      )}
    </div>
  );
}

