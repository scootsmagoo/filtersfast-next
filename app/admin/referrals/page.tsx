'use client';

/**
 * Admin Referral Management Dashboard
 * 
 * Manage referral program settings, view statistics, and monitor conversions
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface ReferralStats {
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  total_revenue: number;
  total_rewards: number;
  pending_rewards: number;
  active_referrers: number;
  recent_conversions: any[];
}

interface ReferralSettings {
  enabled: boolean;
  referrer_reward_type: 'credit' | 'discount' | 'percentage' | 'fixed';
  referrer_reward_amount: number;
  referred_discount_type: 'percentage' | 'fixed';
  referred_discount_amount: number;
  minimum_order_value: number;
  reward_delay_days: number;
  terms_text: string | null;
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch referral codes and stats
      const codesRes = await fetch('/api/admin/referrals');
      if (codesRes.status === 401) {
        router.push('/sign-in?redirect=/admin/referrals');
        return;
      }
      if (codesRes.status === 403) {
        router.push('/admin');
        return;
      }
      if (!codesRes.ok) throw new Error('Failed to fetch referral data');
      
      const codesData = await codesRes.json();
      setStats(codesData.stats);
      setCodes(codesData.codes);

      // Fetch settings
      const settingsRes = await fetch('/api/admin/referrals/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/referrals/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors">Loading referral dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md transition-colors">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4 transition-colors" />
          <h2 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100 transition-colors">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center transition-colors">{error}</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminBreadcrumb />
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Referral Program Management</h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">Monitor and manage the customer referral program</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              <span>{showSettings ? 'Hide' : 'Show'} Settings</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3 transition-colors">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <p className="text-sm text-green-800 dark:text-green-300 transition-colors">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 transition-colors">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 transition-colors" />
            <p className="text-sm text-red-800 dark:text-red-300 transition-colors">{error}</p>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && settings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">Program Settings</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Enable/Disable */}
              <div className="col-span-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                    Enable Referral Program
                  </span>
                </label>
              </div>

              {/* Referrer Reward Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Referrer Reward Type
                </label>
                <select
                  value={settings.referrer_reward_type}
                  onChange={(e) => setSettings({ ...settings, referrer_reward_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <option value="credit">Account Credit</option>
                  <option value="discount">Discount Code</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              {/* Referrer Reward Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Referrer Reward Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.referrer_reward_amount}
                  onChange={(e) => setSettings({ ...settings, referrer_reward_amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>

              {/* Referred Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Referred Customer Discount Type
                </label>
                <select
                  value={settings.referred_discount_type}
                  onChange={(e) => setSettings({ ...settings, referred_discount_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              {/* Referred Discount Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Referred Customer Discount Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.referred_discount_amount}
                  onChange={(e) => setSettings({ ...settings, referred_discount_amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>

              {/* Minimum Order Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Minimum Order Value ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.minimum_order_value}
                  onChange={(e) => setSettings({ ...settings, minimum_order_value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>

              {/* Reward Delay Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Reward Delay (days)
                </label>
                <input
                  type="number"
                  value={settings.reward_delay_days}
                  onChange={(e) => setSettings({ ...settings, reward_delay_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Days to wait before approving rewards (return window)</p>
              </div>

              {/* Terms Text */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Program Terms & Conditions
                </label>
                <textarea
                  value={settings.terms_text || ''}
                  onChange={(e) => setSettings({ ...settings, terms_text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 transition-colors"
                  placeholder="Enter terms and conditions for the referral program..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">Total Clicks</h3>
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats?.total_clicks || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">Total Conversions</h3>
              <Users className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats?.total_conversions || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">Conversion Rate</h3>
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
              {stats?.conversion_rate ? `${stats.conversion_rate.toFixed(1)}%` : '0%'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">Total Revenue</h3>
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
              ${(stats?.total_revenue || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Rewards Paid</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">${(stats?.total_rewards || 0).toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Pending Rewards</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 transition-colors">${(stats?.pending_rewards || 0).toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Active Referrers (30 days)</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats?.active_referrers || 0}</p>
          </div>
        </div>

        {/* Recent Conversions */}
        {stats?.recent_conversions && stats.recent_conversions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">Recent Conversions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table" aria-label="Recent referral conversions">
                <thead className="bg-gray-50 dark:bg-gray-900 transition-colors">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Referrer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Referred
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Order Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Reward
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                  {stats.recent_conversions.map((conversion: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        {conversion.referrer_email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        {conversion.referred_email || 'Guest'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        #{conversion.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        ${conversion.order_total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 transition-colors">
                        ${conversion.referrer_reward.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${
                          conversion.reward_status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          conversion.reward_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                          conversion.reward_status === 'paid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {conversion.reward_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {new Date(conversion.converted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Referral Codes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">All Referral Codes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table" aria-label="All customer referral codes">
              <thead className="bg-gray-50 dark:bg-gray-900 transition-colors">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Rewards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {codes.map((code: any) => (
                  <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">{code.name || 'No name'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{code.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-blue-600 dark:text-blue-400 transition-colors">
                      {code.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                      {code.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                      {code.conversions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                      ${code.total_revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 transition-colors">
                      ${code.total_rewards.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${
                        code.active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {code.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                      {new Date(code.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

