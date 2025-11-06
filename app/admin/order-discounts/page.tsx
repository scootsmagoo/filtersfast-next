'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Percent,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { formatDateString } from '@/lib/utils/order-discounts'

interface OrderDiscount {
  id: number
  disc_code: string
  disc_perc: number | null
  disc_amt: number | null
  disc_from_amt: number
  disc_to_amt: number
  disc_status: 'A' | 'I' | 'U'
  disc_once_only: 'Y' | 'N'
  disc_valid_from: string
  disc_valid_to: string
  created_at: number
  updated_at: number
}

interface OrderDiscountStats {
  total: number
  active: number
  inactive: number
  used: number
  onceOnly: number
  reusable: number
}

export default function AdminOrderDiscountsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [discounts, setDiscounts] = useState<OrderDiscount[]>([])
  const [stats, setStats] = useState<OrderDiscountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [onceOnlyFilter, setOnceOnlyFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'disc_code' | 'disc_valid_from'>('disc_code')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const discountsPerPage = 25

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/order-discounts')
    }
  }, [session, isPending, router])

  // Fetch discounts and stats
  useEffect(() => {
    if (!session?.user) return
    fetchDiscounts()
    fetchStats()
  }, [session, searchQuery, statusFilter, onceOnlyFilter, sortField, currentPage])

  async function fetchDiscounts() {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: discountsPerPage.toString(),
        sortField: sortField,
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (onceOnlyFilter !== 'all') {
        params.append('onceOnly', onceOnlyFilter)
      }

      const response = await fetch(`/api/admin/order-discounts?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch order discounts')
      }

      const data = await response.json()
      setDiscounts(data.discounts || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching order discounts:', err)
      setError(err.message || 'Failed to load order discounts')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/order-discounts/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  async function handleDelete(ids: number[]) {
    // Use a more accessible confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete ${ids.length} discount(s)? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/admin/order-discounts?ids=${ids.join(',')}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete discounts')
      }

      setSelectedIds([])
      fetchDiscounts()
      fetchStats()
    } catch (err: any) {
      console.error('Error deleting discounts:', err)
      alert(err.message || 'Failed to delete discounts')
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'A':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'I':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'U':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'A':
        return 'Active'
      case 'I':
        return 'Inactive'
      case 'U':
        return 'Used'
      default:
        return status
    }
  }

  function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(discounts.map(d => d.id))
    } else {
      setSelectedIds([])
    }
  }

  function handleSelectOne(id: number, checked: boolean) {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id))
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading order discounts...</p>
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
            { label: 'Order Discounts', href: '/admin/order-discounts' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Order Discounts
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage discount codes that apply to entire orders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/order-discounts/stats">
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  View Statistics
                </Button>
              </Link>
              <Link href="/admin/order-discounts/new">
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Discount
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6" role="region" aria-label="Order Discounts Statistics">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.total}
                  </p>
                </div>
                <Tag className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.active}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.inactive}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Used</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.used}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Once Only</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.onceOnly}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Reusable</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {stats.reusable}
                  </p>
                </div>
                <Tag className="w-8 h-8 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search-discounts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Search Code
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="search-discounts"
                  type="text"
                  placeholder="Search discount codes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  aria-label="Search order discounts by code"
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
                aria-label="Filter discounts by status"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="A">Active</option>
                <option value="I">Inactive</option>
                <option value="U">Used</option>
              </select>
            </div>

            {/* Once Only Filter */}
            <div>
              <label htmlFor="once-only-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Once Only
              </label>
              <select
                id="once-only-filter"
                value={onceOnlyFilter}
                onChange={(e) => {
                  setOnceOnlyFilter(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Filter discounts by once only"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="all">All</option>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>

            {/* Sort Field */}
            <div>
              <label htmlFor="sort-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Sort By
              </label>
              <select
                id="sort-field"
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value as 'disc_code' | 'disc_valid_from')
                  setCurrentPage(1)
                }}
                aria-label="Sort discounts"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="disc_code">Discount Code</option>
                <option value="disc_valid_from">Valid From Date</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" role="alert" aria-live="assertive">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Discounts Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Order discounts table">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === discounts.length && discounts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all discounts"
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Order Amount Range
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Discount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Once Only
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Valid Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {discounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400 transition-colors" role="status" aria-live="polite">
                        {loading ? 'Loading order discounts...' : 'No order discounts found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  discounts.map((discount) => (
                    <tr
                      key={discount.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(discount.id)}
                          onChange={(e) => handleSelectOne(discount.id, e.target.checked)}
                          aria-label={`Select discount ${discount.disc_code}`}
                          className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                          {discount.disc_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
                          {formatCurrency(discount.disc_from_amt)} - {formatCurrency(discount.disc_to_amt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {discount.disc_perc !== null ? (
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                            <Percent className="w-4 h-4" />
                            {discount.disc_perc.toFixed(2)}%
                          </div>
                        ) : discount.disc_amt !== null ? (
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(discount.disc_amt)}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            discount.disc_status
                          )}`}
                          aria-label={`Discount status: ${getStatusLabel(discount.disc_status)}`}
                        >
                          {getStatusLabel(discount.disc_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {discount.disc_once_only === 'Y' ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {formatDateString(discount.disc_valid_from)} - {formatDateString(discount.disc_valid_to)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/order-discounts/${discount.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label={`Edit discount ${discount.disc_code}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </Link>
                          <button
                            onClick={() => handleDelete([discount.id])}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                            aria-label={`Delete discount ${discount.disc_code}`}
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors">
              <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                {selectedIds.length} discount(s) selected
              </div>
              <Button
                onClick={() => handleDelete(selectedIds)}
                className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                aria-label={`Delete ${selectedIds.length} selected discount(s)`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors">
              <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                Showing {((currentPage - 1) * discountsPerPage) + 1} to{' '}
                {Math.min(currentPage * discountsPerPage, total)} of {total} discounts
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

