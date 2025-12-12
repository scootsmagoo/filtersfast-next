'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Grid,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  ShoppingCart,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import {
  MarketplaceChannel,
  MarketplaceOrder,
  MarketplaceSummaryMetrics,
  MarketplaceTrendPoint,
  MarketplaceSyncRun,
  MarketplaceTaxState,
} from '@/lib/types/marketplace'
import { RevenueChart } from '@/components/admin/AnalyticsCharts'

interface MarketplaceSummaryResponse {
  success: boolean
  channels: MarketplaceChannel[]
  summary: MarketplaceSummaryMetrics
  trends: MarketplaceTrendPoint[]
  syncs: MarketplaceSyncRun[]
  taxStates: MarketplaceTaxState[]
  meta: {
    groupBy: 'day' | 'week' | 'month'
    filters: {
      from: string | null
      to: string | null
    }
  }
  error?: string
}

interface MarketplaceOrdersResponse {
  success: boolean
  orders: MarketplaceOrder[]
  total: number
  page: number
  pageSize: number
  error?: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  acknowledged: 'Acknowledged',
  processing: 'Processing',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
  closed: 'Closed',
  any: 'Any Status',
  all: 'Any Status',
}

const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  ebay: 'eBay',
  walmart: 'Walmart',
  all: 'All Channels',
}

const DEFAULT_FILTERS = {
  channelId: 'all',
  platform: 'all',
  status: 'all',
  from: '',
  to: '',
  search: '',
  pageSize: 25,
}

const FILTER_IDS = {
  channel: 'marketplace-filter-channel',
  platform: 'marketplace-filter-platform',
  status: 'marketplace-filter-status',
  from: 'marketplace-filter-from',
  to: 'marketplace-filter-to',
}

