'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { DollarSign, Calendar, TrendingUp, Download, Eye, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

interface LargeOrder {
  id: string
  order_number: string
  user_id: string | null
  customer_name: string
  customer_email: string
  phone: string | null
  status: string
  payment_status: string
  payment_method: string
  total: number
  created_at: number
  paid_at: number | null
}

export default function AdminLargeOrdersPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  
  const [orders, setOrders] = useState<LargeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [minTotal, setMinTotal] = useState(600)
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/orders/large')
    }
  }, [session, isPending, router])

  // Fetch orders
  useEffect(() => {
    if (!session?.user) return
    fetchOrders()
  }, [session, minTotal, dateFrom, dateTo])

  async function fetchOrders() {
    try {
      setLoading(true)
      setError(null)
      
      // Client-side validation
      if (minTotal < 0 || minTotal > 1000000) {
        setError('Minimum total must be between $0 and $1,000,000')
        setLoading(false)
        return
      }

      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        setError('Invalid date format')
        setLoading(false)
        return
      }

      if (fromDate > toDate) {
        setError('Start date must be before end date')
        setLoading(false)
        return
      }

      const oneYear = 365 * 24 * 60 * 60 * 1000
      if (toDate.getTime() - fromDate.getTime() > oneYear) {
        setError('Date range cannot exceed 1 year')
        setLoading(false)
        return
      }
      
      const params = new URLSearchParams({
        min_total: minTotal.toString(),
        date_from: dateFrom,
        date_to: dateTo,
      })

      const response = await fetch(`/api/admin/orders/large?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch large orders')
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (err: any) {
      console.error('Error fetching large orders:', err)
      setError(err.message || 'Failed to load large orders')
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  function getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'stripe':
        return 'Stripe'
      case 'paypal':
        return 'PayPal'
      default:
        return method
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading large orders report...</p>
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
            { label: 'Orders', href: '/admin/orders' },
            { label: 'Large Orders', href: '/admin/orders/large' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors mb-2">
            Large Orders Report
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            View orders above a specified total amount
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchOrders()
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <label htmlFor="min-total" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Minimum Total ($)
              </label>
              <input
                id="min-total"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                value={minTotal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0 && val <= 1000000) {
                    setMinTotal(val)
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                aria-label="Minimum order total in dollars"
                aria-describedby="min-total-help"
              />
              <p id="min-total-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter amount between $0 and $1,000,000
              </p>
            </div>

            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Start Date
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                aria-label="Report start date"
                aria-describedby="date-from-help"
              />
              <p id="date-from-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Cannot be in the future
              </p>
            </div>

            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                End Date
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                aria-label="Report end date"
                aria-describedby="date-to-help"
              />
              <p id="date-to-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be after start date
              </p>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                aria-label="Update report with new filters"
              >
                <TrendingUp className="w-4 h-4 mr-2" aria-hidden="true" />
                Update Report
              </Button>
            </div>
          </form>
        </Card>

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" role="region" aria-label="Large Orders Summary">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {orders.length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Average Order</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                    {formatCurrency(orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
            </Card>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" role="alert" aria-live="assertive">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Orders Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Large orders table">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Paid Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Payment Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400 transition-colors" role="status" aria-live="polite">
                        {loading ? 'Loading large orders...' : `No orders found above $${minTotal.toFixed(2)}`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                          aria-label={`View order ${order.order_number} details`}
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        <div>
                          <span>{order.customer_name}</span>
                          {order.user_id && (
                            <span className="block text-xs text-gray-500 dark:text-gray-400 transition-colors">
                              ID: {order.user_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        <a
                          href={`mailto:${order.customer_email}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                          aria-label={`Send email to ${order.customer_email}`}
                        >
                          <Mail className="w-3 h-3" aria-hidden="true" />
                          <span>{order.customer_email}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {order.phone ? (
                          <a
                            href={`tel:${order.phone.replace(/[^\d+]/g, '')}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                            aria-label={`Call ${order.phone}`}
                          >
                            <Phone className="w-3 h-3" aria-hidden="true" />
                            <span>{order.phone}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400" aria-label="No phone number available">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {formatDate(order.paid_at || order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                          aria-label={`Order status: ${order.status}`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {getPaymentMethodLabel(order.payment_method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                          aria-label={`View order ${order.order_number} details`}
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
        </Card>
      </div>
    </div>
  )
}

