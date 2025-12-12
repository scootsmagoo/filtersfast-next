'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Wrench, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

export default function TextConfigPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/utilities/text')
    }
  }, [session, isPending, router])

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
            { label: 'Text Configuration', href: '/admin/utilities/text' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Text Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Modify email templates, terms and conditions, and other text used throughout your store
              </p>
            </div>
            <Link href="/admin/utilities">
              <Button variant="outline" className="flex items-center gap-2" aria-label="Cancel and return to utilities page">
                ← Back to Utilities
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Text Configuration Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The Text Configuration utility is currently under development. This feature will allow you to customize:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 list-disc list-inside mb-4">
                <li>Terms and Conditions</li>
                <li>Cart Messages</li>
                <li>Order Confirmation Email Templates</li>
                <li>Order Status Update Email Templates</li>
                <li>Password Request Email Templates</li>
                <li>Email to Friend Templates</li>
                <li>Payment Success/Error Messages</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                These templates support replacement tags (like #NAME#, #ORDER#, #TOTAL#) that are automatically 
                replaced with actual values when emails are sent or messages are displayed.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">About Text Configuration</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Text Configuration allows you to customize the text and email templates used throughout your store. 
                You can personalize messages, terms, and email content to match your brand voice.
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Replacement tags (e.g., #NAME#, #ORDER#, #TOTAL#) can be used in templates and will be automatically 
                replaced with actual values when the content is displayed or sent.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

