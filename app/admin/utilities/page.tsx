'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Settings,
  Database,
  Mail,
  Server,
  Wrench,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

interface UtilitySection {
  title: string
  description: string
  icon: any
  href: string
  color: string
}

export default function AdminUtilitiesPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/utilities')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">Loading utilities...</p>
        </div>
      </div>
    )
  }

  const setupConfig: UtilitySection[] = [
    {
      title: 'Store Configuration',
      description: 'Modify your store\'s general configuration settings (URLs, email, company info, payment methods, shipping, etc.)',
      icon: Settings,
      href: '/admin/utilities/config',
      color: 'blue',
    },
    {
      title: 'Text Configuration',
      description: 'Modify email templates, terms and conditions, cart messages, and other text used throughout your store',
      icon: Wrench,
      href: '/admin/utilities/text',
      color: 'purple',
    },
  ]

  const testRepair: UtilitySection[] = [
    {
      title: 'Test Database Read and Write',
      description: 'Check if you can connect to the database and make modifications. Verifies database connectivity and write permissions.',
      icon: Database,
      href: '/admin/utilities/test-db',
      color: 'green',
    },
    {
      title: 'Test Database Structure',
      description: 'Check if database has required tables and fields, and repair if necessary. Validates schema integrity.',
      icon: Database,
      href: '/admin/utilities/test-db-structure',
      color: 'green',
    },
    {
      title: 'Test Email',
      description: 'Check if you are able to send emails from your store. Sends a test email to verify email configuration.',
      icon: Mail,
      href: '/admin/utilities/test-email',
      color: 'orange',
    },
  ]

  const general: UtilitySection[] = [
    {
      title: 'Display Server Variables',
      description: 'Display your web server\'s environment variables. Useful for debugging and configuration verification.',
      icon: Server,
      href: '/admin/utilities/server-vars',
      color: 'gray',
    },
  ]

  function UtilityCard({ section }: { section: UtilitySection }) {
    const Icon = section.icon

    return (
      <Link 
        href={section.href} 
        className="block focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded-lg"
        aria-label={`${section.title}: ${section.description}`}
      >
        <Card className="p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              section.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
              section.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
              section.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
              section.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`} aria-hidden="true">
              <Icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 transition-colors">{section.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{section.description}</p>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Utilities', href: '/admin/utilities' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Setup & Utilities
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                System maintenance, configuration, and diagnostic tools
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                ← Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Setup & Configuration */}
        <section aria-labelledby="setup-config-heading" className="mb-8">
          <h2 id="setup-config-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-blue-500">
            Setup & Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {setupConfig.map((section) => (
              <UtilityCard key={section.href} section={section} />
            ))}
          </div>
        </section>

        {/* Test and Repair */}
        <section aria-labelledby="test-repair-heading" className="mb-8">
          <h2 id="test-repair-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-green-500">
            Test and Repair
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testRepair.map((section) => (
              <UtilityCard key={section.href} section={section} />
            ))}
          </div>
        </section>

        {/* General */}
        <section aria-labelledby="general-heading" className="mb-8">
          <h2 id="general-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-gray-500">
            General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {general.map((section) => (
              <UtilityCard key={section.href} section={section} />
            ))}
          </div>
        </section>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">About Utilities</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                These utilities help you configure, test, and maintain your store. Use the test tools to verify that your database, 
                email, and server configurations are working correctly. Configuration tools allow you to customize store settings 
                and text templates.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

