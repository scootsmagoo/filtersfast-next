'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const CONSENT_COOKIE = 'ff_cookie_consent';
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

type ConsentValue = 'all' | 'necessary';

function readConsentCookie(): ConsentValue | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const target = `${encodeURIComponent(CONSENT_COOKIE)}=`;
  const parts = document.cookie ? document.cookie.split(';') : [];

  for (const raw of parts) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(target)) {
      const value = decodeURIComponent(trimmed.substring(target.length));
      if (value === 'all' || value === 'necessary') {
        return value;
      }
      return null;
    }
  }

  return null;
}

function buildCookieString(value: ConsentValue): string {
  const base = `${encodeURIComponent(CONSENT_COOKIE)}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE_SECONDS};SameSite=Lax`;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `${base};Secure`;
  }
  return base;
}

function persistConsent(value: ConsentValue): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = buildCookieString(value);
}

interface CookieBannerProps {
  initialConsent: ConsentValue | null;
}

export default function CookieBanner({ initialConsent }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(() => initialConsent === null);
  const [currentConsent, setCurrentConsent] = useState<ConsentValue | null>(initialConsent);

  useEffect(() => {
    if (initialConsent !== null) {
      return;
    }

    const detected = readConsentCookie();
    if (detected !== null) {
      setCurrentConsent(detected);
      setIsVisible(false);
    }
  }, [initialConsent]);

  const handleConsent = useCallback(
    (value: ConsentValue) => {
      persistConsent(value);
      setCurrentConsent(value);
      setIsVisible(false);
    },
    []
  );

  const bannerClassName = useMemo(
    () =>
      'fixed bottom-0 inset-x-0 z-[60] bg-white dark:bg-slate-900 border-t border-slate-400 dark:border-slate-600 shadow-lg',
    []
  );

  if (!isVisible || currentConsent === 'all' || currentConsent === 'necessary') {
    return null;
  }

  return (
    <div
      className={bannerClassName}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie usage notification"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-800 dark:text-slate-200">
          We use cookies to improve your experience, analyse site traffic, and serve personalised offers. By continuing to
          browse, you agree to our{' '}
          <a href="/terms" className="font-semibold text-brand-blue-link underline hover:text-brand-blue-link-hover">
            Cookie Policy
          </a>
          .
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => handleConsent('all')}
            className="w-full whitespace-nowrap rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark sm:w-auto"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={() => handleConsent('necessary')}
            className="w-full whitespace-nowrap rounded-full border border-brand-blue px-5 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/10 sm:w-auto"
          >
            Necessary Only
          </button>
          <button
            type="button"
            onClick={() => handleConsent('all')}
            className="w-full whitespace-nowrap rounded-full border border-transparent px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:w-auto"
            aria-label="Close cookie banner"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


