'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Database, CheckCircle, XCircle, Loader2, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

interface TableCheck {
  tableName: string
  exists: boolean
  fields: FieldCheck[]
  errors: string[]
}

interface FieldCheck {
  fieldName: string
  status: 'ok' | 'missing' | 'type_mismatch' | 'length_mismatch'
  message: string
}

export default function TestDatabaseStructurePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TableCheck[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/utilities/test-db-structure')
    }
  }, [session, isPending, router])

  async function runTest() {
    setTesting(true)
    setResults([])
    setError(null)
    setErrorCount(0)

    try {
      const response = await fetch('/api/admin/utilities/test-db-structure', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.tables || [])
        setErrorCount(data.errorCount || 0)
        // Focus results section for screen readers
        setTimeout(() => resultsRef.current?.focus(), 100)
      } else {
        setError(data.error || 'Database structure test failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run database structure test')
      // Focus results section for screen readers even on error
      setTimeout(() => resultsRef.current?.focus(), 100)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Utilities', href: '/admin/utilities' },
            { label: 'Test Database Structure', href: '/admin/utilities/test-db-structure' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Test Database Structure
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Check if database has required tables and fields, and repair if necessary
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Database Structure Validation</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This utility will check your database structure to ensure all required tables and fields exist. 
            It validates that the schema matches the expected structure and can identify missing tables, 
            missing fields, or incorrect field types.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={runTest}
              disabled={testing}
              className="flex items-center gap-2"
              aria-label={testing ? 'Running database structure test' : 'Run database structure validation test'}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" aria-hidden="true" />
                  <span>Run Structure Test</span>
                </>
              )}
            </Button>
            <Link href="/admin/utilities">
              <Button variant="outline" aria-label="Cancel and return to utilities page">Cancel</Button>
            </Link>
          </div>
        </Card>

        {error && (
          <Card 
            className="p-6 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Test Failed</h3>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {results.length > 0 && (
          <div ref={resultsRef} tabIndex={-1}>
            <Card 
              className={`p-6 mb-6 ${
                errorCount === 0
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-start gap-3">
                {errorCount === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div>
                  <h3 className={`font-semibold mb-1 ${
                    errorCount === 0
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-yellow-900 dark:text-yellow-100'
                  }`}>
                    {errorCount === 0 ? 'No Errors Found' : `${errorCount} Error(s) Found`}
                  </h3>
                  <p className={`text-sm ${
                    errorCount === 0
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {errorCount === 0
                      ? 'Congratulations! All database tables and fields are present and correctly configured.'
                      : 'Some issues were found with your database structure. Review the details below.'}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-4" role="region" aria-label="Database structure validation results">
              {results.map((table, index) => (
                <Card key={index} className="p-6" role="article" aria-labelledby={`table-${index}-name`}>
                  <div className="flex items-center gap-2 mb-4">
                    {table.exists ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-label="Table exists" aria-hidden="true" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-label="Table not found" aria-hidden="true" />
                    )}
                    <h3 id={`table-${index}-name`} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Table: <code className="font-mono">{table.tableName}</code>
                    </h3>
                    {!table.exists && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded" role="status" aria-label="Table not found">
                        Table Not Found
                      </span>
                    )}
                  </div>

                  {table.exists && table.fields.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fields:</h4>
                      <ul className="space-y-2" role="list" aria-label={`Fields for table ${table.tableName}`}>
                        {table.fields.map((field, fieldIndex) => (
                          <li key={fieldIndex} className="flex items-center gap-2 text-sm">
                            {field.status === 'ok' ? (
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" aria-label="Field exists" aria-hidden="true" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" aria-label="Field missing" aria-hidden="true" />
                            )}
                            <code className="font-mono text-gray-900 dark:text-gray-100" aria-label={`Field ${field.fieldName}`}>
                              {field.fieldName}
                            </code>
                            {field.status !== 'ok' && (
                              <span className="text-red-600 dark:text-red-400 text-xs" aria-label={`Error: ${field.message}`}>
                                - {field.message}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {table.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded" role="alert" aria-live="polite">
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Errors:</h4>
                      <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside" role="list">
                        {table.errors.map((err, errIndex) => (
                          <li key={errIndex} aria-label={`Error ${errIndex + 1}: ${err}`}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">About Database Structure Testing</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                This utility validates that your database schema matches the expected structure. It checks for:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Required tables exist</li>
                <li>Required fields exist in each table</li>
                <li>Field types match expected types</li>
                <li>Field lengths match expected lengths</li>
              </ul>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                If errors are found, you may need to manually repair your database structure or run migration scripts.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

