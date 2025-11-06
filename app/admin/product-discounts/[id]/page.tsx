'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, Save, AlertCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { formatDateForInput, formatDateFromInput } from '@/lib/utils/product-discounts'

interface ProductDiscount {
  id: number
  disc_code: string
  disc_type: 'percentage' | 'amount'
  disc_perc: number | null
  disc_amt: number | null
  target_type: 'global' | 'product' | 'category' | 'product_type'
  target_id: number | null
  target_product_type: string | null
  disc_from_amt: number
  disc_to_amt: number
  disc_status: 'A' | 'I'
  disc_valid_from: string
  disc_valid_to: string
  disc_free_shipping: boolean
  disc_multi_by_qty: boolean
  disc_once_only: boolean
  disc_compoundable: boolean
  disc_allow_on_forms: boolean
  disc_notes: string | null
  created_at: number
  updated_at: number
}

export default function EditProductDiscountPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, isPending } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [discount, setDiscount] = useState<ProductDiscount | null>(null)
  const [formData, setFormData] = useState({
    disc_code: '',
    disc_type: 'percentage' as 'percentage' | 'amount',
    disc_perc: '',
    disc_amt: '',
    target_type: 'global' as 'global' | 'product' | 'category' | 'product_type',
    target_id: '',
    target_product_type: '',
    disc_from_amt: '0.00',
    disc_to_amt: '9999.99',
    disc_status: 'A' as 'A' | 'I',
    disc_valid_from: '',
    disc_valid_to: '',
    disc_free_shipping: false,
    disc_multi_by_qty: false,
    disc_once_only: false,
    disc_compoundable: false,
    disc_allow_on_forms: true,
    disc_notes: '',
  })

  // Handle params - Next.js 15+ uses Promise
  const [discountId, setDiscountId] = useState<string | null>(null)

  useEffect(() => {
    async function resolveParams() {
      const resolved = params instanceof Promise ? await params : params
      const id = resolved.id as string
      setDiscountId(id)
    }
    resolveParams()
  }, [params])

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user && discountId) {
      router.push(`/sign-in?redirect=/admin/product-discounts/${discountId}`)
    }
  }, [session, isPending, router, discountId])

  // Fetch discount data
  useEffect(() => {
    if (!session?.user || !discountId) return

    const idNum = parseInt(discountId)
    if (isNaN(idNum) || discountId === 'new') {
      setError('Invalid discount ID')
      setLoading(false)
      return
    }

    fetchDiscount()
  }, [session, discountId])

  // Handle escape key to close dialog
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && deleteConfirmOpen) {
        setDeleteConfirmOpen(false)
      }
    }
    if (deleteConfirmOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [deleteConfirmOpen])

  async function fetchDiscount() {
    try {
      setLoading(true)
      setError(null)

      const idNum = parseInt(discountId || '')
      if (isNaN(idNum) || idNum <= 0) {
        throw new Error('Invalid discount ID')
      }

      const response = await fetch(`/api/admin/product-discounts/${idNum}`)
      const contentType = response.headers.get('content-type')

      if (!contentType || !contentType.includes('application/json')) {
        setError('Invalid response format from server')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError(data.error || 'Product discount not found')
          return
        }
        throw new Error(data.error || 'Failed to fetch product discount')
      }

      if (!data || !data.discount) {
        setError(data.error || 'Invalid response from server')
        return
      }

      const disc = data.discount
      setDiscount(disc)

      // Populate form
      setFormData({
        disc_code: disc.disc_code || '',
        disc_type: disc.disc_type || 'percentage',
        disc_perc: disc.disc_perc !== null && disc.disc_perc !== undefined ? disc.disc_perc.toString() : '',
        disc_amt: disc.disc_amt !== null && disc.disc_amt !== undefined ? disc.disc_amt.toString() : '',
        target_type: disc.target_type || 'global',
        target_id: disc.target_id ? disc.target_id.toString() : '',
        target_product_type: disc.target_product_type || '',
        disc_from_amt: disc.disc_from_amt ? disc.disc_from_amt.toString() : '0.00',
        disc_to_amt: disc.disc_to_amt ? disc.disc_to_amt.toString() : '9999.99',
        disc_status: disc.disc_status || 'A',
        disc_valid_from: disc.disc_valid_from ? formatDateForInput(disc.disc_valid_from) : '',
        disc_valid_to: disc.disc_valid_to ? formatDateForInput(disc.disc_valid_to) : '',
        disc_free_shipping: disc.disc_free_shipping || false,
        disc_multi_by_qty: disc.disc_multi_by_qty || false,
        disc_once_only: disc.disc_once_only || false,
        disc_compoundable: disc.disc_compoundable || false,
        disc_allow_on_forms: disc.disc_allow_on_forms !== false,
        disc_notes: disc.disc_notes || '',
      })
    } catch (err: any) {
      console.error('Error fetching product discount:', err)
      setError(err.message || 'Failed to load product discount')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      // Validate required fields
      if (
        !formData.disc_code ||
        !formData.disc_from_amt ||
        !formData.disc_to_amt ||
        !formData.disc_valid_from ||
        !formData.disc_valid_to
      ) {
        throw new Error('Please fill in all required fields')
      }

      // Validate discount type
      if (formData.disc_type === 'percentage') {
        if (!formData.disc_perc || parseFloat(formData.disc_perc) < 0 || parseFloat(formData.disc_perc) > 100) {
          throw new Error('Percentage must be between 0 and 100')
        }
      } else {
        if (!formData.disc_amt || parseFloat(formData.disc_amt) < 0) {
          throw new Error('Amount must be greater than 0')
        }
      }

      // Validate target
      if (formData.target_type === 'product' || formData.target_type === 'category') {
        if (!formData.target_id || parseInt(formData.target_id) <= 0) {
          throw new Error('Target ID is required for product/category discounts')
        }
      }
      if (formData.target_type === 'product_type') {
        if (!formData.target_product_type) {
          throw new Error('Product type is required for product_type discounts')
        }
      }

      // Convert dates
      const validFrom = formatDateFromInput(formData.disc_valid_from)
      const validTo = formatDateFromInput(formData.disc_valid_to)

      const payload: any = {
        disc_code: formData.disc_code.toUpperCase().trim(),
        disc_type: formData.disc_type,
        disc_perc: formData.disc_type === 'percentage' ? parseFloat(formData.disc_perc) : null,
        disc_amt: formData.disc_type === 'amount' ? parseFloat(formData.disc_amt) : null,
        target_type: formData.target_type,
        target_id: formData.target_id ? parseInt(formData.target_id) : null,
        target_product_type: formData.target_product_type || null,
        disc_from_amt: parseFloat(formData.disc_from_amt),
        disc_to_amt: parseFloat(formData.disc_to_amt),
        disc_status: formData.disc_status,
        disc_valid_from: validFrom,
        disc_valid_to: validTo,
        disc_free_shipping: formData.disc_free_shipping,
        disc_multi_by_qty: formData.disc_multi_by_qty,
        disc_once_only: formData.disc_once_only,
        disc_compoundable: formData.disc_compoundable,
        disc_allow_on_forms: formData.disc_allow_on_forms,
        disc_notes: formData.disc_notes || null,
      }

      const idNum = parseInt(discountId || '')
      if (isNaN(idNum) || idNum <= 0) {
        throw new Error('Invalid discount ID')
      }

      const response = await fetch(`/api/admin/product-discounts/${idNum}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product discount')
      }

      router.push('/admin/product-discounts')
    } catch (err: any) {
      console.error('Error updating product discount:', err)
      setError(err.message || 'Failed to update product discount')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClick() {
    setDeleteConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    try {
      const idNum = parseInt(discountId || '')
      if (isNaN(idNum) || idNum <= 0) {
        throw new Error('Invalid discount ID')
      }

      const response = await fetch(`/api/admin/product-discounts/${idNum}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product discount')
      }

      router.push('/admin/product-discounts')
    } catch (err: any) {
      console.error('Error deleting product discount:', err)
      setError(err.message || 'Failed to delete product discount')
      setDeleteConfirmOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">
            Loading product discount...
          </p>
        </div>
      </div>
    )
  }

  if (error && !discount) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminBreadcrumb
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Product Discounts', href: '/admin/product-discounts' },
              { label: 'Edit Discount', href: `/admin/product-discounts/${discountId}` },
            ]}
          />
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" role="alert" aria-live="assertive">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
            <div className="mt-4">
              <Link href="/admin/product-discounts">
                <Button variant="outline">Back to Product Discounts</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Product Discounts', href: '/admin/product-discounts' },
            { label: discount?.disc_code || 'Edit Discount', href: `/admin/product-discounts/${discountId}` },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/product-discounts">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                Edit Product Discount
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors mt-1">
                {discount?.disc_code || 'Loading...'}
              </p>
            </div>
            {discount && (
              <Button
                onClick={handleDeleteClick}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                aria-label={`Delete discount ${discount.disc_code}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card
            className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              <p className="text-red-800 dark:text-red-200" id="error-message">
                {error}
              </p>
            </div>
          </Card>
        )}

        {discount && (
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6" aria-label="Edit product discount form" noValidate>
              {/* Discount Code */}
              <div>
                <label
                  htmlFor="disc_code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                >
                  Discount Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="disc_code"
                  required
                  value={formData.disc_code}
                  onChange={(e) => setFormData({ ...formData, disc_code: e.target.value.toUpperCase() })}
                  placeholder="PROD10"
                  maxLength={20}
                  aria-required="true"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors font-mono focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                />
              </div>

              {/* Target Type */}
              <div>
                <label
                  htmlFor="target_type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                >
                  Target Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="target_type"
                  required
                  value={formData.target_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_type: e.target.value as 'global' | 'product' | 'category' | 'product_type',
                      target_id: '',
                      target_product_type: '',
                    })
                  }
                  aria-required="true"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                >
                  <option value="global">Global (All Products)</option>
                  <option value="product">Specific Product</option>
                  <option value="category">Specific Category</option>
                  <option value="product_type">Product Type</option>
                </select>
              </div>

              {/* Target ID */}
              {(formData.target_type === 'product' || formData.target_type === 'category') && (
                <div>
                  <label
                    htmlFor="target_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    {formData.target_type === 'product' ? 'Product ID' : 'Category ID'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="target_id"
                    required
                    min="1"
                    value={formData.target_id}
                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                    placeholder={formData.target_type === 'product' ? '123' : '5'}
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                </div>
              )}

              {/* Product Type */}
              {formData.target_type === 'product_type' && (
                <div>
                  <label
                    htmlFor="target_product_type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="target_product_type"
                    required
                    value={formData.target_product_type}
                    onChange={(e) => setFormData({ ...formData, target_product_type: e.target.value })}
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  >
                    <option value="">Select Product Type</option>
                    <option value="fridge">Refrigerator Filters</option>
                    <option value="water">Water Filters</option>
                    <option value="air">Air Filters</option>
                    <option value="humidifier">Humidifier Filters</option>
                    <option value="pool">Pool Filters</option>
                  </select>
                </div>
              )}

              {/* Discount Type */}
              <div>
                <label
                  htmlFor="disc_type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                >
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="disc_type"
                  required
                  value={formData.disc_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      disc_type: e.target.value as 'percentage' | 'amount',
                      disc_perc: '',
                      disc_amt: '',
                    })
                  }
                  aria-required="true"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                >
                  <option value="percentage">Percentage</option>
                  <option value="amount">Dollar Amount</option>
                </select>
              </div>

              {/* Discount Value */}
              {formData.disc_type === 'percentage' ? (
                <div>
                  <label
                    htmlFor="disc_perc"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    Discount Percentage <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="disc_perc"
                      required
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.disc_perc}
                      onChange={(e) => setFormData({ ...formData, disc_perc: e.target.value })}
                      placeholder="10.00"
                      aria-required="true"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="disc_amt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    Discount Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="disc_amt"
                      required
                      step="0.01"
                      min="0"
                      value={formData.disc_amt}
                      onChange={(e) => setFormData({ ...formData, disc_amt: e.target.value })}
                      placeholder="5.00"
                      aria-required="true"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Cart Amount Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="disc_from_amt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    Minimum Cart Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="disc_from_amt"
                      required
                      step="0.01"
                      min="0"
                      value={formData.disc_from_amt}
                      onChange={(e) => setFormData({ ...formData, disc_from_amt: e.target.value })}
                      placeholder="0.00"
                      aria-required="true"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="disc_to_amt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    Maximum Cart Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="disc_to_amt"
                      required
                      step="0.01"
                      min="0"
                      value={formData.disc_to_amt}
                      onChange={(e) => setFormData({ ...formData, disc_to_amt: e.target.value })}
                      placeholder="9999.99"
                      aria-required="true"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="disc_status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="disc_status"
                  required
                  value={formData.disc_status}
                  onChange={(e) => setFormData({ ...formData, disc_status: e.target.value as 'A' | 'I' })}
                  aria-required="true"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                >
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                </select>
              </div>

              {/* Valid Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="disc_valid_from"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    Valid From Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="disc_valid_from"
                    required
                    value={formData.disc_valid_from}
                    onChange={(e) => setFormData({ ...formData, disc_valid_from: e.target.value })}
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="disc_valid_to"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                  >
                    Valid To Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="disc_valid_to"
                    required
                    value={formData.disc_valid_to}
                    onChange={(e) => setFormData({ ...formData, disc_valid_to: e.target.value })}
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Options</h3>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disc_free_shipping}
                    onChange={(e) => setFormData({ ...formData, disc_free_shipping: e.target.checked })}
                    className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">Free Shipping</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disc_multi_by_qty}
                    onChange={(e) => setFormData({ ...formData, disc_multi_by_qty: e.target.checked })}
                    className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                    Multiply Discount by Quantity
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disc_once_only}
                    onChange={(e) => setFormData({ ...formData, disc_once_only: e.target.checked })}
                    className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                    Once Per Customer Only
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disc_compoundable}
                    onChange={(e) => setFormData({ ...formData, disc_compoundable: e.target.checked })}
                    className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                    Compoundable (can stack with other discounts)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.disc_allow_on_forms}
                    onChange={(e) => setFormData({ ...formData, disc_allow_on_forms: e.target.checked })}
                    className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                    Allow on Promo Code Form
                  </span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="disc_notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors"
                >
                  Internal Notes
                </label>
                <textarea
                  id="disc_notes"
                  rows={3}
                  value={formData.disc_notes}
                  onChange={(e) => setFormData({ ...formData, disc_notes: e.target.value })}
                  placeholder="Internal notes about this discount..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/admin/product-discounts">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2"
                  aria-describedby={error ? 'error-message' : undefined}
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  {saving ? 'Saving...' : 'Save Changes'}
                  {saving && <span className="sr-only">Saving discount, please wait</span>}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmOpen && discount && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setDeleteConfirmOpen(false)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDeleteConfirmOpen(false)
              }
            }}
          >
            <Card className="max-w-md w-full mx-4 p-6" tabIndex={-1}>
              <h2 id="delete-dialog-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Confirm Deletion
              </h2>
              <p id="delete-dialog-description" className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete discount &quot;{discount.disc_code}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                  aria-label="Cancel deletion"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  aria-label="Confirm deletion"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

