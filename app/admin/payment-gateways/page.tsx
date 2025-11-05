'use client'

/**
 * Payment Gateway Management Dashboard
 * 
 * Admin interface for managing payment gateway configurations
 * WCAG 2.1 Level AA Compliant
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import { CreditCard, CheckCircle, XCircle, Settings, TrendingUp, DollarSign, Activity } from 'lucide-react'

interface PaymentGateway {
  id: number
  gateway_type: string
  gateway_name: string
  status: 'active' | 'inactive' | 'testing'
  is_primary: boolean
  is_backup: boolean
  priority: number
  test_mode: boolean
  stats: {
    total_transactions: number
    successful_transactions: number
    failed_transactions: number
    total_volume: number
    success_rate: number
  }
}

export default function PaymentGatewaysAdmin() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/payment-gateways')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchGateways()
    }
  }, [session])

  const fetchGateways = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/payment-gateways')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Gateway API error:', response.status, errorData)
        
        if (response.status === 401) {
          setError('Authentication required. Please sign in to continue.')
        } else if (response.status === 403) {
          setError('Admin access required. Please ensure you are configured as an administrator.')
        } else if (response.status === 503 && errorData.error_code === 'ADMIN_NOT_INITIALIZED') {
          setError('Admin system not initialized')
        } else {
          setError(errorData.error || 'Failed to fetch payment gateways. Please try again.')
        }
        return
      }

      const data = await response.json()
      setGateways(data.gateways || [])
    } catch (err) {
      console.error('Error fetching gateways:', err)
      setError('Failed to load payment gateways. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (gatewayId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const response = await fetch('/api/admin/payment-gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gatewayId, status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update gateway')
      }

      // Refresh gateways list
      await fetchGateways()
    } catch (err) {
      console.error('Error updating gateway:', err)
      // WCAG 3.3.1: Accessible error notification
      setError(err instanceof Error ? err.message : 'Failed to update gateway status. Please try again.')
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"
            role="status"
            aria-label="Loading payment gateways"
          ></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors">Loading payment gateways...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const totalVolume = gateways.reduce((sum, g) => sum + g.stats.total_volume, 0)
  const totalTransactions = gateways.reduce((sum, g) => sum + g.stats.total_transactions, 0)
  const successfulTransactions = gateways.reduce((sum, g) => sum + g.stats.successful_transactions, 0)
  const overallSuccessRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            Payment Gateway Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Configure and monitor payment processing gateways
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2" id="error-title">⚠️ Setup Required</h2>
            <p className="text-red-700 dark:text-red-300 mb-4" aria-describedby="error-title">{error}</p>
            {error.includes('Admin system not initialized') && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-300 dark:border-red-700">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Quick Fix:</p>
                <code className="block bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm text-gray-900 dark:text-gray-100">
                  npm run init:admin-roles
                </code>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  This will create the admin user tables and assign you as an administrator.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Payment Gateway Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id="total-volume-label">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-labelledby="total-volume-label">
                    ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id="total-txn-label">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-labelledby="total-txn-label">
                    {totalTransactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id="success-rate-label">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-labelledby="success-rate-label">
                    {overallSuccessRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id="active-gw-label">Active Gateways</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-labelledby="active-gw-label">
                    {gateways.filter(g => g.status === 'active').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Gateway Cards */}
        <section aria-labelledby="gateways-heading">
          <h2 id="gateways-heading" className="sr-only">Payment Gateway Configurations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    gateway.status === 'active' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      gateway.status === 'active'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2" id={`gateway-${gateway.id}-title`}>
                      {gateway.gateway_name}
                      {gateway.is_primary && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-medium" role="status">
                          Primary
                        </span>
                      )}
                      {gateway.is_backup && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded font-medium" role="status">
                          Backup
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400" aria-describedby={`gateway-${gateway.id}-title`}>
                      Priority: {gateway.priority} • {gateway.test_mode ? 'Test Mode' : 'Live Mode'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(gateway.id, gateway.status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${
                    gateway.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  aria-label={`${gateway.status === 'active' ? 'Deactivate' : 'Activate'} ${gateway.gateway_name} gateway`}
                  aria-pressed={gateway.status === 'active'}
                >
                  {gateway.status === 'active' ? (
                    <>
                      <CheckCircle className="w-4 h-4 inline mr-1" aria-hidden="true" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 inline mr-1" aria-hidden="true" />
                      Inactive
                    </>
                  )}
                </button>
              </div>

              {/* Gateway Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700" role="group" aria-label={`${gateway.gateway_name} statistics`}>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id={`volume-${gateway.id}`}>Volume</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100" aria-labelledby={`volume-${gateway.id}`}>
                    ${gateway.stats.total_volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id={`txn-${gateway.id}`}>Transactions</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100" aria-labelledby={`txn-${gateway.id}`}>
                    {gateway.stats.total_transactions.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id={`rate-${gateway.id}`}>Success Rate</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100" aria-labelledby={`rate-${gateway.id}`}>
                    {gateway.stats.success_rate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" id={`failed-${gateway.id}`}>Failed</p>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400" aria-labelledby={`failed-${gateway.id}`}>
                    {gateway.stats.failed_transactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          </div>
        </section>

        {/* Setup Instructions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2" id="setup-guide">
            <Settings className="w-5 h-5" aria-hidden="true" />
            Quick Setup Guide
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold mb-2" id="step-1">1. Initialize Payment Gateway System</h3>
              <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm" role="code" aria-labelledby="step-1" tabIndex={0}>
                npm run init:payment-gateways
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2" id="step-2">2. Add Credentials to .env.local</h3>
              <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm whitespace-pre" role="code" aria-labelledby="step-2" tabIndex={0}>
{`STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
AUTHORIZENET_API_LOGIN_ID=...
AUTHORIZENET_TRANSACTION_KEY=...`}
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2" id="step-3">3. Gateway Configuration</h3>
              <ul className="list-disc list-inside space-y-1 text-sm" aria-labelledby="step-3">
                <li><strong>Stripe:</strong> Primary gateway - handles most transactions</li>
                <li><strong>PayPal:</strong> Alternative payment method</li>
                <li><strong>Authorize.Net:</strong> Backup gateway for automatic failover</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

