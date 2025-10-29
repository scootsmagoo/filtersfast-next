'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { PromoCode } from '@/lib/types/promo'
import { Calendar, DollarSign, Percent, Truck, Users, Hash } from 'lucide-react'

interface PromoCodeFormProps {
  initialData?: PromoCode
  mode: 'create' | 'edit'
}

export default function PromoCodeForm({ initialData, mode }: PromoCodeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    description: initialData?.description || '',
    discountType: initialData?.discountType || 'percentage',
    discountValue: initialData?.discountValue || 0,
    minOrderAmount: initialData?.minOrderAmount || '',
    maxDiscount: initialData?.maxDiscount || '',
    startDate: initialData?.startDate 
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split('T')[0]
      : '',
    usageLimit: initialData?.usageLimit || '',
    perCustomerLimit: initialData?.perCustomerLimit || 1,
    firstTimeOnly: initialData?.firstTimeOnly || false,
    active: initialData?.active !== undefined ? initialData.active : true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate
      if (!formData.code || !formData.description || !formData.endDate) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // For now, just show success (API endpoint exists but using mock data)
      if (mode === 'create') {
        alert(`Promo code "${formData.code}" created successfully! 
        
Note: This is using mock data. To persist to database, set USE_MOCK_DATA = false in the API route.`)
      } else {
        alert(`Promo code "${formData.code}" updated successfully!`)
      }

      router.push('/admin/promo-codes')
    } catch (err: any) {
      setError(err.message || 'Failed to save promo code')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promo Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="input-field uppercase"
              placeholder="SAVE20"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              Letters and numbers only, no spaces
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field"
              placeholder="20% off your entire order"
            />
          </div>
        </div>
      </Card>

      {/* Discount Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, discountType: 'percentage'})}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                  formData.discountType === 'percentage'
                    ? 'border-brand-orange bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Percent className="w-5 h-5 text-brand-orange" />
                <span className="font-medium">Percentage</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, discountType: 'fixed'})}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                  formData.discountType === 'fixed'
                    ? 'border-brand-orange bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5 text-brand-orange" />
                <span className="font-medium">Fixed Amount</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, discountType: 'free_shipping'})}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                  formData.discountType === 'free_shipping'
                    ? 'border-brand-orange bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Truck className="w-5 h-5 text-brand-orange" />
                <span className="font-medium">Free Shipping</span>
              </button>
            </div>
          </div>

          {formData.discountType !== 'free_shipping' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: parseFloat(e.target.value)})}
                    className="input-field"
                    placeholder={formData.discountType === 'percentage' ? '20' : '25.00'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formData.discountType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Discount (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                      className="input-field pl-8"
                      placeholder="100.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cap the maximum discount amount
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Order Amount (optional)
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                className="input-field pl-8"
                placeholder="50.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum cart total required to use this code
            </p>
          </div>
        </div>
      </Card>

      {/* Date Range */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Valid Date Range
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="input-field"
              min={formData.startDate}
            />
          </div>
        </div>
      </Card>

      {/* Usage Limits */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Usage Limits
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Usage Limit (optional)
            </label>
            <input
              type="number"
              min="0"
              value={formData.usageLimit}
              onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
              className="input-field"
              placeholder="1000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum total uses across all customers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per Customer Limit
            </label>
            <input
              type="number"
              min="1"
              value={formData.perCustomerLimit}
              onChange={(e) => setFormData({...formData, perCustomerLimit: parseInt(e.target.value)})}
              className="input-field"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              How many times each customer can use this code
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.firstTimeOnly}
              onChange={(e) => setFormData({...formData, firstTimeOnly: e.target.checked})}
              className="w-4 h-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
            />
            <span className="text-sm font-medium text-gray-700">
              First-time customers only
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Only customers with no previous completed orders can use this code
          </p>
        </div>
      </Card>

      {/* Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({...formData, active: e.target.checked})}
            className="w-4 h-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Active</span>
            <p className="text-xs text-gray-500">
              Inactive codes cannot be used even if within valid date range
            </p>
          </div>
        </label>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/promo-codes')}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="flex-1 md:flex-none"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Promo Code' : 'Update Promo Code'}
        </Button>
      </div>
    </form>
  )
}

