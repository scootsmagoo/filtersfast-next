'use client';

/**
 * Admin Affiliates Management Page
 * 
 * Main dashboard for admins to manage the affiliate program
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Affiliate, AdminAffiliateOverview } from '@/lib/types/affiliate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Users,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Eye,
  Ban,
  PlayCircle
} from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [overview, setOverview] = useState<AdminAffiliateOverview | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/affiliates');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      // Fetch overview
      const overviewResponse = await fetch('/api/admin/affiliates?overview=true');
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setOverview(overviewData);
      }

      // Fetch all affiliates
      const affiliatesResponse = await fetch('/api/admin/affiliates');
      if (affiliatesResponse.ok) {
        const affiliatesData = await affiliatesResponse.json();
        setAffiliates(affiliatesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (affiliateId: string, newStatus: 'active' | 'suspended') => {
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: affiliateId, status: newStatus }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert('Failed to update affiliate status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update affiliate status');
    }
  };

  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse space-y-4" role="status" aria-live="polite">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <span className="sr-only">Loading affiliate data...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const filteredAffiliates = affiliates.filter(aff => {
    if (filter === 'all') return true;
    return aff.status === filter;
  });

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-lg">
        Skip to main content
      </a>

      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-8">
          <AdminBreadcrumb />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 id="main-content" className="text-3xl font-bold mb-2 flex items-center gap-3" tabIndex={-1}>
                <Users className="w-8 h-8 text-brand-orange" aria-hidden="true" />
                Affiliate Program
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage affiliates, applications, and program settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/affiliates/settings')}
                aria-label="Go to affiliate program settings"
              >
                <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
                Settings
              </Button>
              <Button
                onClick={() => router.push('/admin/affiliates/applications')}
                aria-label={`Review affiliate applications${overview && overview.pending_applications > 0 ? ` (${overview.pending_applications} pending)` : ''}`}
              >
                <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
                Applications
                {overview && overview.pending_applications > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full" aria-label={`${overview.pending_applications} pending`}>
                    {overview.pending_applications}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{overview.total_affiliates}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Affiliates</div>
                <div className="text-xs text-gray-500 mt-1">
                  {overview.active_affiliates} active
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <MousePointerClick className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{overview.total_clicks_30d.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Clicks (30d)</div>
                <div className="text-xs text-gray-500 mt-1">
                  {overview.average_conversion_rate.toFixed(2)}% conversion
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{overview.total_conversions_30d}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Conversions (30d)</div>
                <div className="text-xs text-gray-500 mt-1">
                  ${overview.total_revenue_30d.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-brand-orange" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  ${overview.total_commission_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending Commission</div>
                <div className="text-xs text-gray-500 mt-1">
                  ${overview.total_commission_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })} paid
                </div>
              </Card>
            </div>

            {/* Pending Applications Alert */}
            {overview.pending_applications > 0 && (
              <Card className="p-4 mb-8 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                        {overview.pending_applications} Pending Application{overview.pending_applications !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Review and approve or reject affiliate applications
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/affiliates/applications')}
                  >
                    Review Now
                  </Button>
                </div>
              </Card>
            )}

            {/* Top Affiliates */}
            {overview.top_affiliates.length > 0 && (
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Top Performing Affiliates (30 Days)</h2>
                <div className="space-y-3">
                  {overview.top_affiliates.map((aff, index) => (
                    <div key={aff.affiliate_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-orange/10 rounded-full flex items-center justify-center font-bold text-brand-orange">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{aff.affiliate_name}</p>
                          <p className="text-sm text-gray-500">Code: {aff.affiliate_code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ${aff.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {aff.conversions} sales • ${aff.commission.toFixed(2)} commission
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Affiliates List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">All Affiliates</h2>
            <div className="flex gap-2" role="group" aria-label="Filter affiliates by status">
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                aria-label={`Show all affiliates (${affiliates.length})`}
                aria-pressed={filter === 'all'}
              >
                All ({affiliates.length})
              </Button>
              <Button
                size="sm"
                variant={filter === 'active' ? 'default' : 'outline'}
                onClick={() => setFilter('active')}
                aria-label={`Show active affiliates (${affiliates.filter(a => a.status === 'active').length})`}
                aria-pressed={filter === 'active'}
              >
                Active ({affiliates.filter(a => a.status === 'active').length})
              </Button>
              <Button
                size="sm"
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                aria-label={`Show pending affiliates (${affiliates.filter(a => a.status === 'pending').length})`}
                aria-pressed={filter === 'pending'}
              >
                Pending ({affiliates.filter(a => a.status === 'pending').length})
              </Button>
              <Button
                size="sm"
                variant={filter === 'suspended' ? 'default' : 'outline'}
                onClick={() => setFilter('suspended')}
                aria-label={`Show suspended affiliates (${affiliates.filter(a => a.status === 'suspended').length})`}
                aria-pressed={filter === 'suspended'}
              >
                Suspended ({affiliates.filter(a => a.status === 'suspended').length})
              </Button>
            </div>
          </div>

          {filteredAffiliates.length === 0 ? (
            <div className="text-center py-12" role="status">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-600 dark:text-gray-400">No affiliates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Affiliates list">
                <thead>
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Name/Company</th>
                    <th className="pb-3 text-right">Clicks</th>
                    <th className="pb-3 text-right">Conversions</th>
                    <th className="pb-3 text-right">Revenue</th>
                    <th className="pb-3 text-right">Commission</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredAffiliates.map((aff) => (
                    <tr key={aff.id} className="border-b dark:border-gray-700 last:border-0">
                      <td className="py-3 font-mono text-xs">{aff.affiliate_code}</td>
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{aff.company_name || 'N/A'}</div>
                          {aff.website && (
                            <a
                              href={aff.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {new URL(aff.website).hostname}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">{aff.total_clicks.toLocaleString()}</td>
                      <td className="py-3 text-right">{aff.total_conversions}</td>
                      <td className="py-3 text-right">${aff.total_revenue.toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold text-green-600">
                        ${aff.total_commission_earned.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          aff.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          aff.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          aff.status === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {aff.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {aff.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(aff.id, 'suspended')}
                              title="Suspend affiliate"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {aff.status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(aff.id, 'active')}
                              title="Activate affiliate"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

