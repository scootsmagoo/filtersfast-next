'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Mail, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

export default function TestEmailPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    emailAddress?: string
  } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/utilities/test-email')
    }
  }, [session, isPending, router])

  async function runTest() {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/utilities/test-email', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Test email sent successfully',
          emailAddress: data.emailAddress,
        })
        // Focus result card for screen readers
        setTimeout(() => resultRef.current?.focus(), 100)
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send test email',
        })
        // Focus result card for screen readers
        setTimeout(() => resultRef.current?.focus(), 100)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to run email test',
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
            { label: 'Test Email', href: '/admin/utilities/test-email' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Test Email
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Check if you are able to send emails from your store
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
            <Mail className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Email Configuration Test</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This utility will send a test email to verify that your email configuration is working correctly. 
            The email will be sent to the admin email address configured in your system settings.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={runTest}
              disabled={testing}
              className="flex items-center gap-2"
              aria-label={testing ? 'Sending test email' : 'Send test email to verify email configuration'}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Send Test Email</span>
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
                  {result.success ? 'Test Email Sent' : 'Test Failed'}
                </h3>
                <p className={`text-sm ${
                  result.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.message}
                </p>
                {result.success && result.emailAddress && (
                  <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                    <strong>Email sent to:</strong> <span aria-label={`Email address ${result.emailAddress}`}>{result.emailAddress}</span>
                  </p>
                )}
                {result.success && (
                  <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                    Please check your email inbox (and spam folder) to confirm the message was delivered. 
                    If you don't receive the email, check your email server configuration in the Store Configuration utility.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Email Configuration</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                This test verifies that your email server settings are configured correctly. If the test fails, you may need to:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Check your SMTP server address and port</li>
                <li>Verify your email credentials (username/password)</li>
                <li>Ensure your email server allows connections from your application</li>
                <li>Check firewall settings that might block email traffic</li>
                <li>Review your email provider's documentation for correct settings</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

