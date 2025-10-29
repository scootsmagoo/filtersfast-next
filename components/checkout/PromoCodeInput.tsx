'use client'

import { useState } from 'react'
import { Loader2, Tag, X, CheckCircle, AlertCircle } from 'lucide-react'
import { PromoCode, CartItem } from '@/lib/types/promo'

interface PromoCodeInputProps {
  cartTotal: number
  cartItems: CartItem[]
  customerId?: string
  isFirstTimeCustomer?: boolean
  onPromoApplied: (promoCode: PromoCode, discountAmount: number) => void
  onPromoRemoved: () => void
  appliedPromo?: PromoCode | null
}

export default function PromoCodeInput({
  cartTotal,
  cartItems,
  customerId,
  isFirstTimeCustomer,
  onPromoApplied,
  onPromoRemoved,
  appliedPromo
}: PromoCodeInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a promo code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout/validate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.trim(),
          cartTotal,
          cartItems,
          customerId,
          isFirstTimeCustomer
        })
      })

      const data = await response.json()

      if (data.valid) {
        onPromoApplied(data.promoCode, data.discountAmount)
        setCode('')
        setError(null)
      } else {
        setError(data.error || 'Invalid promo code')
      }
    } catch (err) {
      console.error('Error validating promo code:', err)
      setError('Failed to validate promo code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setCode('')
    setError(null)
    onPromoRemoved()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApply()
    }
  }

  // If promo is applied, show success state
  if (appliedPromo) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">
                Promo code applied: {appliedPromo.code}
              </p>
              <p className="text-sm text-green-700">{appliedPromo.description}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 hover:text-green-700 p-1"
            aria-label="Remove promo code"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700">
        Promo Code
      </label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="promo-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter code"
            className="input-field pl-10 w-full uppercase"
            disabled={loading}
            aria-describedby={error ? 'promo-error' : undefined}
          />
        </div>
        
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="btn-secondary min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            'Apply'
          )}
        </button>
      </div>

      {error && (
        <div 
          id="promo-error"
          className="flex items-start gap-2 text-sm text-red-600"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Have a promo code? Enter it above to see your discount.
      </p>
    </div>
  )
}


