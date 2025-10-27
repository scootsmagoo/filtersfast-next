'use client'

import { useState } from 'react'
import { Package, Percent, Calendar } from 'lucide-react'

interface SubscriptionToggleProps {
  productId: string
  productName: string
  productImage?: string
  basePrice: number
  onSubscribe?: (frequency: number) => void
  defaultFrequency?: number
}

const FREQUENCIES = [
  { value: 1, label: '1 month' },
  { value: 2, label: '2 months' },
  { value: 3, label: '3 months' },
  { value: 4, label: '4 months' },
  { value: 5, label: '5 months' },
  { value: 6, label: '6 months', recommended: true },
  { value: 7, label: '7 months' },
  { value: 8, label: '8 months' },
  { value: 9, label: '9 months' },
  { value: 10, label: '10 months' },
  { value: 11, label: '11 months' },
  { value: 12, label: '12 months' },
]

export default function SubscriptionToggle({
  productId,
  productName,
  productImage,
  basePrice,
  onSubscribe,
  defaultFrequency = 6
}: SubscriptionToggleProps) {
  const [isSubscription, setIsSubscription] = useState(false)
  const [frequency, setFrequency] = useState(defaultFrequency)

  const subscriptionDiscount = 0.05 // 5% Subscribe & Save discount
  const subscriptionPrice = basePrice * (1 - subscriptionDiscount)
  const savings = basePrice - subscriptionPrice

  const handlePurchaseTypeChange = (subscribe: boolean) => {
    setIsSubscription(subscribe)
    if (subscribe && onSubscribe) {
      onSubscribe(frequency)
    }
  }

  return (
    <div className="space-y-4">
      {/* Purchase Type Selection */}
      <div className="space-y-3">
        {/* One-Time Purchase */}
        <button
          type="button"
          onClick={() => handlePurchaseTypeChange(false)}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            !isSubscription
              ? 'border-brand-orange bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                !isSubscription ? 'border-brand-orange' : 'border-gray-300'
              }`}>
                {!isSubscription && (
                  <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">One-Time Purchase</p>
                <p className="text-sm text-gray-600">Buy once</p>
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">${basePrice.toFixed(2)}</p>
          </div>
        </button>

        {/* Subscribe & Save */}
        <button
          type="button"
          onClick={() => handlePurchaseTypeChange(true)}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            isSubscription
              ? 'border-brand-orange bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isSubscription ? 'border-brand-orange' : 'border-gray-300'
              }`}>
                {isSubscription && (
                  <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">Subscribe & Save</p>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                    Save 5%
                  </span>
                </div>
                <p className="text-sm text-gray-600">Automatic deliveries</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-brand-orange">
                ${subscriptionPrice.toFixed(2)}
              </p>
              <p className="text-xs text-green-600">Save ${savings.toFixed(2)}</p>
            </div>
          </div>

          {/* Frequency Selector */}
          {isSubscription && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Delivery Frequency
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => {
                  setFrequency(parseInt(e.target.value))
                  if (onSubscribe) {
                    onSubscribe(parseInt(e.target.value))
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>
                    Every {freq.label}
                    {freq.recommended ? ' (Recommended)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Choose how often you'd like this delivered. You can change or cancel anytime.
              </p>
            </div>
          )}
        </button>
      </div>

      {/* Benefits */}
      {isSubscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">Subscribe & Save Benefits:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Save 5% on every order</li>
                <li>✓ Never run out - automatic deliveries</li>
                <li>✓ Free shipping on subscription orders $50+</li>
                <li>✓ Modify, pause, or cancel anytime</li>
                <li>✓ Manage all subscriptions in your account</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

