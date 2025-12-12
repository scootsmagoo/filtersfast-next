/**
 * Payment Methods Management Page
 * 
 * Manage saved payment methods (Payment Vault)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { ArrowLeft, Plus, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import SavedPaymentMethods from '@/components/payments/SavedPaymentMethods';
import AddPaymentMethod from '@/components/payments/AddPaymentMethod';

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSuccess = () => {
    setShowAddForm(false);
    setRefreshKey((prev) => prev + 1); // Trigger refresh of payment methods list
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Account
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center transition-colors">
                <CreditCard className="w-8 h-8 mr-3 text-orange-500" />
                Payment Methods
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 transition-colors">
                Manage your saved payment methods for faster checkout
              </p>
            </div>

            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            )}
          </div>
        </div>

        {/* Add Payment Method Form */}
        {showAddForm ? (
          <div className="mb-8">
            <AddPaymentMethod
              onSuccess={handleSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : (
          /* Saved Payment Methods List */
          <SavedPaymentMethods key={refreshKey} />
        )}

        {/* Info Section */}
        {!showAddForm && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2 transition-colors">
              💡 Why save a payment method?
            </h3>
            <ul className="space-y-2 text-blue-800 dark:text-blue-300 transition-colors">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Faster checkout - no need to enter card details again</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Secure - powered by Stripe, industry-leading security</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Easy management - add, remove, or set default anytime</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>PCI compliant - your card data is never stored on our servers</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

