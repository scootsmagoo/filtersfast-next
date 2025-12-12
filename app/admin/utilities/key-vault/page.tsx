'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import {
  Shield,
  RefreshCcw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from 'lucide-react'

interface MonitorResponse {
  status: {
    raw: string
    isOperational: boolean
  }
  environmentLabel: string
  secrets: {
    name: string
    objectType: 'Secret'
    createdOn: string | null
    expiresOn: string | null
    daysUntilExpiry: number | null
    isExpired: boolean
    isExpiringSoon: boolean
    source: 'default' | 'custom'
  }[]
  checkedAt: string
}

type FetchState = 'idle' | 'loading' | 'loaded' | 'error'

export default function KeyVaultMonitorPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [state, setState] = useState<FetchState>('idle')
  const [data, setData] = useState<MonitorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string>('')

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/utilities/key-vault')
    }
  }, [session, isPending, router])

  const loadData = useCallback(async () => {
    setState('loading')
    setError(null)
    setAnnouncement('Refreshing Key Vault status...')

    try {
      const response = await fetch('/api/admin/utilities/key-vault', { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load Key Vault status')
      }

      setData(payload)
      setState('loaded')
      setAnnouncement('Key Vault status refreshed successfully.')
    } catch (err: any) {
      setError(err.message || 'Unable to load Key Vault status')
      setState('error')
      setAnnouncement('Unable to refresh Key Vault status. Please review the error details.')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const summary = useMemo(() => {
    if (!data) return null
    const total = data.secrets.length
    const expiringSoon = data.secrets.filter((secret) => secret.isExpiringSoon && !secret.isExpired).length
    const expired = data.secrets.filter((secret) => secret.isExpired).length
    return { total, expiringSoon, expired }
  }, [data])

  if (isPending && !session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">
            Loading admin session...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        aria-busy={state === 'loading' && !error ? 'true' : undefined}
      >
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Utilities', href: '/admin/utilities' },
            { label: 'Key Vault Monitor', href: '/admin/utilities/key-vault' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Azure Key Vault Secret Monitor
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Monitor secret health, expiry timelines, and Key Vault API connectivity
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={loadData}
                disabled={state === 'loading'}
                className="flex items-center gap-2"
                aria-label={state === 'loading' ? 'Refreshing Key Vault status' : 'Refresh Key Vault status'}
                aria-busy={state === 'loading'}
              >
                {state === 'loading' ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-4 h-4" aria-hidden="true" />
                    <span>Refresh</span>
                  </>
                )}
              </Button>
              <Link href="/admin/utilities">
                <Button variant="outline" className="flex items-center gap-2">
                  ← Back to Utilities
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <Card className="p-6 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Unable to load Key Vault status</h2>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">{error}</p>
                <p className="text-sm text-red-800 dark:text-red-200 mt-3">
                  Verify that the legacy KVM API is reachable and that `KEY_VAULT_API_BEARER` is configured on the server.
                </p>
              </div>
            </div>
          </Card>
        )}

        {state === 'loading' && !data && !error && (
          <Card className="p-6 mb-6" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <RefreshCcw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Loading Key Vault status</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Fetching the latest secret metadata and API health from Azure Key Vault&hellip;
                </p>
              </div>
            </div>
          </Card>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <Shield
                    className={`w-8 h-8 ${
                      data.status.isOperational
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Key Vault API Status</p>
                    <p
                      className={`text-lg font-semibold ${
                        data.status.isOperational
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {data.status.raw}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Checked</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(data.checkedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Environment: {data.environmentLabel}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={`w-8 h-8 ${
                      summary && summary.expired + summary.expiringSoon > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Secret Coverage</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {summary?.total ?? 0} monitored secrets
                    </p>
                    {summary && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {summary.expired > 0 && (
                          <span className="text-red-600 dark:text-red-400 font-medium mr-2">
                            {summary.expired} expired
                          </span>
                        )}
                        {summary.expiringSoon > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {summary.expiringSoon} expiring soon
                          </span>
                        )}
                        {summary.expired === 0 && summary.expiringSoon === 0 && 'All up to date'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <caption className="sr-only">Azure Key Vault secret expiration details</caption>
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Secret Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Expires On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time Remaining
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {data.secrets.map((secret) => {
                      const created = secret.createdOn ? new Date(secret.createdOn).toLocaleString() : 'Unknown'
                      const expires = secret.expiresOn ? new Date(secret.expiresOn).toLocaleString() : 'No expiry'
                      const timeRemaining =
                        secret.daysUntilExpiry === null
                          ? 'Unknown'
                          : secret.daysUntilExpiry >= 0
                          ? `${secret.daysUntilExpiry} day${secret.daysUntilExpiry === 1 ? '' : 's'}`
                          : `${Math.abs(secret.daysUntilExpiry)} day${secret.daysUntilExpiry === -1 ? '' : 's'} overdue`

                      let statusLabel = 'Healthy'
                      let statusClass = 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40'
                      let StatusIcon = CheckCircle2

                      if (secret.isExpired) {
                        statusLabel = 'Expired'
                        statusClass = 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40'
                        StatusIcon = XCircle
                      } else if (secret.isExpiringSoon) {
                        statusLabel = 'Expiring Soon'
                        statusClass = 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40'
                        StatusIcon = AlertTriangle
                      }

                      return (
                        <tr key={secret.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{secret.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {secret.source === 'default' ? 'Default monitored secret' : 'Custom monitored secret'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{created}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{expires}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{timeRemaining}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}
                            >
                              <StatusIcon className="w-4 h-4" aria-hidden="true" />
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Operational Guidance</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                    <li>
                      Secrets flagged as <strong>Expiring Soon</strong> have 30 days or fewer remaining. Rotate these secrets and update
                      configuration before their expiry date.
                    </li>
                    <li>
                      Secrets marked as <strong>Expired</strong> require immediate rotation in Azure Key Vault and downstream systems.
                    </li>
                    <li>
                      Configure monitored secret names via environment variables: <code>KEY_VAULT_SECRET_NAMES</code> for explicit lists or{' '}
                      <code>KEY_VAULT_SECRET_SUFFIXES</code> combined with <code>KEY_VAULT_ENVIRONMENT</code> for prefixed sets.
                    </li>
                    <li>
                      Review and rotate secrets within Azure Portal as needed.&nbsp;
                      <a
                        href="https://portal.azure.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 underline"
                      >
                        Open Azure Portal
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}


