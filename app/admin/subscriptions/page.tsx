/**
 * Admin Subscription Management Page
 * Manage customer subscriptions, view statistics, and handle subscription issues
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react'

interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  pausedSubscriptions: number
  cancelledSubscriptions: number
  monthlyRevenue: number
  averageOrderValue: number
  churnRate: number
  newThisMonth: number
}

interface SubscriptionListItem {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  status: 'active' | 'paused' | 'cancelled'
  frequency: number
  itemCount: number
  totalValue: number
  nextDeliveryDate: string
  createdAt: string
}

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('nextDelivery')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch subscription statistics
      const statsRes = await fetch('/api/admin/subscriptions/stats')
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }

      // Fetch subscription list
      const listRes = await fetch('/api/admin/subscriptions')
      if (listRes.ok) {
        const data = await listRes.json()
        setSubscriptions(data.subscriptions)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubscriptions = subscriptions
    .filter(sub => {
      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          sub.customerName.toLowerCase().includes(term) ||
          sub.customerEmail.toLowerCase().includes(term) ||
          sub.id.toLowerCase().includes(term)
        )
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nextDelivery':
          return new Date(a.nextDeliveryDate).getTime() - new Date(b.nextDeliveryDate).getTime()
        case 'value':
          return b.totalValue - a.totalValue
        case 'customer':
          return a.customerName.localeCompare(b.customerName)
        default:
          return 0
      }
    })

  const exportSubscriptions = () => {
    // Create CSV export
    const headers = ['ID', 'Customer', 'Email', 'Status', 'Frequency', 'Items', 'Value', 'Next Delivery', 'Created']
    const rows = filteredSubscriptions.map(sub => [
      sub.id,
      sub.customerName,
      sub.customerEmail,
      sub.status,
      `${sub.frequency} months`,
      sub.itemCount,
      `$${sub.totalValue.toFixed(2)}`,
      sub.nextDeliveryDate,
      sub.createdAt
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"
          role="status"
          aria-label="Loading subscriptions"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <AdminBreadcrumb />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
          Subscription Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 transition-colors">
          Manage Home Filter Club subscriptions and view analytics
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {stats.totalSubscriptions}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 transition-colors">
                  +{stats.newThisMonth} this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-colors" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {stats.activeSubscriptions}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  {stats.pausedSubscriptions} paused
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400 transition-colors" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  ${stats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  Avg: ${stats.averageOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center transition-colors">
                <DollarSign className="w-6 h-6 text-brand-orange" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Churn Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {stats.churnRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  {stats.cancelledSubscriptions} cancelled
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center transition-colors">
                <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400 transition-colors" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by customer name, email, or subscription ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              aria-label="Search subscriptions by customer name, email, or ID"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              aria-label="Filter subscriptions by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            aria-label="Sort subscriptions by"
          >
            <option value="nextDelivery">Next Delivery</option>
            <option value="value">Value (High to Low)</option>
            <option value="customer">Customer Name</option>
          </select>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchData}
              aria-label="Refresh subscription list"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button 
              variant="outline" 
              onClick={exportSubscriptions}
              aria-label="Export subscriptions to CSV"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Subscription List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 transition-colors">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Next Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 transition-colors">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                          {sub.customerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                          {sub.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : sub.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                      {sub.frequency} month{sub.frequency > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                      {sub.itemCount} item{sub.itemCount > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                      ${sub.totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(sub.nextDeliveryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/subscriptions/${sub.id}`)}
                        aria-label={`View subscription details for ${sub.customerName}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

