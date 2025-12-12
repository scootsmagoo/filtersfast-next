'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CampaignStatusBadge from '@/components/admin/email-campaigns/CampaignStatusBadge';
import type { EmailCampaignListItem } from '@/lib/types/email-campaign';
import {
  Mail,
  Plus,
  RefreshCcw,
  Search,
  Users,
  Target,
  Activity,
  Eye,
  Trash2,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';

type CampaignStats = {
  total: number;
  totalRecipients: number;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  byStatus: Record<string, number>;
};

const STATUS_FILTERS: Array<'all' | 'draft' | 'scheduled' | 'sending' | 'paused' | 'sent' | 'cancelled'> =
  ['all', 'draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled'];

export default function AdminEmailCampaignsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<EmailCampaignListItem[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session?.user) {
      fetchCampaigns();
    }
  }, [session, isPending]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/email-campaigns', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Unable to load campaigns');
      }

      setCampaigns(json.campaigns ?? []);
      setStats(json.stats ?? null);
    } catch (err) {
      console.error('Failed to load email campaigns', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setFeedback(null);
    await fetchCampaigns();
  };

  const handleDelete = async (campaign: EmailCampaignListItem) => {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email-campaigns/${campaign.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Unable to delete campaign');
      }

      setCampaigns((prev) => prev.filter((item) => item.id !== campaign.id));
      if (stats) {
        const updatedStats: CampaignStats = {
          ...stats,
          total: Math.max(stats.total - 1, 0),
        };
        setStats(updatedStats);
      }
      setFeedback(`Campaign "${campaign.name}" deleted successfully.`);
      setError(null);
    } catch (err) {
      console.error('Failed to delete campaign', err);
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
      setFeedback(null);
    }
  };

  const filteredCampaigns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesTerm =
        !term ||
        campaign.name.toLowerCase().includes(term) ||
        campaign.subject.toLowerCase().includes(term) ||
        (campaign.target_audience?.toLowerCase().includes(term) ?? false);

      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

      return matchesTerm && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter]);

  const openRate = stats && stats.totalSent > 0 ? (stats.totalOpens / stats.totalSent) * 100 : 0;
  const clickRate = stats && stats.totalSent > 0 ? (stats.totalClicks / stats.totalSent) * 100 : 0;

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-10">
        <AdminBreadcrumb />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
              <Mail className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              Email Campaigns
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl transition-colors">
              Create, schedule, and track marketing campaigns. Build recipient lists, segment customers,
              and monitor engagement in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              aria-label="Refresh campaign list"
              className={clsx('flex items-center gap-2', refreshing && 'opacity-75 pointer-events-none')}
            >
              <RefreshCcw
                className={clsx('w-4 h-4', refreshing && 'animate-spin')}
                aria-hidden="true"
              />
              Refresh
            </Button>

            <Button
              onClick={() => router.push('/admin/email-campaigns/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Campaign
            </Button>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-medium">Unable to load campaigns</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {feedback && (
          <div
            className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"
            role="status"
            aria-live="polite"
          >
            {feedback}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Campaigns</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {stats?.total ?? campaigns.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand-orange/10 dark:bg-brand-orange/20 flex items-center justify-center">
                <Layers className="w-6 h-6 text-brand-orange" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Recipients</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {stats?.totalRecipients ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Open Rate</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {openRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-300" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Click Rate</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {clickRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-300" aria-hidden="true" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search & filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search campaigns by name, subject, or audience…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-brand-orange"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-brand-orange text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  {stats?.byStatus && status !== 'all' ? (
                    <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs text-gray-700 dark:bg-black/30 dark:text-gray-200">
                      {stats.byStatus[status] ?? 0}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Campaign table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800/70">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Campaign
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Recipients
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Performance
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No campaigns found. Try adjusting your filters or create a new campaign.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const sendLabel = campaign.scheduled_at
                      ? new Date(campaign.scheduled_at).toLocaleString()
                      : campaign.sent_at
                        ? `Sent ${new Date(campaign.sent_at).toLocaleString()}`
                        : 'Not scheduled';

                    const openRate = campaign.sent_count > 0 ? (campaign.open_count / campaign.sent_count) * 100 : 0;
                    const clickRate =
                      campaign.sent_count > 0 ? (campaign.click_count / campaign.sent_count) * 100 : 0;

                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => router.push(`/admin/email-campaigns/${campaign.id}`)}
                              className="text-left text-base font-semibold text-brand-orange hover:underline"
                            >
                              {campaign.name}
                            </button>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{campaign.subject}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              From{' '}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {campaign.from_name} &lt;{campaign.from_email}&gt;
                              </span>
                            </p>
                            {campaign.target_audience && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Audience: {campaign.target_audience}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <CampaignStatusBadge status={campaign.status} />
                            <p className="text-xs text-gray-500 dark:text-gray-400">{sendLabel}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="text-sm text-gray-800 dark:text-gray-200">
                            <p className="font-semibold">
                              {campaign.total_recipients.toLocaleString()} total
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Sent:{' '}
                              <span className="font-medium text-gray-700 dark:text-gray-200">
                                {campaign.sent_count.toLocaleString()}
                              </span>{' '}
                              · Failed:{' '}
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {campaign.failed_count.toLocaleString()}
                              </span>
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="text-sm text-gray-800 dark:text-gray-200">
                            <p>
                              Opens:{' '}
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {campaign.open_count.toLocaleString()}
                              </span>{' '}
                              ({openRate.toFixed(1)}%)
                            </p>
                            <p className="mt-1">
                              Clicks:{' '}
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {campaign.click_count.toLocaleString()}
                              </span>{' '}
                              ({clickRate.toFixed(1)}%)
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/email-campaigns/${campaign.id}`)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" aria-hidden="true" />
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(campaign)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}


