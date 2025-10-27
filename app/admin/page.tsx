'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useEffect } from 'react'
import { hasAdminAccess } from '@/lib/auth-admin'
import Card from '@/components/ui/Card'
import { 
  Tag, 
  Users, 
  Package, 
  TrendingUp,
  Settings,
  ShoppingBag,
  Lock
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin')
    } else if (!isPending && session?.user && !hasAdminAccess(session.user)) {
      router.push('/')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null // Will redirect to sign-in
  }

  if (!hasAdminAccess(session.user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin area.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Go to Homepage
          </Link>
        </Card>
      </div>
    )
  }

  const adminSections = [
    {
      title: 'Promo Codes',
      description: 'Manage discount codes and promotions',
      icon: Tag,
      href: '/admin/promo-codes',
      color: 'orange'
    },
    {
      title: 'Customers',
      description: 'View and manage customer accounts',
      icon: Users,
      href: '/admin/customers',
      color: 'blue',
      comingSoon: true
    },
    {
      title: 'Products',
      description: 'Manage product catalog',
      icon: Package,
      href: '/admin/products',
      color: 'green',
      comingSoon: true
    },
    {
      title: 'Orders',
      description: 'View and process orders',
      icon: ShoppingBag,
      href: '/admin/orders',
      color: 'purple',
      comingSoon: true
    },
    {
      title: 'Analytics',
      description: 'Sales reports and insights',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'pink',
      comingSoon: true
    },
    {
      title: 'Settings',
      description: 'Site configuration and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'gray',
      comingSoon: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon
            const isAvailable = !section.comingSoon

            return (
              <Link
                key={section.href}
                href={isAvailable ? section.href : '#'}
                className={`block ${!isAvailable && 'pointer-events-none'}`}
              >
                <Card className={`p-6 hover:shadow-lg transition-shadow ${!isAvailable && 'opacity-60'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      section.color === 'orange' ? 'bg-orange-100 text-brand-orange' :
                      section.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      section.color === 'green' ? 'bg-green-100 text-green-600' :
                      section.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      section.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        {section.comingSoon && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Active Promo Codes</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Revenue (MTD)</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

