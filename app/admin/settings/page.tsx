'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Settings, Save, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

interface SystemConfig {
  modId: number
  titles: number
  insurance: number
  shipping: number
  discount: number
  related: number
  featuredcart: number
  featwording: string
  productshipping: number
  callLongWait: number
  chatActive: number
  phoneNumActive: number
  txtChatEnabled: number
  updated_at: number
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<SystemConfig>>({})

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/settings')
    }
  }, [session, isPending, router])

  // Fetch config
  useEffect(() => {
    if (!session?.user) return
    fetchConfig()
  }, [session])

  async function fetchConfig() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch system configuration')
      }

      const data = await response.json()
      setConfig(data.config)
      setFormData(data.config || {})
    } catch (err: any) {
      setError(err.message || 'Failed to load system configuration')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update system configuration')
      }

      const data = await response.json()
      setConfig(data.config)
      setFormData(data.config)
      setSuccess('Settings updated successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  function handleChange(field: keyof SystemConfig, value: number | string) {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Configuration Not Found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Settings could not be loaded.</p>
              <Button onClick={fetchConfig}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Settings', href: '/admin/settings' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage system modules and feature toggles
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                ← Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div 
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-label="System settings configuration form">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" aria-hidden="true" />
              Module Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Titles */}
              <div>
                <label htmlFor="titles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dynamic Titles
                </label>
                <select
                  id="titles"
                  name="titles"
                  value={formData.titles ?? config.titles}
                  onChange={(e) => handleChange('titles', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="titles-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="titles-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Change page titles dynamically. Requires _INCtitle_.asp in usermods folder.
                </p>
              </div>

              {/* Insurance */}
              <div>
                <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Insurance
                </label>
                <select
                  id="insurance"
                  name="insurance"
                  value={formData.insurance ?? config.insurance}
                  onChange={(e) => handleChange('insurance', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="insurance-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="insurance-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Allow customers to add insurance to their orders.
                </p>
              </div>

              {/* Shipping Mod */}
              <div>
                <label htmlFor="shipping" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shipping Mod
                </label>
                <select
                  id="shipping"
                  name="shipping"
                  value={formData.shipping ?? config.shipping}
                  onChange={(e) => handleChange('shipping', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="shipping-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="shipping-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Allow customers to check shipping prices before checkout.
                </p>
              </div>

              {/* Show Discount Pricing */}
              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Show Discount Pricing
                </label>
                <select
                  id="discount"
                  name="discount"
                  value={formData.discount ?? config.discount}
                  onChange={(e) => handleChange('discount', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="discount-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="discount-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Show quantity break discounts on product listing pages.
                </p>
              </div>

              {/* Show Related Products */}
              <div>
                <label htmlFor="related" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Show Related Products
                </label>
                <select
                  id="related"
                  name="related"
                  value={formData.related ?? config.related}
                  onChange={(e) => handleChange('related', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="related-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="related-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Display up to 3 related items on product view pages.
                </p>
              </div>

              {/* Show Why Not Try */}
              <div>
                <label htmlFor="featuredcart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Show "Why Not Try"
                </label>
                <select
                  id="featuredcart"
                  name="featuredcart"
                  value={formData.featuredcart ?? config.featuredcart}
                  onChange={(e) => handleChange('featuredcart', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="featuredcart-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="featuredcart-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Show featured products on cart page to encourage additional purchases.
                </p>
              </div>

              {/* Show Shipping in Prodview */}
              <div>
                <label htmlFor="productshipping" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Show Shipping in Product View
                </label>
                <select
                  id="productshipping"
                  name="productshipping"
                  value={formData.productshipping ?? config.productshipping}
                  onChange={(e) => handleChange('productshipping', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="productshipping-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="productshipping-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Display shipping costs on product pages. Warning: May slow page load with real-time rates.
                </p>
              </div>

              {/* Long Call Wait Times */}
              <div>
                <label htmlFor="callLongWait" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long Call Wait Times
                </label>
                <select
                  id="callLongWait"
                  name="callLongWait"
                  value={formData.callLongWait ?? config.callLongWait}
                  onChange={(e) => handleChange('callLongWait', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="callLongWait-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                  <option value={2}>Down</option>
                </select>
                <p id="callLongWait-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Display message about long call wait times.
                </p>
              </div>

              {/* Chat Activated */}
              <div>
                <label htmlFor="chatActive" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chat Activated
                </label>
                <select
                  id="chatActive"
                  name="chatActive"
                  value={formData.chatActive ?? config.chatActive}
                  onChange={(e) => handleChange('chatActive', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="chatActive-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="chatActive-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enable chat functionality on the site.
                </p>
              </div>

              {/* Text Chat Enabled */}
              <div>
                <label htmlFor="txtChatEnabled" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Chat Enabled
                </label>
                <select
                  id="txtChatEnabled"
                  name="txtChatEnabled"
                  value={formData.txtChatEnabled ?? config.txtChatEnabled}
                  onChange={(e) => handleChange('txtChatEnabled', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="txtChatEnabled-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="txtChatEnabled-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enable text-based chat support.
                </p>
              </div>

              {/* Phone Number Enabled */}
              <div>
                <label htmlFor="phoneNumActive" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number Enabled
                </label>
                <select
                  id="phoneNumActive"
                  name="phoneNumActive"
                  value={formData.phoneNumActive ?? config.phoneNumActive}
                  onChange={(e) => handleChange('phoneNumActive', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  aria-describedby="phoneNumActive-description"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
                <p id="phoneNumActive-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Display phone number for customer support.
                </p>
              </div>
            </div>

            {/* Featured Cart Wording */}
            {(formData.featuredcart ?? config.featuredcart) === 1 && (
              <div className="mt-6">
                <label htmlFor="featwording" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  "Why Not Try" Wording
                </label>
                <input
                  id="featwording"
                  name="featwording"
                  type="text"
                  value={formData.featwording ?? config.featwording ?? ''}
                  onChange={(e) => handleChange('featwording', e.target.value)}
                  placeholder="Enter custom wording for featured cart section..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  maxLength={255}
                  aria-describedby="featwording-description"
                />
                <p id="featwording-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Custom text to display above featured products on cart page.
                </p>
              </div>
            )}
          </Card>

          {/* Help Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" aria-hidden="true" />
              Help and Instructions
            </h2>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <p className="font-semibold mb-1">Mods</p>
                <p>Use this control panel to turn on and off the modules that you would like to use.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Dynamic Titles</p>
                <p>This mod will change your title for most of your dynamically created pages. If you use this mod you must also edit the _INCtitle_.asp page located in the usermods folder. If you are not using this mod you will have to edit the _INCtop_.asp and enter your static title.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Add Insurance</p>
                <p>This mod will allow your users to add insurance to their orders.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Shipping Mod</p>
                <p>This mod will allow your users to check the shipping price of their orders before completing the checkout process.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Show Discount Pricing</p>
                <p>This mod will show your users the quantity breaks they can receive right from the product listing page.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Show Related Products</p>
                <p>This mod will show your users up to 3 related items for each product on the product view page.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Show "Why Not Try"</p>
                <p>This mod is a last ditch effort to get your customers to buy something else from you on the cart page.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Show Shipping in Product View</p>
                <p>This mod shows the shipping costs in the product view page. Warning: If you use real-time rates, every time someone looks at a product it will query the UPS or USPS server which could make your pages load slower.</p>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link href="/admin">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving} 
              className="flex items-center gap-2"
              aria-label={saving ? 'Saving settings' : 'Update settings'}
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              {saving ? 'Saving...' : 'Update Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

