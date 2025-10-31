/**
 * Add Payment Method Component
 * 
 * Uses Stripe Elements to securely collect card information
 */

'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AddPaymentMethodForm({ onSuccess, onCancel }: AddPaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setStatusMessage('Processing your payment method...');

      // Confirm the SetupIntent
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (stripeError) {
        // OWASP A04: Generic error messages to prevent information disclosure
        const safeMessage = stripeError.code === 'card_declined' 
          ? 'Card was declined. Please try a different card.'
          : 'Unable to process payment method. Please verify your information and try again.';
        setError(safeMessage);
        setStatusMessage('');
        setLoading(false);
        
        // OWASP A09: Log security-relevant events (sanitized)
        console.error('[SECURITY] Payment method setup failed:', {
          error_code: stripeError.code,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!setupIntent || !setupIntent.payment_method) {
        setError('Unable to complete setup. Please try again.');
        setStatusMessage('');
        setLoading(false);
        return;
      }

      setStatusMessage('Saving payment method...');

      // Save to our database with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method_id: setupIntent.payment_method,
            is_default: setAsDefault,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // OWASP A04: Generic error messages
          throw new Error('Unable to save payment method. Please try again or contact support.');
        }

        // WCAG 4.1.3: Announce success to screen readers
        setStatusMessage('Payment method saved successfully!');
        
        // Small delay to allow screen reader announcement
        setTimeout(() => onSuccess(), 500);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      // OWASP A04: Generic error message
      const safeMessage = err.message || 'Unable to save payment method. Please try again.';
      setError(safeMessage);
      setStatusMessage('');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* WCAG 4.1.3: Status message announcement for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      {error && (
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start transition-colors"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="ml-3 text-red-800 dark:text-red-300 transition-colors">{error}</p>
        </div>
      )}

      {/* Stripe Payment Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors" id="card-info-label">
          Card Information
        </label>
        <div 
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 bg-white dark:bg-gray-700 transition-colors"
          role="group"
          aria-labelledby="card-info-label"
        >
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 transition-colors">
          <span className="sr-only">Security notice:</span>
          Your card information is encrypted and secure. We use Stripe to process payments.
        </p>
      </div>

      {/* Set as Default Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="set-default"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          disabled={loading}
          className="h-4 w-4 text-orange-500 focus:ring-orange-500 focus:ring-2 border-gray-300 rounded disabled:opacity-50"
          aria-describedby="set-default-desc"
        />
        <label htmlFor="set-default" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
          Set as default payment method
        </label>
        <span id="set-default-desc" className="sr-only">
          The default payment method will be automatically selected at checkout
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1"
          aria-describedby={!stripe ? 'stripe-loading-notice' : undefined}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>Save Card</span>
            </>
          )}
        </Button>
        {!stripe && (
          <span id="stripe-loading-notice" className="sr-only">
            Payment form is still loading. Please wait.
          </span>
        )}
      </div>
    </form>
  );
}

interface AddPaymentMethodProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddPaymentMethod({ onSuccess, onCancel }: AddPaymentMethodProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Create SetupIntent
    fetch('/api/payment-methods/setup-intent', {
      method: 'POST',
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to initialize');
        }
        return response.json();
      })
      .then((data) => {
        setClientSecret(data.client_secret);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize payment form');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" aria-hidden="true" />
          <span className="ml-3 text-gray-600 dark:text-gray-300 transition-colors">Loading payment form...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start transition-colors"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="ml-3 flex-1">
            <p className="text-red-800 dark:text-red-300 mb-2 transition-colors">{error}</p>
            <Button size="sm" variant="secondary" onClick={onCancel}>
              Go Back
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: isDarkMode ? 'night' : 'stripe',
      variables: {
        colorPrimary: '#f97316',
        colorBackground: isDarkMode ? '#374151' : '#ffffff',
        colorText: isDarkMode ? '#f3f4f6' : '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
        Add New Payment Method
      </h2>
      
      <Elements stripe={stripePromise} options={options}>
        <AddPaymentMethodForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>

      {/* Security Note */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-colors" role="note">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
              Your payment information is secure
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-colors">
              We use Stripe to process payments securely. Your card information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

