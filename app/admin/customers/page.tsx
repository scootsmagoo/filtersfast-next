'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { hasAdminAccess } from '@/lib/auth-admin'
import Card from '@/components/ui/Card'
import { Users, Search, Filter, UserCheck, UserX, TrendingUp, Mail } from 'lucide-react'
import Link from 'next/link'

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  newThisMonth: number
  newThisWeek: number
  guestAccounts: number
  taxExemptCount: number
  affiliateCount: number
}

interface Customer {
  idCust: number
  status: string
  dateCreated: string
  name: string
  lastName: string
  email: string
  phone: string
  customerCompany?: string
  billingAddress?: string
  shippingAddressFormatted?: string
  orderCount: number
  affCount: number
  signinAttempts: number
  guestAccount: boolean
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchField, setSearchField] = useState('email')
  const [searchCondition, setSearchCondition] = useState('LIKE')
  const [searchPhrase, setSearchPhrase] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const customersPerPage = 50

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/customers')
    } else if (!isPending && session?.user && !hasAdminAccess(session.user)) {
      router.push('/')
    }
  }, [session, isPending, router])

  // Fetch customers and stats
  useEffect(() => {
    if (!session?.user || !hasAdminAccess(session.user)) return

    fetchCustomers()
    fetchStats()
  }, [session, searchPhrase, searchField, statusFilter, currentPage])

  async function fetchCustomers() {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: customersPerPage.toString(),
      })

      if (searchPhrase) {
        params.append('showField', searchField)
        params.append('showCondition', searchCondition)
        params.append('showPhrase', searchPhrase)
      }
      if (statusFilter) params.append('showStatus', statusFilter)

      const response = await fetch(`/api/admin/customers?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch customers')
      }
      
      const data = await response.json()
      setCustomers(data.customers || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching customers:', err)
      setError(err.message || 'Failed to load customers. Make sure to run: npm run init:customers')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/customers/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  function getStatusColor(status: string) {
    return status === 'A'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setCurrentPage(1)
    fetchCustomers()
  }

  function clearSearch() {
    setSearchPhrase('')
    setSearchField('email')
    setSearchCondition('LIKE')
    setStatusFilter('')
    setCurrentPage(1)
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <div className="text-red-500 dark:text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Customers
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6" role="alert" aria-live="assertive">{error}</p>
            <button
              onClick={() => fetchCustomers()}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900"
              aria-label="Retry loading customers"
            >
              Try Again
            </button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customer Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage customer accounts
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCustomers.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Active Customers
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.activeCustomers.toLocaleString()}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    New This Month
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.newThisMonth.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Guest Accounts
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.guestAccounts.toLocaleString()}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <form onSubmit={handleSearch} role="search" aria-label="Customer search form">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="searchField" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Field
                </label>
                <select
                  id="searchField"
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Select field to search by"
                >
                  <option value="idcust">Customer ID</option>
                  <option value="email">Email</option>
                  <option value="name">Name</option>
                  <option value="phone">Phone</option>
                  <option value="customerCompany">Company</option>
                  <option value="address">Address</option>
                </select>
              </div>

              <div>
                <label htmlFor="searchCondition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  id="searchCondition"
                  value={searchCondition}
                  onChange={(e) => setSearchCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Select search condition"
                >
                  <option value="EQUALS">Equals</option>
                  <option value="LIKE">Contains</option>
                </select>
              </div>

              <div>
                <label htmlFor="searchPhrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  id="searchPhrase"
                  type="text"
                  value={searchPhrase}
                  onChange={(e) => setSearchPhrase(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Enter search term"
                />
              </div>

              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Filter by customer status"
                >
                  <option value="">All</option>
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900"
                aria-label="Search customers"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                Search
              </button>
              <button
                type="button"
                onClick={clearSearch}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900"
                aria-label="Clear search filters"
              >
                Clear
              </button>
            </div>
          </form>
        </Card>

        {/* Customers Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto" role="region" aria-label="Customer list table">
            <table className="w-full" role="table" aria-label="Customers">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center" role="status" aria-live="polite">
                      <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">
                        <Users className="w-16 h-16 mx-auto opacity-50" aria-hidden="true" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        No customers found
                      </p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.idCust}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        #{customer.idCust}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.lastName}, {customer.name}
                        </div>
                        {customer.customerCompany && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {customer.customerCompany}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {customer.email}
                        </div>
                        {customer.guestAccount && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            Guest
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <Link
                          href={`/admin/orders?customer=${customer.idCust}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {customer.orderCount}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            customer.status
                          )}`}
                        >
                          {customer.status === 'A' ? 'Active' : 'Inactive'}
                        </span>
                        {customer.signinAttempts >= 5 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            Locked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(customer.dateCreated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/customers/${customer.idCust}`}
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900 rounded px-2 py-1"
                          aria-label={`View details for ${customer.name} ${customer.lastName}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {customers.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700" role="navigation" aria-label="Pagination">
              <div className="text-sm text-gray-700 dark:text-gray-300" role="status" aria-live="polite">
                Page {currentPage}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800"
                  aria-label="Go to previous page"
                  aria-disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={customers.length < customersPerPage}
                  className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800"
                  aria-label="Go to next page"
                  aria-disabled={customers.length < customersPerPage}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

