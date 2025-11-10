'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface GiftCardBalanceResponse {
  success: boolean;
  giftCard?: {
    code: string;
    balance: number;
    currency: string;
    status: string;
    recipientName?: string;
    issuedAt?: number;
    lastRedeemedAt?: number;
  };
  error?: string;
  error_code?: string;
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export default function GiftCardsPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GiftCardBalanceResponse['giftCard'] | null>(null);

  const handleLookup = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Please enter a gift card code.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/gift-cards/balance?code=${encodeURIComponent(trimmedCode)}`);
      const data = (await response.json()) as GiftCardBalanceResponse;

      if (!response.ok || !data.success || !data.giftCard) {
        throw new Error(data.error || 'Unable to find that gift card.');
      }

      setResult(data.giftCard);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to look up that gift card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-10 space-y-8">
        <section className="max-w-4xl space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
            FiltersFast Digital Gift Cards
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 transition-colors">
            Gift the convenience of clean air and water. FiltersFast digital gift cards are delivered instantly
            by email and never expire. Choose any amount and add a personal message for the recipient.
          </p>
          <div>
            <Link
              href="/products/filtersfast-gift-card"
              className="inline-flex items-center gap-2 text-brand-orange hover:text-orange-600 font-semibold transition-colors"
            >
              Purchase a gift card &rarr;
            </Link>
          </div>
        </section>

        <Card className="p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
              Check your gift card balance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
              Enter the 12-character code from your email. You can redeem your gift card during checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <label
                htmlFor="gift-card-code"
                className="inline-block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                Gift card code
              </label>
              <input
                id="gift-card-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleLookup();
                  }
                }}
                placeholder="XXXX-XXXX-XXXX"
                aria-describedby="gift-card-help"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors uppercase tracking-widest"
                inputMode="text"
                autoComplete="off"
              />
              <p
                id="gift-card-help"
                className="text-xs text-gray-500 dark:text-gray-400 transition-colors"
              >
                Enter the 12-character code from your FiltersFast gift card email.
              </p>
            </div>
            <Button onClick={handleLookup} disabled={loading}>
              {loading ? 'Checking...' : 'Check Balance'}
            </Button>
          </div>

          {error && (
            <div
              className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300 transition-colors"
              role="alert"
            >
              {error}
            </div>
          )}

          {result && (
            <div
              className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 space-y-2 transition-colors"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
                {result.code}
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-200">
                {formatCurrency(result.balance, result.currency)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-300">
                Status: {result.status.replace(/-/g, ' ')}
              </p>
              {result.lastRedeemedAt && (
                <p className="text-xs text-green-600 dark:text-green-300">
                  Last used on {new Date(result.lastRedeemedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6 max-w-4xl space-y-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
            Gift card FAQs
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 transition-colors list-disc list-inside">
            <li>Digital gift cards are delivered instantly via email with your personal message.</li>
            <li>Gift cards never expire and can be redeemed on any FiltersFast purchase.</li>
            <li>Multiple gift cards can be applied to a single order during checkout.</li>
            <li>
              Need help? Contact{' '}
              <a href="mailto:support@filtersfast.com" className="text-brand-orange hover:text-orange-600">
                support@filtersfast.com
              </a>
              .
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

