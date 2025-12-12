/**
 * Subscription Upsell Modal
 * Allows customers with active subscriptions to add items to upcoming orders
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import { X, Package } from 'lucide-react'

interface UpsellModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  nextOrderDate: string
  onAddToOrder: (asSubscription: boolean, frequency: number) => Promise<void>
}

export default function UpsellModal({
  isOpen,
  onClose,
  productId,
  productName,
  nextOrderDate,
  onAddToOrder
}: UpsellModalProps) {
  const [selectedOption, setSelectedOption] = useState<'subscription' | 'onetime'>('subscription')
  const [frequency, setFrequency] = useState(6)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Trap focus in modal (WCAG 2.1.2)
  useEffect(() => {
    if (!isOpen) return

    // Focus close button when modal opens
    setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 100)

    // Handle Escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isProcessing, onClose])

  if (!isOpen) return null

  const handleSubmit = async () => {
    setIsProcessing(true)
    try {
      await onAddToOrder(selectedOption === 'subscription', frequency)
      setShowSuccess(true)
      
      // Auto-close after showing success
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error adding item to subscription:', error)
      alert('Failed to add item to subscription')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-modal-title"
      aria-describedby="upsell-modal-description"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transition-colors"
      >
        {!showSuccess ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 
                id="upsell-modal-title"
                className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors"
              >
                Add this item to your upcoming order?
              </h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p 
                id="upsell-modal-description"
                className="text-sm text-gray-600 dark:text-gray-400 transition-colors"
              >
                Here's how to add products to your next upcoming order:
              </p>

              {/* Option 1: Add as subscription */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    id="subscription-option"
                    name="upsell-option"
                    checked={selectedOption === 'subscription'}
                    onChange={() => setSelectedOption('subscription')}
                    className="mt-1 w-4 h-4 text-brand-orange focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                    aria-describedby="subscription-option-description"
                  />
                  <label 
                    htmlFor="subscription-option"
                    className="flex-1 cursor-pointer"
                  >
                    <p 
                      id="subscription-option-description"
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 transition-colors"
                    >
                      Add item to your order on {nextOrderDate} and create a subscription
                    </p>
                    
                    {selectedOption === 'subscription' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors" id="frequency-label">
                          Receive this item every
                        </span>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(Number(e.target.value))}
                          className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
                          aria-labelledby="frequency-label"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                            <option key={m} value={m}>
                              {m} month{m > 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Option 2: Add one-time */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    id="onetime-option"
                    name="upsell-option"
                    checked={selectedOption === 'onetime'}
                    onChange={() => setSelectedOption('onetime')}
                    className="mt-1 w-4 h-4 text-brand-orange focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                    aria-describedby="onetime-option-description"
                  />
                  <label 
                    htmlFor="onetime-option"
                    className="flex-1 cursor-pointer"
                  >
                    <span 
                      id="onetime-option-description"
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      Add item one time only to your order on {nextOrderDate}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 transition-colors">
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex-1"
                aria-label={isProcessing ? 'Adding item to subscription' : 'Add item to subscription'}
              >
                {isProcessing ? (
                  <>
                    <div 
                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                      role="status"
                      aria-label="Loading"
                    ></div>
                    Adding...
                  </>
                ) : (
                  'Add Item'
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Cancel and close dialog"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          /* Success Message */
          <div className="p-8 text-center" role="status" aria-live="polite">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <svg 
                className="w-8 h-8 text-green-600 dark:text-green-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Success!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 transition-colors">
              Successfully updated your order.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

