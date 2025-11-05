/**
 * Individual Subscription Management Page
 * View and edit a specific subscription
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  Edit2, 
  Pause, 
  Play, 
  XCircle,
  Plus,
  Trash2,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Subscription, SubscriptionItem, SubscriptionHistory } from '@/lib/types/subscription'

export default function SubscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const subscriptionId = params.id as string

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [items, setItems] = useState<SubscriptionItem[]>([])
  const [history, setHistory] = useState<SubscriptionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFrequency, setEditingFrequency] = useState(false)
  const [newFrequency, setNewFrequency] = useState(6)
  const [actionLoading, setActionLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/account/subscriptions')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionDetails()
    }
  }, [session, subscriptionId])

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`)
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setItems(data.subscription.items || [])
        setNewFrequency(data.subscription.frequency)
      } else if (response.status === 404) {
        router.push('/account/subscriptions')
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFrequency = async () => {
    if (!subscription) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: newFrequency })
      })

      if (response.ok) {
        await fetchSubscriptionDetails()
        setEditingFrequency(false)
        setStatusMessage({ type: 'success', text: 'Delivery frequency updated successfully!' })
        setTimeout(() => setStatusMessage(null), 5000)
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update frequency. Please try again.' })
        setTimeout(() => setStatusMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error updating frequency:', error)
      alert('Failed to update frequency')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePause = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/pause`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchSubscriptionDetails()
        setStatusMessage({ type: 'success', text: 'Subscription paused successfully!' })
        setTimeout(() => setStatusMessage(null), 5000)
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to pause subscription. Please try again.' })
        setTimeout(() => setStatusMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error pausing subscription:', error)
      setStatusMessage({ type: 'error', text: 'An error occurred. Please try again.' })
      setTimeout(() => setStatusMessage(null), 5000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/resume`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchSubscriptionDetails()
        setStatusMessage({ type: 'success', text: 'Subscription resumed successfully!' })
        setTimeout(() => setStatusMessage(null), 5000)
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to resume subscription. Please try again.' })
        setTimeout(() => setStatusMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error resuming subscription:', error)
      setStatusMessage({ type: 'error', text: 'An error occurred. Please try again.' })
      setTimeout(() => setStatusMessage(null), 5000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    const reason = prompt('Please tell us why you\'re cancelling (optional):')
    if (reason === null) return // User clicked cancel
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Customer requested cancellation' })
      })

      if (response.ok) {
        router.push('/account/subscriptions')
      } else {
        alert('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from your subscription?')) {
      return
    }

    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/items/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSubscriptionDetails()
        setStatusMessage({ type: 'success', text: 'Item removed successfully!' })
        setTimeout(() => setStatusMessage(null), 5000)
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to remove item. Please try again.' })
        setTimeout(() => setStatusMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error removing item:', error)
      setStatusMessage({ type: 'error', text: 'An error occurred. Please try again.' })
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"
          role="status"
          aria-label="Loading subscription details"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }

  if (!session?.user || !subscription) {
    return null
  }

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = totalPrice * (subscription.discountPercentage / 100)
  const totalWithDiscount = totalPrice - discountAmount

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Status Message (WCAG 4.1.3 - Status Messages) */}
        {statusMessage && (
          <div 
            className={`mb-6 p-4 rounded-lg ${
              statusMessage.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            } transition-colors`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {statusMessage.text}
          </div>
        )}

        {/* Back Link */}
        <Link 
          href="/account/subscriptions" 
          className="inline-flex items-center gap-2 text-brand-blue hover:underline mb-6 focus:outline-none focus:ring-2 focus:ring-brand-blue rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Subscriptions
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Subscription Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">
                ID: {subscription.id}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : subscription.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Schedule */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 transition-colors">
                  <Calendar className="w-5 h-5 text-brand-orange" aria-hidden="true" />
                  Delivery Schedule
                </h2>
                {!editingFrequency && subscription.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingFrequency(true)}
                    aria-label="Edit delivery schedule"
                  >
                    <Edit2 className="w-4 h-4 mr-1" aria-hidden="true" />
                    Edit
                  </Button>
                )}
              </div>

              {editingFrequency ? (
                <div className="space-y-4" role="form" aria-label="Edit delivery frequency">
                  <div>
                    <label htmlFor="edit-frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Delivery Frequency
                    </label>
                    <select
                      id="edit-frequency"
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(Number(e.target.value))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
                      aria-label="Select new delivery frequency"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>
                          Every {m} month{m > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleUpdateFrequency}
                      disabled={actionLoading}
                      aria-label="Save frequency changes"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingFrequency(false)
                        setNewFrequency(subscription.frequency)
                      }}
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors">Frequency</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      Every {subscription.frequency} month{subscription.frequency > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors">Next Delivery</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      {subscription.nextDeliveryDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {subscription.lastOrderDate && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Last Order</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                        {subscription.lastOrderDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Items */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 transition-colors">
                  <Package className="w-5 h-5 text-brand-orange" aria-hidden="true" />
                  Subscription Items ({items.length})
                </h2>
                <Link href="/">
                  <Button 
                    variant="outline" 
                    size="sm"
                    aria-label="Browse products to add to subscription"
                  >
                    <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                    Add Item
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                  >
                    {/* Image */}
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 transition-colors">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                        Qty: {item.quantity} • ${item.price.toFixed(2)} each
                      </p>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-gray-100 transition-colors">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors"
                        aria-label={`Remove ${item.productName} from subscription`}
                      >
                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400 transition-colors">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 dark:text-green-400 transition-colors">
                  <span>Subscribe & Save ({subscription.discountPercentage}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 dark:text-green-400 transition-colors">
                  <span>Shipping</span>
                  <span className="font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700 transition-colors">
                  <span>Total</span>
                  <span className="text-brand-orange">${totalWithDiscount.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Quick Actions</h3>
              <div className="space-y-2" role="group" aria-label="Subscription actions">
                {subscription.status === 'active' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handlePause}
                    disabled={actionLoading}
                    aria-label="Pause this subscription"
                  >
                    <Pause className="w-4 h-4 mr-2" aria-hidden="true" />
                    Pause Subscription
                  </Button>
                )}

                {subscription.status === 'paused' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleResume}
                    disabled={actionLoading}
                    aria-label="Resume this subscription"
                  >
                    <Play className="w-4 h-4 mr-2" aria-hidden="true" />
                    Resume Subscription
                  </Button>
                )}

                {subscription.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={handleCancel}
                    disabled={actionLoading}
                    aria-label="Cancel this subscription permanently"
                  >
                    <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </Card>

            {/* Subscription Info */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Subscription Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 transition-colors">Created</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                    {subscription.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 transition-colors">Last Updated</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                    {subscription.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 transition-colors">Discount</p>
                  <p className="font-medium text-green-600 dark:text-green-400 transition-colors">
                    {subscription.discountPercentage}% off
                  </p>
                </div>
              </div>
            </Card>

            {/* Help */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-colors">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 transition-colors">
                Need Help?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-4 transition-colors">
                Questions about your subscription? We're here to help!
              </p>
              <Link href="/support">
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

