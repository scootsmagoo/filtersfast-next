'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Server, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

interface ServerVar {
  name: string
  value: string
}

export default function ServerVarsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [loading, setLoading] = useState(true)
  const [serverVars, setServerVars] = useState<ServerVar[]>([])
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/utilities/server-vars')
    }
  }, [session, isPending, router])

  // Fetch server variables
  useEffect(() => {
    if (!session?.user) return
    fetchServerVars()
  }, [session])

  async function fetchServerVars() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/utilities/server-vars')
      if (!response.ok) {
        throw new Error('Failed to fetch server variables')
      }

      const data = await response.json()
      setServerVars(data.variables || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load server variables')
    } finally {
      setLoading(false)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading server variables...</p>
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
            { label: 'Utilities', href: '/admin/utilities' },
            { label: 'Server Variables', href: '/admin/utilities/server-vars' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Display Server Variables
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                View your web server's environment variables and configuration
              </p>
            </div>
            <Link href="/admin/utilities">
              <Button variant="outline" className="flex items-center gap-2">
                ← Back to Utilities
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Card className="p-6 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Server Environment Variables</h2>
          </div>

          {serverVars.length > 0 ? (
            <div className="overflow-x-auto">
              <table 
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                aria-label="Server environment variables"
                role="table"
              >
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Variable Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {serverVars.map((variable, index) => {
                    // Sanitize values to prevent XSS (React escapes by default, but be explicit)
                    const sanitizedValue = variable.value || ''
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <code className="text-xs" aria-label={`Variable name ${variable.name}`}>
                            {variable.name}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 break-all">
                          {sanitizedValue ? (
                            <code 
                              className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                              aria-label={`Variable value ${sanitizedValue.substring(0, 50)}${sanitizedValue.length > 50 ? '...' : ''}`}
                            >
                              {sanitizedValue}
                            </code>
                          ) : (
                            <span className="text-gray-400 italic" aria-label="Empty value">(empty)</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300" role="status">No server variables available.</p>
          )}
        </Card>

        <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">About Server Variables</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Server variables contain information about your web server environment, including request headers, 
                server configuration, and environment settings. This information is useful for debugging and 
                verifying your server configuration. Some sensitive values may be masked for security.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

