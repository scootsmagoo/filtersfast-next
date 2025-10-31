'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SubscriptionCard from '@/components/subscriptions/SubscriptionCard'
import { Package, Plus, ArrowLeft, Pause, Truck } from 'lucide-react'
import Link from 'next/link'
import { Subscription, SubscriptionItem } from '@/lib/types/subscription'

export default function SubscriptionsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [subscriptions, setSubscriptions] = useState<(Subscription & { items: SubscriptionItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/account/subscriptions')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptions()
    }
  }, [session])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePause = async (id: string) => {
    setActionLoading(id)
    try {
      const response = await fetch(`/api/subscriptions/${id}/pause`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchSubscriptions()
        alert('Subscription paused successfully!')
      } else {
        alert('Failed to pause subscription')
      }
    } catch (error) {
      console.error('Error pausing subscription:', error)
      alert('Failed to pause subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResume = async (id: string) => {
    setActionLoading(id)
    try {
      const response = await fetch(`/api/subscriptions/${id}/resume`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchSubscriptions()
        alert('Subscription resumed successfully!')
      } else {
        alert('Failed to resume subscription')
      }
    } catch (error) {
      console.error('Error resuming subscription:', error)
      alert('Failed to resume subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: string, reason?: string) => {
    setActionLoading(id)
    try {
      const response = await fetch(`/api/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        await fetchSubscriptions()
        alert('Subscription cancelled successfully')
      } else {
        alert('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setActionLoading(null)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const activeCount = subscriptions.filter(s => s.status === 'active').length
  const pausedCount = subscriptions.filter(s => s.status === 'paused').length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/account" 
            className="inline-flex items-center gap-2 text-brand-blue hover:underline mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Account
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">My Subscriptions</h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage your Subscribe & Save automatic deliveries
              </p>
            </div>
            
            <Link href="/">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{activeCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Pause className="w-5 h-5 text-yellow-600 dark:text-yellow-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Paused</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{pausedCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Truck className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{subscriptions.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4 transition-colors" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              No Subscriptions Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
              Subscribe to products and save 5% on every delivery!
            </p>
            <Link href="/">
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Browse Products
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map(sub => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                items={sub.items}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                onEdit={(id) => router.push(`/account/subscriptions/${id}`)}
              />
            ))}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 transition-colors">Subscribe & Save Benefits</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 transition-colors">
            <li>✓ <strong>Save 5%</strong> on every subscription order</li>
            <li>✓ <strong>Free shipping</strong> on subscription orders $50+</li>
            <li>✓ <strong>Never run out</strong> - automatic deliveries on your schedule</li>
            <li>✓ <strong>Full control</strong> - modify, pause, or cancel anytime</li>
            <li>✓ <strong>Add items</strong> to upcoming deliveries</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

