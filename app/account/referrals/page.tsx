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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your referral dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 text-center">{error}</p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
          <p className="text-gray-600">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h1>
          <p className="text-gray-600">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Referrals</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_conversions || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Clicks</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_clicks || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Conversion Rate</h3>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.conversion_rate ? `${stats.conversion_rate.toFixed(1)}%` : '0%'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Earned</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${(stats?.total_rewards_earned || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Referral Code</h2>
          
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6" role="region" aria-label="Your referral code">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1" id="referral-code-label">Your unique code:</p>
                <p className="text-3xl font-bold text-blue-600 font-mono" aria-labelledby="referral-code-label">
                  {stats?.referral_code || 'Loading...'}
                </p>
              </div>
              <button
                onClick={copyReferralCode}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={copied ? 'Referral code copied to clipboard' : `Copy referral code ${stats?.referral_code || ''}`}
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
            <label htmlFor="referral-link-input" className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Link:
            </label>
            <div className="flex gap-3">
              <input
                id="referral-link-input"
                type="text"
                value={getReferralUrl()}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Your referral link"
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(getReferralUrl());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={copied ? 'Referral link copied to clipboard' : 'Copy referral link to clipboard'}
              >
                <Copy className="w-5 h-5 text-gray-600" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Share via Social Media:</h3>
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
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Referrals</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Recent referrals">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Reward
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recent_referrals.map((referral, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.referred_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{referral.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${referral.order_total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${referral.reward_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          referral.status === 'approved' ? 'bg-green-100 text-green-800' :
                          referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          referral.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Program Terms</h3>
            <p className="text-sm text-gray-600">{settings.terms_text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

