/**
 * Saved Payment Methods Component
 * 
 * Displays and manages saved payment methods
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Trash2, Star, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  created_at: string;
  last_used_at: string | null;
}

export default function SavedPaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Focus trap and escape key for modal
  useEffect(() => {
    if (deleteId !== null) {
      // Focus modal
      modalRef.current?.focus();

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !deleting) {
          setDeleteId(null);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [deleteId, deleting]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/payment-methods');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      
      const data = await response.json();
      setPaymentMethods(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }
      
      setSuccess('Default payment method updated');
      fetchPaymentMethods();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment method');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(true);
      setError('');
      
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }
      
      setSuccess('Payment method deleted successfully');
      setDeleteId(null);
      fetchPaymentMethods();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete payment method');
    } finally {
      setDeleting(false);
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-600 dark:text-gray-300 transition-colors">Loading payment methods...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div 
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start transition-colors"
          role="alert"
          aria-live="polite"
        >
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0 transition-colors" />
          <p className="ml-3 text-green-800 dark:text-green-300 transition-colors">{success}</p>
        </div>
      )}
      
      {error && (
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start transition-colors"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0 transition-colors" />
          <p className="ml-3 text-red-800 dark:text-red-300 transition-colors">{error}</p>
        </div>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            No saved payment methods
          </h3>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">
            Add a payment method to enable faster checkout
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card 
              key={method.id}
              className={`relative ${method.is_expired ? 'opacity-60' : ''}`}
            >
              {/* Default Badge */}
              {method.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 transition-colors">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Default
                  </span>
                </div>
              )}

              {/* Expired Badge */}
              {method.is_expired && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 transition-colors">
                    Expired
                  </span>
                </div>
              )}

              <div className="flex items-start">
                {/* Card Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl transition-colors">
                    {getCardBrandLogo(method.card_brand)}
                  </div>
                </div>

                {/* Card Details */}
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                    {formatCardBrand(method.card_brand)} ••••{method.card_last4}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-colors">
                    Expires {method.card_exp_month.toString().padStart(2, '0')}/{method.card_exp_year}
                  </p>
                  {method.billing_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                      {method.billing_name}
                    </p>
                  )}
                  {method.last_used_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                      Last used: {new Date(method.last_used_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {!method.is_default && !method.is_expired && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetDefault(method.id)}
                    aria-label="Set as default payment method"
                    className="focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Set as Default
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(method.id)}
                  aria-label="Delete payment method"
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 transition-colors focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div 
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 transition-colors"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-desc"
          tabIndex={-1}
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget && !deleting) {
              setDeleteId(null);
            }
          }}
        >
          <Card className="max-w-md w-full">
            <h2 id="delete-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Delete Payment Method
            </h2>
            <p id="delete-modal-desc" className="text-gray-600 dark:text-gray-300 mb-6 transition-colors">
              Are you sure you want to remove this payment method? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800"
                aria-label="Cancel deletion"
              >
                Cancel
              </Button>
              <Button
                ref={deleteButtonRef}
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800"
                aria-label={deleting ? 'Deleting payment method' : 'Confirm deletion'}
                aria-disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

