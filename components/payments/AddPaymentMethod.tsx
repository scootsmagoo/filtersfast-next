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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Confirm the SetupIntent
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Failed to save payment method');
        setLoading(false);
        return;
      }

      if (!setupIntent || !setupIntent.payment_method) {
        setError('Failed to save payment method');
        setLoading(false);
        return;
      }

      // Save to our database
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: setupIntent.payment_method,
          is_default: setAsDefault,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save payment method');
      }

      // Success!
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save payment method');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div 
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="ml-3 text-red-800">{error}</p>
        </div>
      )}

      {/* Stripe Payment Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2" id="card-info-label">
          Card Information
        </label>
        <div 
          className="border border-gray-300 rounded-lg p-4 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500"
          role="group"
          aria-labelledby="card-info-label"
        >
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600">
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
        <label htmlFor="set-default" className="ml-2 block text-sm text-gray-700">
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
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Save Card
            </>
          )}
        </Button>
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
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-3 text-gray-600">Loading payment form...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div 
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-red-800 mb-2">{error}</p>
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
      theme: 'stripe',
      variables: {
        colorPrimary: '#f97316',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Add New Payment Method
      </h2>
      
      <Elements stripe={stripePromise} options={options}>
        <AddPaymentMethodForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>

      {/* Security Note */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">
              Your payment information is secure
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              We use Stripe to process payments securely. Your card information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

