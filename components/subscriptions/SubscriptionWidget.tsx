/**
 * Subscription Widget for Product Pages
 * "Subscribe & Save" option with frequency selector
 */

'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'

interface SubscriptionWidgetProps {
  productId: string
  productName: string
  productPrice: number
  isPrivateLabel?: boolean
  defaultFrequency?: number
  onSubscriptionChange?: (enabled: boolean, frequency: number) => void
  style?: 'pdp' | 'cart' | 'compact'
}

export default function SubscriptionWidget({
  productId,
  productName,
  productPrice,
  isPrivateLabel = false,
  defaultFrequency = 6,
  onSubscriptionChange,
  style = 'pdp'
}: SubscriptionWidgetProps) {
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false)
  const [frequency, setFrequency] = useState(defaultFrequency)
  const [showDetails, setShowDetails] = useState(false)

  // Calculate discount percentage
  const discountPercentage = isPrivateLabel ? 10 : 5
  const discountAmount = productPrice * (discountPercentage / 100)
  const subscriptionPrice = productPrice - discountAmount

  // Notify parent component of changes
  useEffect(() => {
    if (onSubscriptionChange) {
      onSubscriptionChange(subscriptionEnabled, frequency)
    }
  }, [subscriptionEnabled, frequency, onSubscriptionChange])

  const frequencies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  if (style === 'compact') {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id={`subscription-${productId}`}
            checked={subscriptionEnabled}
            onChange={(e) => setSubscriptionEnabled(e.target.checked)}
            className="w-5 h-5 text-brand-orange focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 border-gray-300 rounded"
            aria-describedby={`subscription-${productId}-description`}
          />
          <label 
            htmlFor={`subscription-${productId}`}
            className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-gray-100 font-medium transition-colors"
          >
            <span>Subscribe & Save {discountPercentage}%</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
              (${subscriptionPrice.toFixed(2)})
            </span>
          </label>
          <span id={`subscription-${productId}-description`} className="sr-only">
            Get {discountPercentage}% off and free shipping when you subscribe to this product
          </span>
        </div>
        
        {subscriptionEnabled && (
          <div className="ml-8 flex items-center gap-2">
            <label htmlFor={`subscription-frequency-${productId}`} className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
              Deliver every:
            </label>
            <select
              id={`subscription-frequency-${productId}`}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
              aria-label="Select subscription delivery frequency"
            >
              {frequencies.map(f => (
                <option key={f} value={f}>
                  {f} month{f > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border-2 border-brand-orange rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-orange to-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Subscribe & Save</h3>
            <p className="text-sm opacity-90">Save {discountPercentage}% + FREE Shipping</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${subscriptionPrice.toFixed(2)}
            </div>
            <div className="text-sm line-through opacity-75">
              ${productPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* One-time vs Subscription Toggle */}
        {style === 'pdp' && (
          <div className="flex gap-3 mb-4" role="group" aria-label="Purchase type selection">
            <button
              type="button"
              onClick={() => setSubscriptionEnabled(false)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue ${
                !subscriptionEnabled
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              aria-pressed={!subscriptionEnabled}
              aria-label="Select one-time delivery"
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setSubscriptionEnabled(true)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange ${
                subscriptionEnabled
                  ? 'border-brand-orange bg-brand-orange text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              aria-pressed={subscriptionEnabled}
              aria-label="Select subscription delivery"
            >
              Subscribe
            </button>
          </div>
        )}

        {/* Subscription Checkbox (for cart style) */}
        {style === 'cart' && (
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id={`subscription-${productId}`}
              checked={subscriptionEnabled}
              onChange={(e) => setSubscriptionEnabled(e.target.checked)}
              className="w-5 h-5 text-brand-orange focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 border-gray-300 rounded"
              aria-describedby={`subscription-${productId}-benefit`}
            />
            <label 
              htmlFor={`subscription-${productId}`}
              className="cursor-pointer text-gray-900 dark:text-gray-100 font-medium transition-colors"
            >
              Subscribe & Save {discountPercentage}%
            </label>
            <span id={`subscription-${productId}-benefit`} className="sr-only">
              Get {discountPercentage}% discount and free shipping
            </span>
          </div>
        )}

        {/* Frequency Selector */}
        {subscriptionEnabled && (
          <div className="mb-4">
            <label htmlFor={`frequency-${productId}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              Delivery Frequency
            </label>
            <select
              id={`frequency-${productId}`}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
              aria-label="Select how often you want to receive this product"
              aria-required="true"
            >
              {frequencies.map(f => (
                <option key={f} value={f}>
                  Every {f} month{f > 1 ? 's' : ''} {f === 6 ? '(Recommended)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Benefits */}
        {subscriptionEnabled && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save {discountPercentage}% on every order</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>FREE shipping on all deliveries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Modify, pause, or cancel anytime</span>
            </div>
          </div>
        )}

        {/* More Info Button */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-brand-blue hover:underline focus:outline-none focus:ring-2 focus:ring-brand-blue rounded transition-colors"
          aria-expanded={showDetails}
          aria-controls={`subscription-details-${productId}`}
          aria-label="Toggle subscription program details"
        >
          <Info className="w-4 h-4" aria-hidden="true" />
          <span>How Subscribe & Save works</span>
        </button>
      </div>

      {/* Details Modal/Expansion */}
      {showDetails && (
        <div 
          id={`subscription-details-${productId}`}
          className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50 transition-colors"
          role="region"
          aria-label="Subscription program details"
        >
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            Save on ALL orders! Enjoy the convenience of not having to reorder
          </h4>
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 transition-colors">Here's how it works:</h5>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 transition-colors" role="list">
            <li role="listitem">• Get up to 20% off today and 10% off on all future orders</li>
            <li role="listitem">• Enjoy FREE SHIPPING on every order</li>
            <li role="listitem">• Select a delivery schedule that works for you</li>
            <li role="listitem">• Modify or Cancel your order anytime</li>
            <li role="listitem">• Pay as you go - only when orders ship</li>
          </ul>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 transition-colors">
            *Recommended frequency based on manufacturer guidelines. 
            There's never an obligation to continue and you can cancel or modify your order at any time 
            on the My Auto Delivery page or by calling <a href="tel:1-866-438-3458" className="underline hover:text-gray-900 dark:hover:text-gray-200">1-866-438-3458</a>. 
            You will only be charged when your orders are placed.
          </p>
        </div>
      )}
    </div>
  )
}

