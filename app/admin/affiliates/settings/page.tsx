'use client';

/**
 * Admin Affiliate Settings Page
 * 
 * Configure affiliate program settings
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { AffiliateSettings } from '@/lib/types/affiliate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function AffiliateSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/affiliates/settings');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/affiliates/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings' });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    // SECURITY: Client-side validation before submission
    if (settings.default_commission_rate < 0 || settings.default_commission_rate > 100) {
      setMessage({ type: 'error', text: 'Commission rate must be between 0 and 100' });
      return;
    }

    if (settings.cookie_duration_days < 1 || settings.cookie_duration_days > 365) {
      setMessage({ type: 'error', text: 'Cookie duration must be between 1 and 365 days' });
      return;
    }

    if (settings.minimum_payout_threshold < 0) {
      setMessage({ type: 'error', text: 'Minimum payout threshold must be positive' });
      return;
    }

    if (settings.commission_hold_days < 0 || settings.commission_hold_days > 365) {
      setMessage({ type: 'error', text: 'Commission hold period must be between 0 and 365 days' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/affiliates/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse space-y-4" role="status" aria-live="polite">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <span className="sr-only">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!session?.user || !settings) {
    return null;
  }

  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 id="main-content" className="text-3xl font-bold mb-2 flex items-center gap-3" tabIndex={-1}>
                  <Settings className="w-8 h-8 text-brand-orange" aria-hidden="true" />
                  Affiliate Program Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure your affiliate program parameters
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/affiliates')}
                aria-label="Go back to affiliates page"
              >
                Back to Affiliates
              </Button>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div 
              className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
              role="alert"
              aria-live="polite"
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <p className={message.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}>
                {message.text}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} aria-label="Affiliate program settings form">
            {/* Program Status */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Program Status</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    id="program_enabled"
                    type="checkbox"
                    checked={settings.program_enabled}
                    onChange={(e) => setSettings({ ...settings, program_enabled: e.target.checked })}
                    className="rounded text-brand-orange focus:ring-brand-orange"
                    aria-describedby="program-enabled-help"
                  />
                  <div>
                    <span className="font-medium">Enable Affiliate Program</span>
                    <p id="program-enabled-help" className="text-sm text-gray-600 dark:text-gray-400">
                      Accept new affiliate applications and allow tracking
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    id="auto_approve"
                    type="checkbox"
                    checked={settings.auto_approve_affiliates}
                    onChange={(e) => setSettings({ ...settings, auto_approve_affiliates: e.target.checked })}
                    className="rounded text-brand-orange focus:ring-brand-orange"
                    aria-describedby="auto-approve-help"
                  />
                  <div>
                    <span className="font-medium">Auto-Approve Affiliates</span>
                    <p id="auto-approve-help" className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically approve all applications (not recommended)
                    </p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Commission Settings */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Commission Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="commission_type" className="block font-medium mb-2">
                    Default Commission Type
                  </label>
                  <select
                    id="commission_type"
                    value={settings.default_commission_type}
                    onChange={(e) => {
                      const validTypes = ['percentage', 'flat', 'tiered'];
                      if (validTypes.includes(e.target.value)) {
                        setSettings({ ...settings, default_commission_type: e.target.value as any });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Rate</option>
                    <option value="tiered" disabled>Tiered (Coming Soon)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="commission_rate" className="block font-medium mb-2">
                    Default Commission Rate
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.default_commission_rate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          setSettings({ ...settings, default_commission_rate: value });
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      aria-describedby="commission-rate-help"
                      required
                      aria-required="true"
                    />
                    <span className="text-gray-600 dark:text-gray-400" aria-hidden="true">
                      {settings.default_commission_type === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                  <p id="commission-rate-help" className="text-xs text-gray-500 mt-1">
                    {settings.default_commission_type === 'percentage' 
                      ? 'Percentage of order total (e.g., 10%)' 
                      : 'Fixed amount per sale (e.g., $5.00)'}
                  </p>
                </div>

                <div>
                  <label htmlFor="commission_hold_days" className="block font-medium mb-2">
                    Commission Hold Period
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="commission_hold_days"
                      type="number"
                      min="0"
                      max="365"
                      value={settings.commission_hold_days}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value >= 0 && value <= 365) {
                          setSettings({ ...settings, commission_hold_days: value });
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      aria-describedby="hold-days-help"
                      required
                      aria-required="true"
                    />
                    <span className="text-gray-600 dark:text-gray-400">days</span>
                  </div>
                  <p id="hold-days-help" className="text-xs text-gray-500 mt-1">
                    Days before pending commission becomes approved (allows for returns)
                  </p>
                </div>
              </div>
            </Card>

            {/* Payout Settings */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Payout Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="payout_threshold" className="block font-medium mb-2">
                    Minimum Payout Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">$</span>
                    <input
                      id="payout_threshold"
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.minimum_payout_threshold}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          setSettings({ ...settings, minimum_payout_threshold: value });
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      aria-describedby="payout-threshold-help"
                      required
                      aria-required="true"
                    />
                  </div>
                  <p id="payout-threshold-help" className="text-xs text-gray-500 mt-1">
                    Minimum earnings before affiliate can request payout
                  </p>
                </div>

                <div>
                  <label htmlFor="payout_schedule" className="block font-medium mb-2">
                    Payout Schedule
                  </label>
                  <select
                    id="payout_schedule"
                    value={settings.payout_schedule}
                    onChange={(e) => {
                      const validSchedules = ['monthly', 'bi_monthly', 'manual'];
                      if (validSchedules.includes(e.target.value)) {
                        setSettings({ ...settings, payout_schedule: e.target.value as any });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    required
                    aria-required="true"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi_monthly">Bi-Monthly (Twice per month)</option>
                    <option value="manual">Manual (Process as needed)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Tracking Settings */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Tracking Settings</h2>
              
              <div>
                <label htmlFor="cookie_duration" className="block font-medium mb-2">
                  Cookie Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="cookie_duration"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.cookie_duration_days}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 1 && value <= 365) {
                        setSettings({ ...settings, cookie_duration_days: value });
                      }
                    }}
                    className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    aria-describedby="cookie-duration-help"
                    required
                    aria-required="true"
                  />
                  <span className="text-gray-600 dark:text-gray-400">days</span>
                </div>
                <p id="cookie-duration-help" className="text-xs text-gray-500 mt-1">
                  How long affiliate attribution lasts (industry standard: 30 days)
                </p>
              </div>
            </Card>

            {/* Application Requirements */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Application Requirements</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    id="require_website"
                    type="checkbox"
                    checked={settings.require_website}
                    onChange={(e) => setSettings({ ...settings, require_website: e.target.checked })}
                    className="rounded text-brand-orange focus:ring-brand-orange"
                    aria-describedby="require-website-help"
                  />
                  <div>
                    <span className="font-medium">Require Website URL</span>
                    <p id="require-website-help" className="text-sm text-gray-600 dark:text-gray-400">
                      Applicants must provide a website/blog URL
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    id="require_traffic_info"
                    type="checkbox"
                    checked={settings.require_traffic_info}
                    onChange={(e) => setSettings({ ...settings, require_traffic_info: e.target.checked })}
                    className="rounded text-brand-orange focus:ring-brand-orange"
                    aria-describedby="require-traffic-help"
                  />
                  <div>
                    <span className="font-medium">Require Traffic Information</span>
                    <p id="require-traffic-help" className="text-sm text-gray-600 dark:text-gray-400">
                      Applicants must provide audience size and traffic estimates
                    </p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Terms & Conditions */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Terms & Conditions</h2>
              
              <div>
                <label htmlFor="terms_text" className="block font-medium mb-2">
                  Affiliate Terms Text (Optional)
                </label>
                <textarea
                  id="terms_text"
                  value={settings.terms_text || ''}
                  onChange={(e) => {
                    // SECURITY: Limit terms text to 10,000 characters
                    const value = e.target.value;
                    if (value.length <= 10000) {
                      setSettings({ ...settings, terms_text: value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-brand-orange focus:border-transparent h-32"
                  placeholder="Enter custom terms and conditions for affiliates..."
                  aria-describedby="terms-help"
                  maxLength={10000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(settings.terms_text || '').length} / 10,000 characters
                </p>
                <p id="terms-help" className="text-xs text-gray-500 mt-1">
                  These terms will be shown to affiliates during application
                </p>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4" role="group" aria-label="Form actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/affiliates')}
                disabled={saving}
                aria-label="Cancel and go back to affiliates page"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                aria-label={saving ? 'Saving settings, please wait' : 'Save affiliate program settings'}
              >
                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

