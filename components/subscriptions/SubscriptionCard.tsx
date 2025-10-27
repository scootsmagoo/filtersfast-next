'use client'

import { useState } from 'react'
import { Subscription, SubscriptionItem } from '@/lib/types/subscription'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Calendar,
  Package,
  Pause,
  Play,
  XCircle,
  Edit2,
  ChevronDown,
  ChevronUp,
  Truck,
  DollarSign
} from 'lucide-react'

interface SubscriptionCardProps {
  subscription: Subscription
  items: SubscriptionItem[]
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string, reason?: string) => void
  onEdit?: (id: string) => void
}

export default function SubscriptionCard({
  subscription,
  items,
  onPause,
  onResume,
  onCancel,
  onEdit
}: SubscriptionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountedPrice = totalPrice * (1 - subscription.discountPercentage / 100)
  const savings = totalPrice - discountedPrice

  const statusConfig = {
    active: {
      color: 'bg-green-100 text-green-800',
      label: 'Active',
      icon: Package
    },
    paused: {
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Paused',
      icon: Pause
    },
    cancelled: {
      color: 'bg-red-100 text-red-800',
      label: 'Cancelled',
      icon: XCircle
    },
    expired: {
      color: 'bg-gray-100 text-gray-800',
      label: 'Expired',
      icon: XCircle
    }
  }

  const status = statusConfig[subscription.status]
  const StatusIcon = status.icon

  const handleCancel = () => {
    if (onCancel) {
      onCancel(subscription.id, cancelReason || undefined)
      setShowCancelDialog(false)
      setCancelReason('')
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {items.length} Item{items.length !== 1 ? 's' : ''} - Every {subscription.frequency} Month{subscription.frequency !== 1 ? 's' : ''}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Next delivery: {subscription.nextDeliveryDate.toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>
                ${discountedPrice.toFixed(2)} (Save ${savings.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-700 p-1"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Items List */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Subscription Items:</h4>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-medium">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-700 font-medium">Subscribe & Save (5%):</span>
              <span className="text-green-700 font-medium">-${savings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-blue-300">
              <span>Total per delivery:</span>
              <span className="text-brand-orange">${discountedPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {subscription.status === 'active' && onPause && (
              <Button
                variant="secondary"
                onClick={() => onPause(subscription.id)}
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}

            {subscription.status === 'paused' && onResume && (
              <Button
                onClick={() => onResume(subscription.id)}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}

            {onEdit && subscription.status !== 'cancelled' && (
              <Button
                variant="secondary"
                onClick={() => onEdit(subscription.id)}
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Items
              </Button>
            )}

            {onCancel && subscription.status !== 'cancelled' && (
              <Button
                variant="secondary"
                onClick={() => setShowCancelDialog(true)}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel Subscription
              </Button>
            )}
          </div>

          {/* Pause Info */}
          {subscription.status === 'paused' && subscription.pausedUntil && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              ⏸️ Paused until {subscription.pausedUntil.toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Cancel Subscription?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this subscription? You can always subscribe again later.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                rows={3}
                placeholder="Let us know why you're cancelling..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCancelDialog(false)
                  setCancelReason('')
                }}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancel}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Yes, Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}

