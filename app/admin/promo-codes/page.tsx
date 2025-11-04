'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Tag,
  TrendingUp,
  Calendar,
  Users,
  ArrowLeft,
  Lock
} from 'lucide-react'
import Link from 'next/link'

// Use mock data for now
import { MOCK_PROMO_CODES } from '@/lib/db/promo-codes-mock'

export default function PromoCodesAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [promoCodes, setPromoCodes] = useState(MOCK_PROMO_CODES)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/promo-codes')
    } else if (!isPending && session?.user && !hasAdminAccess(session.user)) {
      router.push('/')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!session?.user || !hasAdminAccess(session.user)) {
    return null
  }

  // Filter promo codes
  const filteredCodes = promoCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (filter === 'active') {
      return code.active && new Date() <= code.endDate
    } else if (filter === 'expired') {
      return new Date() > code.endDate
    }
    
    return true
  })

  const getDiscountDisplay = (code: typeof promoCodes[0]) => {
    if (code.discountType === 'percentage') {
      return `${code.discountValue}% off`
    } else if (code.discountType === 'fixed') {
      return `$${code.discountValue} off`
    } else {
      return 'Free Shipping'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-brand-blue dark:text-blue-400 hover:underline mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Promo Codes</h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">Manage discount codes and promotions</p>
            </div>
            
            <Link href="/admin/promo-codes/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Promo Code
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Codes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{promoCodes.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Active Codes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {promoCodes.filter(c => c.active && new Date() <= c.endDate).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Users className="w-5 h-5 text-brand-orange transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Total Uses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {promoCodes.reduce((sum, c) => sum + c.usageCount, 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {promoCodes.filter(c => {
                    const daysUntilExpiry = Math.ceil((c.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
                  }).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'expired'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Expired
              </button>
            </div>
          </div>
        </Card>

        {/* Promo Codes Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {filteredCodes.map((code) => {
                  const isExpired = new Date() > code.endDate
                  const isActive = code.active && !isExpired

                  return (
                    <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors" />
                          <span className="font-mono font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                            {code.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">{code.description}</div>
                        {code.minOrderAmount && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                            Min order: ${code.minOrderAmount}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                          {getDiscountDisplay(code)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
                          {code.usageCount}
                          {code.usageLimit && ` / ${code.usageLimit}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : isExpired
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/promo-codes/${code.id}/edit`}
                            className="text-brand-blue dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 transition-colors"
                            title="Delete"
                            onClick={() => {
                              if (confirm(`Delete promo code ${code.code}?`)) {
                                // TODO: Implement delete
                                alert('Delete functionality coming soon!')
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredCodes.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors" />
              <p className="text-gray-600 dark:text-gray-300 transition-colors">No promo codes found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

