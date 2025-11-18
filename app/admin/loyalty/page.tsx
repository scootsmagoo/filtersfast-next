'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { Star, Settings, TrendingUp, Users, Award, RefreshCw } from 'lucide-react';

interface LoyaltySettings {
  id: string;
  is_enabled: number;
  points_per_dollar: number;
  points_per_review: number;
  points_per_referral: number;
  points_per_birthday: number;
  min_redeem_amount: number;
  redemption_rate: number;
  expiration_days: number | null;
  tier_enabled: number;
}

interface LoyaltyStats {
  totalAccounts: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeAccounts: number;
}

export default function LoyaltyAdminPage() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [settingsRes, statsRes] = await Promise.all([
        fetch('/api/admin/loyalty'),
        fetch('/api/admin/loyalty?type=stats'),
      ]);

      const settingsData = await settingsRes.json();
      const statsData = await statsRes.json();

      if (!settingsRes.ok || !settingsData.success) {
        throw new Error(settingsData?.error || 'Failed to load settings');
      }
      if (!statsRes.ok || !statsData.success) {
        throw new Error(statsData?.error || 'Failed to load stats');
      }

      setSettings(settingsData.settings);
      setStats(statsData.stats);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/loyalty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to save settings');
      }

      setSettings(data.settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof LoyaltySettings>(
    key: K,
    value: LoyaltySettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminBreadcrumb />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AdminBreadcrumb />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors">
              <Star className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              Loyalty Program
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">
              Manage loyalty points program settings and view statistics.
            </p>
          </div>
          <Button variant="secondary" onClick={loadData} aria-label="Refresh data">
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300">
            <p className="font-semibold">Success</p>
            <p className="text-sm mt-1">{success}</p>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalAccounts.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Accounts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.activeAccounts.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Points Issued</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalPointsIssued.toLocaleString()}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Points Redeemed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalPointsRedeemed.toLocaleString()}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {settings && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Program Settings
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enable Loyalty Program
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Turn the loyalty program on or off
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.is_enabled === 1}
                  onChange={(e) => updateSetting('is_enabled', e.target.checked ? 1 : 0)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-orange/20 dark:peer-focus:ring-brand-orange/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-orange"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Points per Dollar Spent
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.points_per_dollar}
                  onChange={(e) => updateSetting('points_per_dollar', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Points per Review
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={settings.points_per_review}
                  onChange={(e) => updateSetting('points_per_review', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Points per Referral
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={settings.points_per_referral}
                  onChange={(e) => updateSetting('points_per_referral', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Points per Birthday
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={settings.points_per_birthday}
                  onChange={(e) => updateSetting('points_per_birthday', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Points to Redeem
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={settings.min_redeem_amount}
                  onChange={(e) => updateSetting('min_redeem_amount', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Redemption Rate (points per $1.00)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={settings.redemption_rate}
                  onChange={(e) => updateSetting('redemption_rate', parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {settings.redemption_rate} points = $1.00 discount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Points Expiration (days)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={settings.expiration_days || ''}
                  onChange={(e) => updateSetting('expiration_days', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Never expire"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty for no expiration
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enable Tiers
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enable tier-based multipliers and benefits
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.tier_enabled === 1}
                    onChange={(e) => updateSetting('tier_enabled', e.target.checked ? 1 : 0)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-orange/20 dark:peer-focus:ring-brand-orange/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-orange"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

