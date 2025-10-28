/**
 * React Hook for reCAPTCHA v3 Integration
 */

import { useState, useCallback, useEffect } from 'react';
import { executeRecaptcha, RecaptchaAction, loadRecaptchaScript } from '@/lib/recaptcha';

interface UseRecaptchaOptions {
  autoLoad?: boolean; // Automatically load the script on mount
}

interface UseRecaptchaReturn {
  executeRecaptcha: (action: RecaptchaAction) => Promise<string>;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

/**
 * Hook for using reCAPTCHA v3 in React components
 * 
 * @example
 * const { executeRecaptcha, isReady } = useRecaptcha();
 * 
 * const handleSubmit = async () => {
 *   const token = await executeRecaptcha(RecaptchaAction.SIGN_UP);
 *   // Use token in API call
 * };
 */
export function useRecaptcha(options: UseRecaptchaOptions = {}): UseRecaptchaReturn {
  const { autoLoad = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Load the reCAPTCHA script on mount
  useEffect(() => {
    if (!autoLoad) return;
    
    // If no site key is configured, mark as ready (forms will work without reCAPTCHA)
    if (!siteKey) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('reCAPTCHA site key is not configured. Forms will work without bot protection.');
      }
      setIsReady(true);
      setError(null);
      return;
    }

    setIsLoading(true);
    loadRecaptchaScript(siteKey)
      .then(() => {
        setIsReady(true);
        setError(null);
      })
      .catch((err) => {
        // Only log detailed errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load reCAPTCHA script:', err);
        }
        setError('Failed to load reCAPTCHA');
        // Still mark as ready so forms work
        setIsReady(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [autoLoad, siteKey]);

  /**
   * Execute reCAPTCHA and get a token
   */
  const execute = useCallback(
    async (action: RecaptchaAction): Promise<string> => {
      // If no site key, return empty string (forms will skip verification)
      if (!siteKey) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('reCAPTCHA not configured - skipping verification');
        }
        return '';
      }

      try {
        setError(null);
        const token = await executeRecaptcha(siteKey, action);
        return token;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to execute reCAPTCHA';
        setError(errorMessage);
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('reCAPTCHA execution failed, continuing without verification:', err);
        }
        // Return empty string instead of throwing - let form continue
        return '';
      }
    },
    [siteKey]
  );

  return {
    executeRecaptcha: execute,
    isLoading,
    isReady,
    error,
  };
}

