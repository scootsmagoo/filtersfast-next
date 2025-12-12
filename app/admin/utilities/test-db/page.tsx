'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Database, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

export default function TestDatabasePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/utilities/test-db')
    }
  }, [session, isPending, router])

  async function runTest() {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/utilities/test-db', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Database test passed successfully',
          details: data.details,
        })
        // Focus result card for screen readers
        setTimeout(() => resultRef.current?.focus(), 100)
      } else {
        setResult({
          success: false,
          message: data.error || 'Database test failed',
          details: data.details,
        })
        // Focus result card for screen readers
        setTimeout(() => resultRef.current?.focus(), 100)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to run database test',
      })
      // Focus result card for screen readers even on error
      setTimeout(() => resultRef.current?.focus(), 100)
    } finally {
      setTesting(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading...</p>
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
            { label: 'Utilities', href: '/admin/utilities' },
            { label: 'Test Database', href: '/admin/utilities/test-db' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Test Database Read and Write
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Check if you can connect to the database and make modifications
              </p>
            </div>
            <Link href="/admin/utilities">
              <Button variant="outline" className="flex items-center gap-2">
                ← Back to Utilities
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Database Connection Test</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This utility will attempt to connect to your database and perform a read/write operation. 
            It creates a temporary test table, verifies it can be written to, and then removes it. 
            This confirms that your database connection is working and that you have the necessary permissions.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={runTest}
              disabled={testing}
              className="flex items-center gap-2"
              aria-label={testing ? 'Running database test' : 'Run database connection test'}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" aria-hidden="true" />
                  <span>Run Test</span>
                </>
              )}
            </Button>
            <Link href="/admin/utilities">
              <Button variant="outline" aria-label="Cancel and return to utilities page">Cancel</Button>
            </Link>
          </div>
        </Card>

        {result && (
          <Card 
            ref={resultRef}
            className={`p-6 ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={-1}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${
                  result.success
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {result.success ? 'Test Passed' : 'Test Failed'}
                </h3>
                <p className={`text-sm ${
                  result.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.message}
                </p>
                {result.details && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                    <pre 
                      className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono"
                      role="log"
                      aria-label="Test execution details"
                      aria-live="polite"
                    >
                      {/* React automatically escapes content, preventing XSS */}
                      {result.details}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">What This Test Does</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Establishes a connection to your database</li>
                <li>Creates a temporary test table</li>
                <li>Writes data to the test table</li>
                <li>Reads data back from the test table</li>
                <li>Deletes the temporary test table</li>
              </ul>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                If all steps complete successfully, your database connection and permissions are working correctly.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

