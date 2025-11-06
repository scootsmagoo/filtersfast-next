'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Tag,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowLeft,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

interface OrderDiscountStats {
  total: number
  active: number
  inactive: number
  used: number
  onceOnly: number
  reusable: number
}

export default function OrderDiscountStatsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [stats, setStats] = useState<OrderDiscountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/order-discounts/stats')
    }
  }, [session, isPending, router])

  // Fetch stats
  useEffect(() => {
    if (!session?.user) return
    fetchStats()
  }, [session])

  async function fetchStats() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/order-discounts/stats')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch statistics')
      }

      const data = await response.json()
      setStats(data.stats)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching order discount stats:', err)
      setError(err.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <AdminBreadcrumb
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Order Discounts', href: '/admin/order-discounts' },
              { label: 'Statistics', href: '/admin/order-discounts/stats' },
            ]}
          />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/order-discounts">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                Order Discount Statistics
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors mt-1">
                Comprehensive statistics and analytics for order discounts
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" role="alert" aria-live="assertive">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {stats && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors mb-1">Total Discounts</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                        {stats.total}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                      <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors mb-1">Active Discounts</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                        {stats.active}
                      </p>
                      {stats.total > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                          {((stats.active / stats.total) * 100).toFixed(1)}% of total
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors mb-1">Inactive Discounts</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors" aria-live="polite">
                        {stats.inactive}
                      </p>
                      {stats.total > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                          {((stats.inactive / stats.total) * 100).toFixed(1)}% of total
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                      <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Status Breakdown */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                Status Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Active</h3>
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Count</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats.active}</span>
                    </div>
                    {stats.total > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(stats.active / stats.total) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={stats.active}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        />
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Inactive</h3>
                    <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Count</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats.inactive}</span>
                    </div>
                    {stats.total > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gray-600 dark:bg-gray-500 h-2 rounded-full transition-all"
                          style={{ width: `${(stats.inactive / stats.total) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={stats.inactive}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        />
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Used</h3>
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Count</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats.used}</span>
                    </div>
                    {stats.total > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(stats.used / stats.total) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={stats.used}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Usage Type Breakdown */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                Usage Type Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Once Only</h3>
                    <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Count</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats.onceOnly}</span>
                    </div>
                    {stats.total > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-orange-600 dark:bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${(stats.onceOnly / stats.total) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={stats.onceOnly}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                      Discounts that can only be used once
                    </p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Reusable</h3>
                    <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Count</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{stats.reusable}</span>
                    </div>
                    {stats.total > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${(stats.reusable / stats.total) * 100}%` }}
                          role="progressbar"
                          aria-valuenow={stats.reusable}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                      Discounts that can be used multiple times
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Summary Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                  <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                    Statistics Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Total: </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats.total}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Active: </span>
                      <span className="font-semibold text-green-600 dark:text-green-400 transition-colors">{stats.active}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Inactive: </span>
                      <span className="font-semibold text-gray-600 dark:text-gray-400 transition-colors">{stats.inactive}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Used: </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 transition-colors">{stats.used}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!stats && !loading && (
          <Card className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              No Statistics Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 transition-colors">
              Statistics will appear here once you have order discounts in the system.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

