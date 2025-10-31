'use client';

/**
 * Customer Referral Dashboard Page
 * 
 * Shows user's referral code, stats, and sharing options
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Copy, 
  Check,
  Share2,
  AlertCircle
} from 'lucide-react';
import SocialShare from '@/components/social/SocialShare';
import { UserReferralStats } from '@/lib/types/referral';

export default function ReferralsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserReferralStats | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user's referral stats
      const statsRes = await fetch('/api/referrals/stats');
      if (statsRes.status === 401) {
        router.push('/sign-in?redirect=/account/referrals');
        return;
      }
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch referral program settings
      const settingsRes = await fetch('/api/referrals/settings');
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

  const copyReferralCode = async () => {
    if (stats?.referral_code) {
      try {
        await navigator.clipboard.writeText(stats.referral_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const getReferralUrl = () => {
    if (!stats?.referral_code) return '';
    return `${window.location.origin}?ref=${stats.referral_code}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors">Loading your referral dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md transition-colors">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4 transition-colors" />
          <h2 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100 transition-colors">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center transition-colors">{error}</p>
          <button
            onClick={() => router.push('/account')}
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  if (!settings?.enabled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md text-center transition-colors">
          <Gift className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4 transition-colors" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100 transition-colors">Referral Program</h2>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Our referral program is currently unavailable. Please check back soon!
          </p>
          <button
            onClick={() => router.push('/account')}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Referral Program</h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Share FiltersFast with friends and earn rewards!
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-8 h-8" />
            <h2 className="text-2xl font-bold">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold mb-2">1</div>
              <h3 className="font-semibold mb-2">Share Your Code</h3>
              <p className="text-blue-100">
                Share your unique referral code with friends and family
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">2</div>
              <h3 className="font-semibold mb-2">They Get a Discount</h3>
              <p className="text-blue-100">
                Your friend gets {settings?.referred_discount_type === 'percentage' ? `${settings.referred_discount_amount}% off` : `$${settings.referred_discount_amount} off`} their first order
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">3</div>
              <h3 className="font-semibold mb-2">You Earn Rewards</h3>
              <p className="text-blue-100">
                Get {settings?.referrer_reward_type === 'percentage' ? `${settings.referrer_reward_amount}%` : `$${settings.referrer_reward_amount}`} credit when they order!
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">Total Referrals</h3>
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats?.total_conversions || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">Total Clicks</h3>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats?.total_clicks || 0}</p>
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
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">Total Earned</h3>
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
              ${(stats?.total_rewards_earned || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Your Referral Code</h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 transition-colors" role="region" aria-label="Your referral code">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors" id="referral-code-label">Your unique code:</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono transition-colors" aria-labelledby="referral-code-label">
                  {stats?.referral_code || 'Loading...'}
                </p>
              </div>
              <button
                onClick={copyReferralCode}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label={copied ? 'Referral code copied to clipboard' : `Copy referral code ${stats?.referral_code || ''}`}
                aria-live="polite"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" aria-hidden="true" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" aria-hidden="true" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="referral-link-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Your Referral Link:
            </label>
            <div className="flex gap-3">
              <input
                id="referral-link-input"
                type="text"
                value={getReferralUrl()}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 font-mono text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Your referral link"
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(getReferralUrl());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label={copied ? 'Referral link copied to clipboard' : 'Copy referral link to clipboard'}
                aria-live="polite"
              >
                <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors">Share via Social Media:</h3>
            <SocialShare
              data={{
                url: getReferralUrl(),
                title: `Get ${settings?.referred_discount_type === 'percentage' ? `${settings.referred_discount_amount}% off` : `$${settings.referred_discount_amount} off`} at FiltersFast!`,
                description: `I love FiltersFast! Use my referral code ${stats?.referral_code} to get a discount on your first order.`,
                hashtags: ['FiltersFast', 'Referral', 'AirFilters']
              }}
              shareType="referral"
              referralCode={stats?.referral_code}
              variant="buttons"
              showLabels={true}
            />
          </div>
        </div>

        {/* Recent Referrals */}
        {stats?.recent_referrals && stats.recent_referrals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">Recent Referrals</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors" role="table" aria-label="Recent referrals">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Order Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      Your Reward
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
                  {stats.recent_referrals.map((referral, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        {referral.referred_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        #{referral.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        ${referral.order_total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 transition-colors">
                        ${referral.reward_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${
                          referral.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          referral.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                          referral.status === 'paid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {new Date(referral.converted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Terms */}
        {settings?.terms_text && (
          <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Program Terms</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{settings.terms_text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

