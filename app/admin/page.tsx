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
  Lock,
  ShoppingCart,
  RotateCcw,
  Bell,
  Shield,
  HelpCircle,
  Heart,
  Gift,
  Handshake,
  Building2,
  Globe,
  Receipt,
  Truck
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
      console.log('Admin access denied for:', session.user.email)
      console.log('User object:', session.user)
      // Only redirect after a brief delay to ensure session is fully loaded
      setTimeout(() => {
        router.push('/')
      }, 100)
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null // Will redirect to sign-in
  }

  if (!hasAdminAccess(session.user)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <Card className="p-8 max-w-md text-center">
          <Lock className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors">
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
      title: 'Orders',
      description: 'View and manage customer orders',
      icon: ShoppingBag,
      href: '/admin/orders',
      color: 'blue'
    },
    {
      title: 'Products',
      description: 'Manage product catalog and inventory',
      icon: Package,
      href: '/admin/products',
      color: 'cyan'
    },
    {
      title: 'Customers',
      description: 'View and manage customer accounts',
      icon: Users,
      href: '/admin/customers',
      color: 'indigo'
    },
    {
      title: 'TaxJar Integration',
      description: 'Sales tax compliance and reporting',
      icon: Receipt,
      href: '/admin/taxjar',
      color: 'green'
    },
    {
      title: 'Shipping Configuration',
      description: 'Configure FedEx, USPS, and UPS APIs',
      icon: Truck,
      href: '/admin/shipping',
      color: 'blue'
    },
    {
      title: 'Promo Codes',
      description: 'Manage discount codes and promotions',
      icon: Tag,
      href: '/admin/promo-codes',
      color: 'orange'
    },
    {
      title: 'Giveaways & Sweepstakes',
      description: 'Create contests and pick winners',
      icon: Gift,
      href: '/admin/giveaways',
      color: 'orange'
    },
    {
      title: 'Referral Program',
      description: 'Manage customer referrals and rewards',
      icon: Users,
      href: '/admin/referrals',
      color: 'purple'
    },
    {
      title: 'Affiliate Program',
      description: 'Manage affiliates and commissions',
      icon: TrendingUp,
      href: '/admin/affiliates',
      color: 'emerald'
    },
    {
      title: 'Abandoned Carts',
      description: 'View cart recovery metrics and analytics',
      icon: ShoppingCart,
      href: '/admin/abandoned-carts',
      color: 'red'
    },
    {
      title: 'Returns & Exchanges',
      description: 'Manage customer return requests',
      icon: RotateCcw,
      href: '/admin/returns',
      color: 'blue'
    },
    {
      title: 'Filter Reminders',
      description: 'Monitor replacement reminder system',
      icon: Bell,
      href: '/admin/reminders',
      color: 'green'
    },
    {
      title: 'Multi-Factor Auth',
      description: 'MFA adoption and security metrics',
      icon: Shield,
      href: '/admin/mfa',
      color: 'purple'
    },
    {
      title: 'Support Articles',
      description: 'Knowledge base analytics',
      icon: HelpCircle,
      href: '/admin/support',
      color: 'teal'
    },
    {
      title: 'Charitable Donations',
      description: 'Track donations and impact',
      icon: Heart,
      href: '/admin/charities',
      color: 'pink'
    },
    {
      title: 'Partner Landing Pages',
      description: 'Manage charity and corporate partner pages',
      icon: Handshake,
      href: '/admin/partners',
      color: 'blue'
    },
    {
      title: 'B2B Portal',
      description: 'Manage wholesale accounts and quotes',
      icon: Building2,
      href: '/admin/b2b',
      color: 'indigo'
    },
    {
      title: 'Translations',
      description: 'Manage multi-language translations',
      icon: Globe,
      href: '/admin/translations',
      color: 'teal'
    },
    {
      title: 'Analytics',
      description: 'Sales reports and insights',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'emerald'
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
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
                <Card className={`p-6 hover:shadow-lg transition-all ${!isAvailable && 'opacity-60'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      section.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-brand-orange' :
                      section.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                      section.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      section.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      section.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                      section.color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' :
                      section.color === 'teal' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' :
                      section.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                      section.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' :
                      section.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                      section.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{section.title}</h3>
                        {section.comingSoon && (
                          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded transition-colors">
                            Coming Soon
                          </span>
                        )}
                        {section.badge === 'NEW' && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-semibold">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{section.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Active Promo Codes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">5</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">-</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">-</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Revenue (MTD)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">-</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

