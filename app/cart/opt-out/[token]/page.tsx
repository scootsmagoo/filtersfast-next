/**
 * Opt-Out from Abandoned Cart Emails
 * Unsubscribe from cart recovery reminders
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CartOptOutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [optedOut, setOptedOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptOut = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/abandoned-carts/opt-out/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to opt out');
      }

      setOptedOut(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (optedOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center" role="main">
          <div className="text-6xl mb-4" role="img" aria-label="Checkmark">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You've Been Unsubscribed
          </h1>
          <div role="status" aria-live="polite">
            <p className="text-gray-600 mb-6">
              You will no longer receive abandoned cart reminder emails for this cart.
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            <strong>Note:</strong> You may still receive order confirmations, shipping updates, and other transactional emails.
          </p>
          <nav className="space-y-3" aria-label="Navigation options">
            <Button 
              onClick={() => router.push('/')} 
              variant="primary" 
              className="w-full"
              aria-label="Return to homepage"
            >
              Return to Homepage
            </Button>
            <Button 
              onClick={() => router.push('/support')} 
              variant="outline" 
              className="w-full"
              aria-label="Contact customer support"
            >
              Contact Support
            </Button>
          </nav>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8" role="main">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unsubscribe from Cart Reminders
          </h1>
          <p className="text-gray-600">
            We're sorry to see you go. You won't receive any more reminder emails about this cart.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" role="note">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This only unsubscribes you from abandoned cart reminders. 
            You'll still receive important transactional emails like order confirmations and shipping updates.
          </p>
        </div>

        <div className="space-y-3" role="group" aria-labelledby="opt-out-actions">
          <span id="opt-out-actions" className="sr-only">Unsubscribe options</span>
          <Button
            onClick={handleOptOut}
            variant="primary"
            className="w-full"
            disabled={loading}
            aria-disabled={loading}
            aria-label={loading ? 'Processing unsubscribe request' : 'Confirm unsubscribe from cart reminders'}
          >
            {loading ? (
              <>
                <span aria-hidden="true">Unsubscribing...</span>
                <span className="sr-only">Processing unsubscribe request, please wait</span>
              </>
            ) : (
              'Confirm Unsubscribe'
            )}
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
            aria-label="Cancel and return to homepage"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center" role="complementary" aria-label="Alternative actions">
          <p className="text-sm text-gray-600 mb-3">
            Changed your mind? Your cart is still waiting for you!
          </p>
          <Button
            onClick={() => router.push(`/cart/recover/${token}`)}
            variant="secondary"
            className="w-full"
            aria-label="View cart instead of unsubscribing"
          >
            View My Cart
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? <a 
              href="/support" 
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
            >
              Contact Support
            </a> or call <a 
              href="tel:1-866-301-3905"
              className="font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
            >
              1-866-301-3905
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}

