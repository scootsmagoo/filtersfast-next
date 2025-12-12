'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  Mail, CheckCircle, AlertCircle, Loader2, ArrowLeft, 
  Bell, BellOff, Shield, Info
} from 'lucide-react';
import Link from 'next/link';

interface NewsletterPreferences {
  newsletter: boolean;
  emailNotifications: boolean;
  productReminders: boolean;
}

export default function NewsletterPreferencesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  
  const [preferences, setPreferences] = useState<NewsletterPreferences>({
    newsletter: true,
    emailNotifications: true,
    productReminders: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  // Load preferences
  useEffect(() => {
    if (session?.user) {
      loadPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({
            newsletter: data.preferences.newsletter,
            emailNotifications: data.preferences.emailNotifications,
            productReminders: data.preferences.productReminders,
          });
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleUpdatePreferences = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Your newsletter preferences have been updated successfully!');
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/newsletter/unsubscribe-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setPreferences({
          newsletter: false,
          emailNotifications: false,
          productReminders: false,
        });
        setSuccess('You have been unsubscribed from all newsletter emails.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      {/* WCAG: Live region for status announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {error && `Error: ${error}`}
        {success && `Success: ${success}`}
      </div>
      
      <div className="container-custom max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/account/settings"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-8 h-8 text-brand-orange" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Newsletter Preferences</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your email communication preferences. You have full control over what you receive.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* GDPR Notice */}
        <Card className="p-6 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Your Privacy Matters
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                We're committed to protecting your privacy and complying with GDPR and CAN-SPAM regulations. 
                You can update your preferences at any time, and we'll never share your information with third parties 
                without your explicit consent. All marketing emails include an unsubscribe link.
              </p>
            </div>
          </div>
        </Card>

        {/* Preferences Card */}
        <Card className="p-8 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Email Communication Preferences
          </h2>

          <div className="space-y-6">
            {/* Newsletter */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="newsletter"
                  type="checkbox"
                  checked={preferences.newsletter}
                  onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                  className="w-5 h-5 text-brand-orange bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-orange focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-brand-orange" />
                  <label htmlFor="newsletter" className="font-medium text-gray-900 dark:text-gray-100">
                    FiltersFast Newsletter
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Receive our newsletter with new products, exclusive offers, seasonal promotions, and helpful tips 
                  for maintaining your filters.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Frequency: 2-4 emails per month
                </p>
              </div>
            </div>

            {/* Product Reminders */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="productReminders"
                  type="checkbox"
                  checked={preferences.productReminders}
                  onChange={(e) => setPreferences({ ...preferences, productReminders: e.target.checked })}
                  className="w-5 h-5 text-brand-orange bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-orange focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-brand-orange" />
                  <label htmlFor="productReminders" className="font-medium text-gray-900 dark:text-gray-100">
                    Filter Replacement Reminders
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Get timely reminders when it's time to replace your filters based on your purchase history 
                  and typical replacement schedules.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Frequency: Based on your filter replacement schedule (typically every 3-6 months)
                </p>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="flex items-start gap-4">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  className="w-5 h-5 text-brand-orange bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-orange focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-brand-orange" />
                  <label htmlFor="emailNotifications" className="font-medium text-gray-900 dark:text-gray-100">
                    Transactional Emails
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Receive important account notifications including order confirmations, shipping updates, 
                  password changes, and security alerts.
                </p>
                <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> For account security, critical security notifications cannot be disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleUpdatePreferences}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Unsubscribe All Section */}
        <Card className="p-6 mt-6 border-gray-300 dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-start gap-4">
            <BellOff className="w-6 h-6 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Unsubscribe from All Emails
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                If you no longer wish to receive any marketing emails from us, you can unsubscribe from 
                everything at once. You'll still receive critical security notifications.
              </p>
              <Button
                onClick={() => setShowUnsubscribeConfirm(true)}
                variant="secondary"
                disabled={loading}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                aria-label="Unsubscribe from all marketing emails"
              >
                Unsubscribe from All Marketing Emails
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-6 mt-6 bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            If you're having trouble managing your preferences or have questions about our emails:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>• Contact our support team at <a href="mailto:support@filtersfast.com" className="text-brand-orange hover:text-brand-orange-dark">support@filtersfast.com</a></li>
            <li>• Visit our <Link href="/support" className="text-brand-orange hover:text-brand-orange-dark">Help Center</Link></li>
            <li>• Review our <Link href="/support/privacy" className="text-brand-orange hover:text-brand-orange-dark">Privacy Policy</Link></li>
          </ul>
        </Card>

        {/* Legal Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Your preferences are processed in accordance with our Privacy Policy and applicable data protection laws 
            including GDPR and CAN-SPAM. Changes take effect immediately.
          </p>
        </div>
      </div>

      {/* WCAG: Accessible Confirmation Dialog */}
      {showUnsubscribeConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsubscribe-dialog-title"
          aria-describedby="unsubscribe-dialog-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUnsubscribeConfirm(false);
            }
          }}
        >
          <Card className="max-w-md w-full p-6 dark:bg-gray-800 dark:border-gray-700">
            <h2
              id="unsubscribe-dialog-title"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3"
            >
              Unsubscribe from All Marketing Emails?
            </h2>
            <p
              id="unsubscribe-dialog-description"
              className="text-gray-600 dark:text-gray-400 mb-6"
            >
              Are you sure you want to unsubscribe from all newsletter emails? You can re-subscribe at any time.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowUnsubscribeConfirm(false)}
                aria-label="Cancel unsubscribe"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowUnsubscribeConfirm(false);
                  handleUnsubscribeAll();
                }}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
                aria-label="Confirm unsubscribe from all emails"
              >
                {loading ? 'Unsubscribing...' : 'Yes, Unsubscribe'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

