'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { hasAdminAccess } from '@/lib/auth-admin'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import PromoCodeForm from '@/components/admin/PromoCodeForm'

export default function NewPromoCodePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/promo-codes/new')
    } else if (!isPending && session?.user && !hasAdminAccess(session.user)) {
      router.push('/')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!session?.user || !hasAdminAccess(session.user)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <Link 
          href="/admin/promo-codes" 
          className="inline-flex items-center gap-2 text-brand-blue hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Promo Codes
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Promo Code</h1>
          <p className="text-gray-600">
            Set up a new discount code for your customers
          </p>
        </div>

        <PromoCodeForm mode="create" />
      </div>
    </div>
  )
}

