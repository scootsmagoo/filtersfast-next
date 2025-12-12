'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  ExternalLink,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

interface OrderCredit {
  id: number
  order_id: string
  user_id: string | null
  customer_email: string
  customer_name: string
  amount: number
  currency: string
  method: 'paypal' | 'stripe' | 'manual' | 'store_credit' | 'refund'
  reason: string
  note: string | null
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  status_code: string | null
  response: string | null
  payment_id: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: number
  updated_at: number
}

interface OrderCreditStats {
  total: number
  totalAmount: number
  byStatus: Record<string, number>
  byMethod: Record<string, number>
  recentCount: number
}

export default function AdminOrderCreditsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [credits, setCredits] = useState<OrderCredit[]>([])
  const [stats, setStats] = useState<OrderCreditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [searchType, setSearchType] = useState<'all' | 'order' | 'customer'>('all')
  const [searchValue, setSearchValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const creditsPerPage = 25

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/order-credits')
    }
  }, [session, isPending, router])

  // Fetch credits and stats
  useEffect(() => {
    if (!session?.user) return
    fetchCredits()
    fetchStats()
  }, [session, searchQuery, statusFilter, methodFilter, searchType, searchValue, currentPage])

  async function fetchCredits() {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: creditsPerPage.toString(),
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (methodFilter !== 'all') {
        params.append('method', methodFilter)
      }
      if (searchType === 'order' && searchValue) {
        params.append('order_id', searchValue)
      }
      if (searchType === 'customer' && searchValue) {
        params.append('customer_email', searchValue)
      }

      const response = await fetch(`/api/admin/order-credits?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch order credits')
      }

      const data = await response.json()
      setCredits(data.credits || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching order credits:', err)
      setError(err.message || 'Failed to load order credits')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/order-credits/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  function getMethodLabel(method: string) {
    switch (method) {
      case 'paypal':
        return 'PayPal'
      case 'stripe':
        return 'Stripe'
      case 'manual':
        return 'Manual'
      case 'store_credit':
        return 'Store Credit'
      case 'refund':
        return 'Refund'
      default:
        return method
    }
  }

  function formatCurrency(amount: number, currency: string) {
    const symbols: Record<string, string> = {
      USD: '$',
      CAD: 'C$',
      EUR: '€',
      GBP: '£',
    }
    const symbol = symbols[currency] || currency
    return `${symbol}${amount.toFixed(2)}`
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading order credits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Order Credits', href: '/admin/order-credits' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            Order Credits
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Track and manage store credits applied to orders
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6" role="region" aria-label="Order Credits Statistics">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Credits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.total}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {formatCurrency(stats.totalAmount, 'USD')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Successful</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.byStatus.success || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.byStatus.pending || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Last 7 Days</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.recentCount}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search-credits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="search-credits"
                  type="text"
                  placeholder="Search credits..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  aria-label="Search order credits by order ID, customer email, name, or reason"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Filter credits by status"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Method Filter */}
            <div>
              <label htmlFor="method-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Method
              </label>
              <select
                id="method-filter"
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Filter credits by payment method"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="all">All Methods</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="manual">Manual</option>
                <option value="store_credit">Store Credit</option>
                <option value="refund">Refund</option>
              </select>
            </div>

            {/* Quick Search */}
            <div>
              <label htmlFor="quick-search-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Quick Search
              </label>
              <div className="flex gap-2">
                <select
                  id="quick-search-type"
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value as any)
                    setSearchValue('')
                  }}
                  aria-label="Select quick search type"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <option value="all">All</option>
                  <option value="order">Order ID</option>
                  <option value="customer">Customer Email</option>
                </select>
                {searchType !== 'all' && (
                  <input
                    id="quick-search-value"
                    type={searchType === 'order' ? 'text' : 'email'}
                    placeholder={searchType === 'order' ? 'Order ID' : 'Email'}
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value)
                      setCurrentPage(1)
                    }}
                    aria-label={searchType === 'order' ? 'Enter order ID to search' : 'Enter customer email to search'}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" role="alert" aria-live="assertive">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Credits Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Order credits table">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Order / Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Created By
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {credits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400 transition-colors" role="status" aria-live="polite">
                        {loading ? 'Loading order credits...' : 'No order credits found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  credits.map((credit) => (
                    <tr
                      key={credit.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <Link
                            href={`/admin/orders/${credit.order_id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {credit.order_id}
                          </Link>
                          <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                            {credit.customer_name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 transition-colors">
                            {credit.customer_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
                          {getMethodLabel(credit.method)}
                        </span>
                        {credit.payment_id && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 block transition-colors">
                            ID: {credit.payment_id.substring(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
                          {credit.reason}
                        </div>
                        {credit.note && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                            {credit.note}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                          {formatCurrency(credit.amount, credit.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            credit.status
                          )}`}
                          aria-label={`Credit status: ${credit.status}`}
                        >
                          {getStatusIcon(credit.status)}
                          <span>{credit.status.toUpperCase()}</span>
                        </span>
                        {credit.status_code && credit.status !== 'success' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                            {credit.status_code}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {formatDate(credit.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {credit.created_by_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/orders/${credit.order_id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                          aria-label={`View order ${credit.order_id} details`}
                        >
                          <Eye className="w-4 h-4 inline" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors">
              <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                Showing {((currentPage - 1) * creditsPerPage) + 1} to{' '}
                {Math.min(currentPage * creditsPerPage, total)} of {total} credits
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