export default function AdminMarketplacesPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const [channels, setChannels] = useState<MarketplaceChannel[]>([])
  const [summary, setSummary] = useState<MarketplaceSummaryMetrics | null>(null)
  const [trends, setTrends] = useState<MarketplaceTrendPoint[]>([])
  const [syncs, setSyncs] = useState<MarketplaceSyncRun[]>([])
  const [taxStates, setTaxStates] = useState<MarketplaceTaxState[]>([])

  const [orders, setOrders] = useState<MarketplaceOrder[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/marketplaces')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      void fetchSummary()
    }
  }, [session])

  useEffect(() => {
    if (session?.user) {
      void fetchOrders(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, filters, page])

  async function fetchSummary() {
    setLoadingSummary(true)
    setSummaryError(null)

    try {
      const params = new URLSearchParams()
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)

      const response = await fetch(`/api/admin/marketplaces?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = (await response.json()) as MarketplaceSummaryResponse
        throw new Error(data.error || 'Failed to load marketplace summary.')
      }

      const data = (await response.json()) as MarketplaceSummaryResponse

      if (!data.success) {
        throw new Error(data.error || 'Failed to load marketplace summary.')
      }

      setChannels(data.channels)
      setSummary(data.summary)
      setTrends(data.trends)
      setSyncs(data.syncs)
      setTaxStates(data.taxStates)
    } catch (error: any) {
      console.error(error)
      setSummaryError(error.message || 'Unable to load marketplace summary.')
    } finally {
      setLoadingSummary(false)
    }
  }

  async function fetchOrders(nextPage: number) {
    setLoadingOrders(true)
    setOrdersError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('pageSize', String(filters.pageSize))

      if (filters.channelId && filters.channelId !== 'all') {
        params.set('channelId', filters.channelId)
      }
      if (filters.platform && filters.platform !== 'all') {
        params.set('platform', filters.platform)
      }
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status)
      }
      if (filters.from) {
        params.set('from', filters.from)
      }
      if (filters.to) {
        params.set('to', filters.to)
      }
      if (filters.search) {
        params.set('search', filters.search)
      }

      const response = await fetch(`/api/admin/marketplaces/orders?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = (await response.json()) as MarketplaceOrdersResponse
        throw new Error(data.error || 'Failed to load marketplace orders.')
      }

      const data = (await response.json()) as MarketplaceOrdersResponse

      if (!data.success) {
        throw new Error(data.error || 'Failed to load marketplace orders.')
      }

      setOrders(data.orders)
      setTotalOrders(data.total)
      setPage(data.page)
    } catch (error: any) {
      console.error(error)
      setOrdersError(error.message || 'Unable to load marketplace orders.')
    } finally {
      setLoadingOrders(false)
    }
  }

  async function handleSync(channelId?: string) {
    setSyncing(true)
    setSyncMessage(null)

    try {
      const response = await fetch('/api/admin/marketplaces/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channelId === 'all' ? null : channelId,
          platform: filters.platform !== 'all' ? filters.platform : undefined,
          since: filters.from || undefined,
          until: filters.to || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Marketplace sync failed.')
      }

      setSyncMessage(
        data.message ||
          `Sync complete. Imported ${data.totals.imported}, updated ${data.totals.updated}, errors ${data.totals.errors}.`
      )

      // Refresh data after sync
      await fetchSummary()
      await fetchOrders(page)
    } catch (error: any) {
      console.error(error)
      setSyncMessage(error.message || 'Marketplace sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleChannelUpdate(
    channelId: string,
    updates: Partial<Pick<MarketplaceChannel, 'syncEnabled' | 'status' | 'syncFrequencyMinutes'>>
  ) {
    try {
      const response = await fetch(`/api/admin/marketplaces/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update channel.')
      }

      setChannels((prev) =>
        prev.map((channel) => (channel.id === channelId ? data.channel : channel))
      )
      setSummary((prev) => (prev ? { ...prev } : prev))
    } catch (error: any) {
      console.error(error)
      setSyncMessage(error.message || 'Failed to update channel.')
    }
  }

  async function handleAddTaxState(channelId: string) {
    const code =
      typeof window !== 'undefined'
        ? window.prompt('Enter state code (2 letters):')?.trim().toUpperCase()
        : null

    if (!code) return

    try {
      const response = await fetch(`/api/admin/marketplaces/${channelId}/taxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateCode: code }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add tax state.')
      }

      await fetchSummary()
    } catch (error: any) {
      console.error(error)
      setSyncMessage(error.message || 'Failed to add tax state.')
    }
  }

  async function handleRemoveTaxState(channelId: string, taxId: number) {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Remove this tax state?')
      if (!confirmed) return
    }

    try {
      const response = await fetch(`/api/admin/marketplaces/${channelId}/taxes/${taxId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove tax state.')
      }

      await fetchSummary()
    } catch (error: any) {
      console.error(error)
      setSyncMessage(error.message || 'Failed to remove tax state.')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalOrders / filters.pageSize))
  }, [totalOrders, filters.pageSize])

  const selectedChannel = useMemo(() => {
    if (filters.channelId === 'all') return null
    return channels.find((channel) => channel.id === filters.channelId) ?? null
  }, [channels, filters.channelId])

  const trendData = useMemo(
    () =>
      trends.map((point) => ({
        period: point.period,
        revenue: point.revenue,
        orderCount: point.orderCount,
      })),
    [trends]
  )

  if (isPending || loadingSummary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminBreadcrumb />
        <div className="container-custom py-12">
          <Card className="p-8">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Loading marketplace dashboard...</span>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const activeChannelCount = channels.filter((channel) => channel.syncEnabled).length
  const isSyncError = Boolean(syncMessage && /fail|error/i.test(syncMessage))
  const syncAriaTone: 'polite' | 'assertive' = isSyncError ? 'assertive' : 'polite'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-10 space-y-8">
        <AdminBreadcrumb
          trail={[
            { label: 'Admin', href: '/admin' },
            { label: 'Marketplaces', href: '/admin/marketplaces' },
          ]}
        />

        {summaryError && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/40 dark:border-red-800 dark:text-red-200"
          >
            <strong className="font-semibold">Error: </strong>
            <span>{summaryError}</span>
          </div>
        )}

        <section aria-label="Marketplace metrics overview" className="grid gap-6 lg:grid-cols-4">
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {summary?.totalOrders.toLocaleString() ?? '0'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Marketplace Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${summary?.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Channels</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {activeChannelCount} / {channels.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Sync</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {summary?.lastSyncAt
                    ? new Date(summary.lastSyncAt).toLocaleString()
                    : 'Not yet synced'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </section>

        <section className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-orange" /> Revenue Trends
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order volume and revenue grouped by day.
                </p>
              </div>
            </div>
            <RevenueChart data={trendData} title="Marketplace Revenue" />
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-brand-orange" /> Manual Sync
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Trigger a manual sync for all channels or a specific channel. This pulls the latest orders from Sellbrite and updates reporting.
            </p>

            <div className="space-y-2">
              <Button
                type="button"
                disabled={syncing}
                className="w-full justify-center"
                onClick={() => handleSync(filters.channelId === 'all' ? undefined : filters.channelId)}
              >
                {syncing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" /> Syncing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Sync {filters.channelId === 'all' ? 'All Channels' : 'Channel'}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                disabled={syncing || !selectedChannel}
                className="w-full justify-center"
                variant="secondary"
                onClick={() => selectedChannel && handleSync(selectedChannel.id)}
              >
                Sync Only {selectedChannel?.name ?? 'Channel'}
              </Button>
            </div>

            {syncMessage && (
              <div
                role="status"
                aria-live={syncAriaTone}
                className={`text-sm px-3 py-2 rounded ${
                  isSyncError
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                    : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                }`}
              >
                <span className="sr-only">Marketplace sync status: </span>
                {syncMessage}
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Syncs
              </h3>
              <ul className="space-y-3">
                {syncs.length === 0 && (
                  <li className="text-sm text-gray-500 dark:text-gray-400">
                    No sync history yet.
                  </li>
                )}
                {syncs.map((run) => (
                  <li key={run.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {run.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : run.status === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="font-medium">
                          {run.channelName ?? 'All Channels'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(run.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                      <span>
                        Imported <strong>{run.importedCount}</strong> • Updated{' '}
                        <strong>{run.updatedCount}</strong> • Errors{' '}
                        <strong>{run.errorCount}</strong>
                      </span>
                      {run.message && <span>{run.message}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Grid className="w-5 h-5 text-brand-orange" /> Channel Overview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage marketplace channel sync settings, credentials, and tax facilitation states.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => {
              const lastSuccessful =
                channel.lastSuccessfulSyncAt && new Date(channel.lastSuccessfulSyncAt)
              const lastRunStatus = channel.lastSyncStatus
              const syncEnabledId = `marketplace-sync-enabled-${channel.id}`
              const frequencyInputId = `marketplace-sync-frequency-${channel.id}`
              const frequencyHelpId = `${frequencyInputId}-help`
              return (
                <Card key={channel.id} className="p-6 bg-white dark:bg-gray-800 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building className="w-5 h-5 text-brand-orange" /> {channel.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {channel.platform}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        channel.syncEnabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {channel.syncEnabled ? 'Sync Enabled' : 'Sync Disabled'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Last Sync Status</span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          lastRunStatus === 'success'
                            ? 'text-green-600 dark:text-green-300'
                            : lastRunStatus === 'error'
                              ? 'text-red-600 dark:text-red-300'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {lastRunStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                        {lastRunStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
                        {lastRunStatus ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Successful Sync</span>
                      <span>
                        {lastSuccessful ? lastSuccessful.toLocaleString() : 'No sync yet'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sync Frequency</span>
                      <span>{channel.syncFrequencyMinutes ?? 0} min</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor={syncEnabledId}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <input
                        id={syncEnabledId}
                        type="checkbox"
                        checked={channel.syncEnabled}
                        onChange={(event) =>
                          handleChannelUpdate(channel.id, { syncEnabled: event.target.checked })
                        }
                      />
                      Enable automatic sync
                    </label>

                    <div className="flex items-center gap-2 text-sm">
                      <label className="text-gray-600 dark:text-gray-300" htmlFor={frequencyInputId}>
                        Frequency (minutes):
                      </label>
                      <input
                        id={frequencyInputId}
                        type="number"
                        min={5}
                        step={5}
                        value={channel.syncFrequencyMinutes ?? 30}
                        onChange={(event) =>
                          handleChannelUpdate(channel.id, {
                            syncFrequencyMinutes: Number(event.target.value),
                          })
                        }
                        aria-describedby={frequencyHelpId}
                        className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white"
                      />
                      <span id={frequencyHelpId} className="text-xs text-gray-500 dark:text-gray-400">
                        Allowed range: 5-1440 minutes
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Shield className="w-4 h-4 text-brand-orange" />
                        Tax Facilitator States
                      </span>
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1"
                        onClick={() => handleAddTaxState(channel.id)}
                      >
                        + Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getTaxStatesForChannel(channel.id, taxStates).length === 0 ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          No states configured.
                        </span>
                      ) : null}
                      {getTaxStatesForChannel(channel.id, taxStates).map((state) => (
                        <button
                          key={`${channel.id}-${state.id}`}
                          type="button"
                          onClick={() => handleRemoveTaxState(channel.id, state.id)}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Remove state"
                        >
                          {state.stateCode}
                        </button>
                      ))}
                    </div>

                    <Link
                      href={`/admin/marketplaces/${channel.slug}`}
                      className="inline-flex items-center text-sm text-brand-orange hover:text-brand-orange-dark transition-colors"
                    >
                      View channel details <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-orange" /> Orders
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Filter and review marketplace orders imported into FiltersFast-Next.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor={FILTER_IDS.channel}>
                  Channel
                </label>
                <select
                  id={FILTER_IDS.channel}
                  className="min-w-[160px] rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  value={filters.channelId}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, channelId: event.target.value }))
                    setPage(1)
                  }}
                >
                  <option value="all">All Channels</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor={FILTER_IDS.platform}>
                  Platform
                </label>
                <select
                  id={FILTER_IDS.platform}
                  className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  value={filters.platform}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, platform: event.target.value }))
                    setPage(1)
                  }}
                >
                  <option value="all">All Platforms</option>
                  <option value="amazon">Amazon</option>
                  <option value="ebay">eBay</option>
                  <option value="walmart">Walmart</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor={FILTER_IDS.status}>
                  Status
                </label>
                <select
                  id={FILTER_IDS.status}
                  className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  value={filters.status}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, status: event.target.value }))
                    setPage(1)
                  }}
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor={FILTER_IDS.from}>
                  From
                </label>
                <input
                  id={FILTER_IDS.from}
                  type="date"
                  value={filters.from}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, from: event.target.value }))
                    setPage(1)
                  }}
                  className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor={FILTER_IDS.to}>
                  To
                </label>
                <input
                  id={FILTER_IDS.to}
                  type="date"
                  value={filters.to}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, to: event.target.value }))
                    setPage(1)
                  }}
                  className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                aria-busy={loadingOrders}
              >
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Channel
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Order
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Purchase Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Items
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  {loadingOrders && (
                    <tr>
                      <td
                        role="status"
                        aria-live="polite"
                        colSpan={7}
                        className="px-4 py-6 text-center"
                      >
                        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading orders...
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loadingOrders && orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                        No orders found for the selected filters.
                      </td>
                    </tr>
                  )}

                  {!loadingOrders &&
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {order.channelName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {order.platform}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-brand-orange">{order.externalNumber ?? order.externalId}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {order.externalId}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 capitalize">
                            <Target className="w-3 h-3" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span>{order.customerName ?? '—'}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {order.customerEmail ?? 'No email'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(order.purchaseDate).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          <ul className="space-y-1">
                            {order.items.slice(0, 3).map((item) => (
                              <li key={item.id} className="flex items-center justify-between gap-2">
                                <span className="truncate">{item.title}</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  x{item.quantity}
                                </span>
                              </li>
                            ))}
                            {order.items.length > 3 && (
                              <li className="text-gray-500 dark:text-gray-400">
                                + {order.items.length - 3} more
                              </li>
                            )}
                          </ul>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {ordersError && (
              <div
                role="alert"
                aria-live="assertive"
                className="px-4 py-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/40 dark:text-red-200"
              >
                {ordersError}
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
              <div>
                Showing {(page - 1) * filters.pageSize + 1}-
                {Math.min(page * filters.pageSize, totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="px-3 py-1"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  className="px-3 py-1"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function getTaxStatesForChannel(
  channelId: string,
  taxStates: MarketplaceTaxState[]
) {
  return taxStates.filter((state) => state.channelId === channelId)
}


