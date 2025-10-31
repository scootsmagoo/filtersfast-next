'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  CheckCircle, AlertCircle, Loader2, Mail, BellOff, 
  Shield, ArrowRight, Home
} from 'lucide-react';
import Link from 'next/link';

interface TokenInfo {
  email: string;
  type: 'unsubscribe' | 'preferences';
  valid: boolean;
}

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/newsletter/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setTokenInfo(data.tokenInfo);
      } else {
        setError(data.error || 'This unsubscribe link is invalid or has expired.');
      }
    } catch (err) {
      setError('An error occurred while validating your unsubscribe link.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setProcessing(true);
    setError('');
    
    try {
      const response = await fetch(`/api/newsletter/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while processing your request.');
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        {/* WCAG: Live region for loading status */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-300">Validating your unsubscribe request...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 flex items-center justify-center">
        {/* WCAG: Announce success to screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          You have been successfully unsubscribed from marketing emails
        </div>
        
        <div className="container-custom max-w-2xl">
          <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                You've Been Unsubscribed
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                You will no longer receive marketing emails from FiltersFast.
              </p>
              {tokenInfo?.email && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Email: {tokenInfo.email}
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 text-left">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-2">What This Means:</p>
                  <ul className="space-y-1">
                    <li>• You won't receive promotional newsletters or marketing emails</li>
                    <li>• You'll still receive order confirmations and shipping updates</li>
                    <li>• You'll still receive critical security notifications</li>
                    <li>• You can resubscribe anytime from your account settings</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Changed your mind? You can update your email preferences at any time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </Button>
                </Link>
                <Link href="/account/newsletter">
                  <Button className="w-full sm:w-auto">
                    <Mail className="w-4 h-4 mr-2" />
                    Manage Preferences
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                If you didn't request this unsubscribe or believe this was done in error, 
                please <a href="mailto:support@filtersfast.com" className="text-brand-orange hover:text-brand-orange-dark">contact our support team</a>.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 flex items-center justify-center">
        {/* WCAG: Announce error to screen readers */}
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          Error: {error}
        </div>
        
        <div className="container-custom max-w-2xl">
          <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Unable to Process Request
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {error}
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-6">
              <div className="text-sm text-amber-800 dark:text-amber-300 text-left">
                <p className="font-semibold mb-2">Common Issues:</p>
                <ul className="space-y-1">
                  <li>• The unsubscribe link may have expired</li>
                  <li>• The link may have already been used</li>
                  <li>• The link may be incomplete or corrupted</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You can still manage your email preferences by signing into your account.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button className="w-full sm:w-auto">
                    Sign In to Manage Preferences
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Need assistance? Contact us at{' '}
                <a href="mailto:support@filtersfast.com" className="text-brand-orange hover:text-brand-orange-dark">
                  support@filtersfast.com
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Confirmation state (before unsubscribe)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 flex items-center justify-center">
      <div className="container-custom max-w-2xl">
        <Card className="p-8 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-brand-orange" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Confirm Unsubscribe
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to unsubscribe from our emails?
            </p>
            {tokenInfo?.email && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Email: <span className="font-medium">{tokenInfo.email}</span>
              </p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              What you'll miss:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>Exclusive promotions and special discounts</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>New product announcements and updates</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>Helpful tips for filter maintenance</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>Filter replacement reminders</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> You'll still receive important transactional emails such as 
              order confirmations, shipping updates, and critical security notifications.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full">
                Keep Me Subscribed
              </Button>
            </Link>
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                variant="secondary"
                className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                aria-label="Confirm unsubscribe from newsletter"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                    Unsubscribing...
                  </>
                ) : (
                  'Yes, Unsubscribe Me'
                )}
              </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Want to customize what emails you receive?{' '}
              <Link href="/account/newsletter" className="text-brand-orange hover:text-brand-orange-dark">
                Manage your preferences
              </Link>
            </p>
          </div>
        </Card>

        {/* GDPR Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            This unsubscribe is processed in accordance with GDPR and CAN-SPAM regulations.
            Your privacy is important to us.
          </p>
        </div>
      </div>
    </div>
  );
}

