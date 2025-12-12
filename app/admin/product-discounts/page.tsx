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
  Package,
  Folder,
  Globe,
} from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import {
  formatDateString,
  getTargetTypeLabel,
  getProductTypeLabel,
} from '@/lib/utils/product-discounts'

interface ProductDiscount {
  id: number
  disc_code: string
  disc_type: 'percentage' | 'amount'
  disc_perc: number | null
  disc_amt: number | null
  target_type: 'global' | 'product' | 'category' | 'product_type'
  target_id: number | null
  target_product_type: string | null
  disc_from_amt: number
  disc_to_amt: number
  disc_status: 'A' | 'I'
  disc_valid_from: string
  disc_valid_to: string
  disc_free_shipping: boolean
  disc_multi_by_qty: boolean
  disc_once_only: boolean
  disc_compoundable: boolean
  disc_allow_on_forms: boolean
  disc_notes: string | null
  created_at: number
  updated_at: number
}

interface ProductDiscountStats {
  total: number
  active: number
  inactive: number
  global: number
  product: number
  category: number
  product_type: number
  percentage: number
  amount: number
}

export default function AdminProductDiscountsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [discounts, setDiscounts] = useState<ProductDiscount[]>([])
  const [stats, setStats] = useState<ProductDiscountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'disc_code' | 'disc_valid_from' | 'created_at'>(
    'disc_valid_from'
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const discountsPerPage = 25

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteIds, setDeleteIds] = useState<number[]>([])

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/product-discounts')
    }
  }, [session, isPending, router])

  // Fetch discounts and stats
  useEffect(() => {
    if (!session?.user) return
    fetchDiscounts()
    fetchStats()
  }, [session, searchQuery, statusFilter, targetTypeFilter, sortField, currentPage])

  // Handle escape key to close dialog
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && deleteConfirmOpen) {
        setDeleteConfirmOpen(false)
        setDeleteIds([])
      }
    }
    if (deleteConfirmOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [deleteConfirmOpen])

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
      if (targetTypeFilter !== 'all') {
        params.append('targetType', targetTypeFilter)
      }

      const response = await fetch(`/api/admin/product-discounts?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch product discounts')
      }

      const data = await response.json()
      setDiscounts(data.discounts || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching product discounts:', err)
      setError(err.message || 'Failed to load product discounts')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/product-discounts/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  function handleDeleteClick(ids: number[]) {
    setDeleteIds(ids)
    setDeleteConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    try {
      const response = await fetch(`/api/admin/product-discounts?ids=${deleteIds.join(',')}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete discounts')
      }

      setSelectedIds([])
      setDeleteConfirmOpen(false)
      setDeleteIds([])
      fetchDiscounts()
      fetchStats()
    } catch (err: any) {
      console.error('Error deleting discounts:', err)
      setError(err.message || 'Failed to delete discounts')
      setDeleteConfirmOpen(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'A':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'I':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
      default:
        return status
    }
  }

  function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
  }

  function getTargetDisplay(discount: ProductDiscount): string {
    switch (discount.target_type) {
      case 'global':
        return 'Global (All Products)'
      case 'product':
        return `Product #${discount.target_id}`
      case 'category':
        return `Category #${discount.target_id}`
      case 'product_type':
        return getProductTypeLabel(discount.target_product_type)
      default:
        return discount.target_type
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(discounts.map((d) => d.id))
    } else {
      setSelectedIds([])
    }
  }

  function handleSelectOne(id: number, checked: boolean) {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"
            aria-hidden="true"
          ></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">
            Loading product discounts...
          </p>
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
            { label: 'Product Discounts', href: '/admin/product-discounts' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Product Discounts
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage discounts that apply to specific products, categories, or product types
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/product-discounts/new">
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
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            role="region"
            aria-label="Product Discounts Statistics"
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total</p>
                  <p
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors"
                    aria-live="polite"
                  >
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
                  <p
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors"
                    aria-live="polite"
                  >
                    {stats.active}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Percentage</p>
                  <p
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors"
                    aria-live="polite"
                  >
                    {stats.percentage}
                  </p>
                </div>
                <Percent className="w-8 h-8 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Amount</p>
                  <p
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors"
                    aria-live="polite"
                  >
                    {stats.amount}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label
                htmlFor="search-discounts"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
              >
                Search Code
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="search-discounts"
                  type="text"
                  placeholder="Search discount codes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  aria-label="Search product discounts by code"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
              >
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
              </select>
            </div>

            {/* Target Type Filter */}
            <div>
              <label
                htmlFor="target-type-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
              >
                Target Type
              </label>
              <select
                id="target-type-filter"
                value={targetTypeFilter}
                onChange={(e) => {
                  setTargetTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Filter discounts by target type"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="global">Global</option>
                <option value="product">Product</option>
                <option value="category">Category</option>
                <option value="product_type">Product Type</option>
              </select>
            </div>

            {/* Sort Field */}
            <div>
              <label
                htmlFor="sort-field"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
              >
                Sort By
              </label>
              <select
                id="sort-field"
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value as 'disc_code' | 'disc_valid_from' | 'created_at')
                  setCurrentPage(1)
                }}
                aria-label="Sort discounts"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="disc_code">Discount Code</option>
                <option value="disc_valid_from">Valid From Date</option>
                <option value="created_at">Created Date</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card
            className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Discounts Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Product discounts table">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.length === discounts.length && discounts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all discounts"
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    Target
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    Cart Range
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    Valid Dates
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {discounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400 transition-colors" role="status" aria-live="polite">
                        {loading ? 'Loading product discounts...' : 'No product discounts found'}
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
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 transition-colors">
                          {discount.target_type === 'global' && (
                            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                          {discount.target_type === 'product' && (
                            <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                          {discount.target_type === 'category' && (
                            <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          )}
                          {discount.target_type === 'product_type' && (
                            <Tag className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          )}
                          <span>{getTargetDisplay(discount)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {discount.disc_type === 'percentage' && discount.disc_perc !== null ? (
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                            <Percent className="w-4 h-4" />
                            {discount.disc_perc.toFixed(2)}%
                          </div>
                        ) : discount.disc_type === 'amount' && discount.disc_amt !== null ? (
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(discount.disc_amt)}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
                          {formatCurrency(discount.disc_from_amt)} - {formatCurrency(discount.disc_to_amt)}
                        </div>
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
                        {formatDateString(discount.disc_valid_from)} - {formatDateString(discount.disc_valid_to)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/product-discounts/${discount.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label={`Edit discount ${discount.disc_code}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick([discount.id])}
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
                onClick={() => handleDeleteClick(selectedIds)}
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
                Showing {(currentPage - 1) * discountsPerPage + 1} to{' '}
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

        {/* Delete Confirmation Dialog */}
        {deleteConfirmOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setDeleteConfirmOpen(false)
                setDeleteIds([])
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDeleteConfirmOpen(false)
                setDeleteIds([])
              }
            }}
          >
            <Card className="max-w-md w-full mx-4 p-6" tabIndex={-1}>
              <h2 id="delete-dialog-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Confirm Deletion
              </h2>
              <p id="delete-dialog-description" className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete {deleteIds.length} discount(s)? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmOpen(false)
                    setDeleteIds([])
                  }}
                  aria-label="Cancel deletion"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  aria-label="Confirm deletion"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

