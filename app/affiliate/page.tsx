'use client';

/**
 * Affiliate Dashboard Page
 * 
 * Main dashboard for affiliates to view their performance and manage their account
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Affiliate, AffiliateStats } from '@/lib/types/affiliate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  TrendingUp,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  Wallet,
  BarChart3
} from 'lucide-react';

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/affiliate');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchAffiliateData();
    }
  }, [session]);

  const fetchAffiliateData = async () => {
    try {
      // Fetch affiliate account
      const affiliateResponse = await fetch('/api/affiliates');
      
      if (!affiliateResponse.ok) {
        if (affiliateResponse.status === 404) {
          // Not an affiliate yet
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch affiliate account');
      }

      const affiliateData = await affiliateResponse.json();
      setAffiliate(affiliateData);

      // Fetch stats
      const statsResponse = await fetch('/api/affiliates/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAffiliateLink = () => {
    if (!affiliate) return;
    
    const link = `${window.location.origin}?aff=${affiliate.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-pulse space-y-4" role="status" aria-live="polite" aria-label="Loading affiliate dashboard">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Not an affiliate yet - show application prompt
  if (!affiliate) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Become an Affiliate Partner</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Earn commissions by promoting FiltersFast products to your audience.
            Join our affiliate program and start earning today!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Earn Commission</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get paid for every sale
              </p>
            </div>
            <div className="text-center p-4">
              <LinkIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Easy Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Simple affiliate links
              </p>
            </div>
            <div className="text-center p-4">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Performance Stats</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time analytics
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/affiliate/apply')}
            size="lg"
            className="mx-auto"
          >
            Apply Now
          </Button>
        </Card>
      </div>
    );
  }

  // Affiliate account exists but not active yet
  if (affiliate.status === 'pending') {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Application Under Review</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Thank you for applying to our affiliate program! Your application is currently
            being reviewed by our team. We'll notify you via email once a decision has been made.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This usually takes 1-3 business days.
          </p>
        </Card>
      </div>
    );
  }

  if (affiliate.status === 'rejected') {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Application Not Approved</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Unfortunately, we're unable to approve your affiliate application at this time.
          </p>
          {affiliate.rejected_reason && (
            <Card className="bg-gray-50 dark:bg-gray-800 p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Reason:</strong> {affiliate.rejected_reason}
              </p>
            </Card>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You may reapply after making improvements to your promotional channels.
          </p>
        </Card>
      </div>
    );
  }

  // Active affiliate dashboard
  const affiliateLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?aff=${affiliate.affiliate_code}`;

  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="mb-8">
          <h1 id="main-content" className="text-3xl font-bold mb-2" tabIndex={-1}>
            Affiliate Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back! Here's your performance overview.
          </p>
        </div>

        {/* Affiliate Link Card */}
        <Card className="mb-8 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-brand-orange" />
                Your Affiliate Link
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share this link to earn commissions
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-orange">{affiliate.affiliate_code}</div>
              <div className="text-xs text-gray-500">Your Code</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={affiliateLink}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
              aria-label="Your affiliate link"
            />
            <Button 
              onClick={copyAffiliateLink} 
              variant="outline"
              aria-label={copied ? "Link copied" : "Copy affiliate link to clipboard"}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                  Copy
                </>
              )}
            </Button>
          </div>
          {copied && <span className="sr-only" role="status" aria-live="polite">Link copied to clipboard</span>}
          
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(affiliateLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Test Link
            </Button>
          </div>
        </Card>

        {/* Performance Stats */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <MousePointerClick className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{stats.total_clicks.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{stats.total_conversions}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Conversions</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats.conversion_rate.toFixed(2)}% conversion rate
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  ${stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  ${stats.average_order_value.toFixed(2)} avg order
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-brand-orange" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  ${stats.total_commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Commission</div>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold">Pending</h3>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  ${stats.pending_commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Being reviewed
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Approved</h3>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.approved_commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ready for payout
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Paid</h3>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ${stats.paid_commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lifetime earnings
                </p>
              </Card>
            </div>

            {/* Recent Conversions */}
            {stats.recent_conversions && stats.recent_conversions.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Recent Conversions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3 text-right">Order Total</th>
                        <th className="pb-3 text-right">Commission</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {stats.recent_conversions.map((conv) => (
                        <tr key={conv.order_id} className="border-b dark:border-gray-700 last:border-0">
                          <td className="py-3 font-mono text-xs">{conv.order_id}</td>
                          <td className="py-3">{new Date(conv.converted_at).toLocaleDateString()}</td>
                          <td className="py-3 text-right">${conv.order_total.toFixed(2)}</td>
                          <td className="py-3 text-right font-semibold text-green-600">
                            ${conv.commission_amount.toFixed(2)}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              conv.commission_status === 'paid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              conv.commission_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {conv.commission_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/affiliate/settings')}
          >
            Account Settings
          </Button>
        </div>
      </div>
    </>
  );
}

