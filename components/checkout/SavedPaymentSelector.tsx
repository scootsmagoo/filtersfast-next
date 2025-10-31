/**
 * Saved Payment Method Selector for Checkout
 * 
 * Allows customers to select from saved payment methods or add new one
 */

'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Loader2, AlertCircle, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface PaymentMethod {
  id: number;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  is_expired: boolean;
  billing_name: string | null;
}

interface SavedPaymentSelectorProps {
  onSelectPaymentMethod: (paymentMethodId: number | null) => void;
  selectedPaymentMethodId: number | null;
  onAddNew: () => void;
}

export default function SavedPaymentSelector({
  onSelectPaymentMethod,
  selectedPaymentMethodId,
  onAddNew,
}: SavedPaymentSelectorProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/payment-methods');

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      const validMethods = data.filter((pm: PaymentMethod) => !pm.is_expired);
      setPaymentMethods(validMethods);

      // Auto-select default payment method
      const defaultMethod = validMethods.find((pm: PaymentMethod) => pm.is_default);
      if (defaultMethod && !selectedPaymentMethodId) {
        onSelectPaymentMethod(defaultMethod.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const getCardBrandLogo = (brand: string) => {
    const logos: Record<string, string> = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
    };
    return logos[brand.toLowerCase()] || '💳';
  };

  const formatCardBrand = (brand: string) => {
    const names: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
    };
    return names[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-600 dark:text-gray-300 transition-colors">Loading payment methods...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start transition-colors"
        role="alert"
      >
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <p className="ml-3 text-red-800 dark:text-red-300 transition-colors">{error}</p>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Card className="text-center py-8">
        <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors">No saved payment methods</p>
        <Button size="sm" onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
          Select Payment Method
        </h3>
        <Button size="sm" variant="secondary" onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelectPaymentMethod(method.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedPaymentMethodId === method.id
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
            aria-pressed={selectedPaymentMethodId === method.id}
          >
            <div className="flex items-center">
              {/* Radio Circle */}
              <div className="flex-shrink-0 mr-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethodId === method.id
                      ? 'border-orange-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selectedPaymentMethodId === method.id && (
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  )}
                </div>
              </div>

              {/* Card Icon */}
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl transition-colors">
                  {getCardBrandLogo(method.card_brand)}
                </div>
              </div>

              {/* Card Details */}
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                    {formatCardBrand(method.card_brand)} ••••{method.card_last4}
                  </span>
                  {method.is_default && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 transition-colors">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                  Expires {method.card_exp_month.toString().padStart(2, '0')}/
                  {method.card_exp_year}
                </p>
                {method.billing_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{method.billing_name}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Security Note */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 flex items-center transition-colors">
        <CreditCard className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
        <span>
          Your payment information is encrypted and secure
        </span>
      </div>
    </div>
  );
}

