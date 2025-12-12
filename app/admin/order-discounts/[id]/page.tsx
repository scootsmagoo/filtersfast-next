'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, Save, AlertCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { formatDateForInput, formatDateFromInput } from '@/lib/utils/order-discounts'

interface OrderDiscount {
  id: number
  disc_code: string
  disc_perc: number | null
  disc_amt: number | null
  disc_from_amt: number
  disc_to_amt: number
  disc_status: 'A' | 'I' | 'U'
  disc_once_only: 'Y' | 'N'
  disc_valid_from: string
  disc_valid_to: string
  created_at: number
  updated_at: number
}

export default function EditOrderDiscountPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, isPending } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discount, setDiscount] = useState<OrderDiscount | null>(null)
  const [formData, setFormData] = useState({
    disc_code: '',
    disc_perc: '',
    disc_amt: '',
    disc_from_amt: '',
    disc_to_amt: '',
    disc_status: 'A' as 'A' | 'I' | 'U',
    disc_once_only: 'N' as 'Y' | 'N',
    disc_valid_from: '',
    disc_valid_to: '',
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
      router.push(`/sign-in?redirect=/admin/order-discounts/${discountId}`)
    }
  }, [session, isPending, router, discountId])

  // Fetch discount data
  useEffect(() => {
    if (!session?.user || !discountId) return
    
    // Validate that discountId is a number, not "stats" or other reserved words
    const idNum = parseInt(discountId)
    if (isNaN(idNum) || discountId === 'stats' || discountId === 'new') {
      setError('Invalid discount ID')
      setLoading(false)
      return
    }
    
    fetchDiscount()
  }, [session, discountId])

  async function fetchDiscount() {
    try {
      setLoading(true)
      setError(null)
      
      // Validate ID is numeric
      const idNum = parseInt(discountId || '')
      
      if (isNaN(idNum) || idNum <= 0) {
        throw new Error('Invalid discount ID')
      }
      
      const fetchUrl = `/api/admin/order-discounts/${idNum}`
      const response = await fetch(fetchUrl)
      
      // Check content type to ensure we have JSON
      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        setError('Invalid response format from server')
        return
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(data.error || 'Order discount not found')
          return
        }
        throw new Error(data.error || 'Failed to fetch order discount')
      }
      
      if (!data || !data.discount) {
        setError(data.error || 'Invalid response from server')
        return
      }
      
      const disc = data.discount
      
      // Validate discount object has required fields
      if (!disc || typeof disc !== 'object') {
        setError('Invalid discount data received')
        return
      }
      
      setDiscount(disc)
      
      // Populate form with safe defaults
      setFormData({
        disc_code: disc.disc_code || '',
        disc_perc: disc.disc_perc !== null && disc.disc_perc !== undefined ? disc.disc_perc.toString() : '',
        disc_amt: disc.disc_amt !== null && disc.disc_amt !== undefined ? disc.disc_amt.toString() : '',
        disc_from_amt: disc.disc_from_amt ? disc.disc_from_amt.toString() : '',
        disc_to_amt: disc.disc_to_amt ? disc.disc_to_amt.toString() : '',
        disc_status: disc.disc_status || 'A',
        disc_once_only: disc.disc_once_only || 'N',
        disc_valid_from: disc.disc_valid_from || '',
        disc_valid_to: disc.disc_valid_to || '',
      })
    } catch (err: any) {
      console.error('Error fetching order discount:', err)
      setError(err.message || 'Failed to load order discount')
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
      if (!formData.disc_code || !formData.disc_from_amt || !formData.disc_to_amt || !formData.disc_valid_from || !formData.disc_valid_to) {
        throw new Error('Please fill in all required fields')
      }

      // Validate that either percentage or amount is provided
      if (!formData.disc_perc && !formData.disc_amt) {
        throw new Error('Either discount percentage or discount amount must be provided')
      }

      if (formData.disc_perc && formData.disc_amt) {
        throw new Error('Cannot provide both discount percentage and discount amount')
      }

      // Convert dates
      const validFrom = formatDateFromInput(formData.disc_valid_from)
      const validTo = formatDateFromInput(formData.disc_valid_to)

      const payload: any = {
        disc_code: formData.disc_code.toUpperCase().trim(),
        disc_perc: formData.disc_perc ? parseFloat(formData.disc_perc) : null,
        disc_amt: formData.disc_amt ? parseFloat(formData.disc_amt) : null,
        disc_from_amt: parseFloat(formData.disc_from_amt),
        disc_to_amt: parseFloat(formData.disc_to_amt),
        disc_status: formData.disc_status,
        disc_once_only: formData.disc_once_only,
        disc_valid_from: validFrom,
        disc_valid_to: validTo,
      }

      const idNum = parseInt(discountId || '')
      if (isNaN(idNum) || idNum <= 0) {
        throw new Error('Invalid discount ID')
      }
      
      const response = await fetch(`/api/admin/order-discounts/${idNum}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order discount')
      }

      router.push('/admin/order-discounts')
    } catch (err: any) {
      console.error('Error updating order discount:', err)
      setError(err.message || 'Failed to update order discount')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    // Use a more accessible confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this discount? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    setError(null)
    setDeleting(true)

    try {
      const idNum = parseInt(discountId || '')
      if (isNaN(idNum) || idNum <= 0) {
        throw new Error('Invalid discount ID')
      }
      
      const response = await fetch(`/api/admin/order-discounts/${idNum}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete order discount')
      }

      router.push('/admin/order-discounts')
    } catch (err: any) {
      console.error('Error deleting order discount:', err)
      setError(err.message || 'Failed to delete order discount')
      setDeleting(false)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading order discount...</p>
        </div>
      </div>
    )
  }

  if (!discount) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Order Discount Not Found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'The order discount you are looking for does not exist.'}</p>
              <Link href="/admin/order-discounts">
                <Button>Back to Order Discounts</Button>
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
            { label: 'Order Discounts', href: '/admin/order-discounts' },
            { label: discount.disc_code, href: `/admin/order-discounts/${discountId}` },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/order-discounts">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                Edit Order Discount
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors mt-1">
                Update discount code: <span className="font-mono font-semibold">{discount.disc_code}</span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              <p className="text-red-800 dark:text-red-200" id="error-message">{error}</p>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Edit order discount form" noValidate>
            {/* Discount Code */}
            <div>
              <label htmlFor="disc_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Discount Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="disc_code"
                required
                value={formData.disc_code}
                onChange={(e) => setFormData({ ...formData, disc_code: e.target.value.toUpperCase() })}
                placeholder="SAVE10"
                maxLength={20}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors font-mono"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                Unique code that customers will enter. No spaces, quotes, or special characters.
              </p>
            </div>

            {/* Order Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="disc_from_amt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Order Amount From <span className="text-red-500">*</span>
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
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Minimum order amount to qualify
                </p>
              </div>

              <div>
                <label htmlFor="disc_to_amt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Order Amount To <span className="text-red-500">*</span>
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
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Maximum order amount to qualify
                </p>
              </div>
            </div>

            {/* Discount Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="disc_perc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Discount Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="disc_perc"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.disc_perc}
                    onChange={(e) => {
                      setFormData({ ...formData, disc_perc: e.target.value, disc_amt: '' })
                    }}
                    placeholder="10.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Percentage of order total (0-100)
                </p>
              </div>

              <div>
                <label htmlFor="disc_amt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Discount Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="disc_amt"
                    step="0.01"
                    min="0"
                    value={formData.disc_amt}
                    onChange={(e) => {
                      setFormData({ ...formData, disc_amt: e.target.value, disc_perc: '' })
                    }}
                    placeholder="5.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Fixed dollar amount off
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> You must provide either a discount percentage OR a discount amount, but not both.
              </p>
            </div>

            {/* Status and Once Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="disc_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="disc_status"
                  required
                  value={formData.disc_status}
                  onChange={(e) => setFormData({ ...formData, disc_status: e.target.value as 'A' | 'I' | 'U' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                  <option value="U">Used</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Only Active discounts can be used
                </p>
              </div>

              <div>
                <label htmlFor="disc_once_only" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Use Once Only? <span className="text-red-500">*</span>
                </label>
                <select
                  id="disc_once_only"
                  required
                  value={formData.disc_once_only}
                  onChange={(e) => setFormData({ ...formData, disc_once_only: e.target.value as 'Y' | 'N' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <option value="N">No - Can be used multiple times</option>
                  <option value="Y">Yes - Can only be used once</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  If Yes, status will be set to Used after first use
                </p>
              </div>
            </div>

            {/* Valid Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="disc_valid_from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Valid From Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="disc_valid_from"
                  required
                  value={formData.disc_valid_from ? formatDateForInput(formData.disc_valid_from) : ''}
                  onChange={(e) => setFormData({ ...formData, disc_valid_from: formatDateFromInput(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Date when discount becomes valid
                </p>
              </div>

              <div>
                <label htmlFor="disc_valid_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Valid To Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="disc_valid_to"
                  required
                  value={formData.disc_valid_to ? formatDateForInput(formData.disc_valid_to) : ''}
                  onChange={(e) => setFormData({ ...formData, disc_valid_to: formatDateFromInput(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Date when discount expires
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                aria-label="Delete this discount"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                {deleting ? 'Deleting...' : 'Delete Discount'}
                {deleting && <span className="sr-only">Deleting discount, please wait</span>}
              </Button>

              <div className="flex items-center gap-4">
                <Link href="/admin/order-discounts">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="flex items-center gap-2" aria-describedby={error ? "error-message" : undefined}>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  {saving ? 'Saving...' : 'Update Discount'}
                  {saving && <span className="sr-only">Saving changes, please wait</span>}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

