'use client';

import { useId, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Bell, CheckCircle, Mail } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface BackorderNotifyProps {
  productId: string;
  productName: string;
  productSku?: string;
  optionId?: string | null;
  optionLabel?: string | null;
  prefillEmail?: string | null;
  reason: 'product' | 'option';
}

export default function BackorderNotify({
  productId,
  productName,
  productSku,
  optionId,
  optionLabel,
  prefillEmail,
  reason,
}: BackorderNotifyProps) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const inputId = useId();
  const feedbackId = useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL_REGEX.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const response = await fetch('/api/backorder-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productId,
          optionId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to save your request.');
      }

      setStatus('success');
      setMessage('Thanks! We will email you as soon as this item is available.');
    } catch (error: any) {
      console.error('Backorder request failed:', error);
      setStatus('error');
      setMessage(error.message || 'Something went wrong. Please try again later.');
    }
  };

  const disabled = status === 'success';

  return (
    <Card className="p-5 bg-white dark:bg-gray-800 border border-dashed border-brand-orange/50 dark:border-orange-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Bell className="w-5 h-5 text-brand-orange" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
            Get notified when it’s back in stock
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-colors">
            {reason === 'option'
              ? optionLabel
                ? `The selected option (${optionLabel}) is currently unavailable. Enter your email and we’ll let you know as soon as it returns.`
                : 'The selected option is currently unavailable. Enter your email and we’ll let you know as soon as it returns.'
              : 'This product is temporarily out of stock. We’ll email you as soon as it’s available again.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
              Email address
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  id={inputId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={disabled}
                  required
                  aria-invalid={status === 'error'}
                  aria-describedby={message ? feedbackId : undefined}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
                />
              </div>
              <Button
                type="submit"
                disabled={disabled || status === 'loading'}
                className="whitespace-nowrap"
              >
                {status === 'loading' ? 'Submitting…' : 'Notify Me'}
              </Button>
            </div>
          </form>

          {message && (
            <div
              className={`mt-3 flex items-center gap-2 text-sm ${
                status === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
              role="status"
              aria-live="polite"
              id={feedbackId}
            >
              {status === 'success' ? (
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Bell className="w-4 h-4" aria-hidden="true" />
              )}
              {message}
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 transition-colors">
            We’ll only use your email for this notification. Product:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">
              {productName}
              {productSku ? ` (${productSku})` : ''}
            </span>
            {optionLabel ? ` • Option: ${optionLabel}` : ''}
          </p>
        </div>
      </div>
    </Card>
  );
}


