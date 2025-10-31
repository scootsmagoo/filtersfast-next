'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  TrendingUp, 
  ShoppingCart, 
  FileText, 
  CreditCard, 
  User, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Shield
} from 'lucide-react';
import { B2BDashboardStats } from '@/lib/types/b2b';

export default function B2BPortalPage() {
  const router = useRouter();
  const [stats, setStats] = useState<B2BDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/b2b/dashboard');
      
      if (response.status === 404) {
        // No B2B account - check if admin
        const adminCheck = await fetch('/api/admin/partners');
        if (adminCheck.ok) {
          // User is admin - show demo mode
          setError('admin-demo');
          setLoading(false);
          return;
        }
        
        // Not admin and no B2B account - redirect to application
        router.push('/business-services');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your B2B portal...</p>
        </div>
      </div>
    );
  }

  // Admin demo mode - show them what the B2B portal looks like
  if (error === 'admin-demo') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Admin Notice Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Admin Preview Mode
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  You're viewing the B2B customer portal as an admin. You don't have a B2B account, but you can see what approved customers would see.
                  To manage B2B accounts, go to{' '}
                  <Link href="/admin/b2b" className="font-semibold underline hover:no-underline">
                    Admin B2B Dashboard
                  </Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Dashboard */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              B2B Portal (Preview)
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              This is what an approved B2B customer sees
            </p>
          </div>

          {/* Demo Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pricing Tier</p>
                <TrendingUp className="w-5 h-5 text-brand-orange" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Gold</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">15% discount</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">2 pending</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$12,450.00</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg: $518.75</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Quotes</p>
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">2 accepted</p>
            </div>
          </div>

          {/* Demo Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 opacity-60">
              <Package className="w-10 h-10 text-brand-orange mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Browse Products
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                View wholesale catalog with custom pricing
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 opacity-60">
              <FileText className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Request Quote
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Get custom pricing for bulk orders
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 opacity-60">
              <ShoppingCart className="w-10 h-10 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Order History
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                View past orders and track shipments
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This is a preview. Real customers would see their actual data here.
            </p>
            <Link
              href="/admin/b2b"
              className="inline-block bg-brand-orange hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md transition-colors"
            >
              Go to Admin B2B Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || 'Unable to load B2B portal'}
          </p>
          <Link
            href="/"
            className="inline-block bg-brand-orange hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show pending status if not approved
  if (stats.accountStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Application Under Review
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Your B2B account application is currently being reviewed by our team.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                We'll notify you by email once your application has been processed. 
                This typically takes 1-2 business days.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block bg-brand-orange hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (stats.accountStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Application Not Approved
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Unfortunately, we were unable to approve your B2B account application at this time.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For more information or to discuss your application, please contact our B2B team at{' '}
                <a href="mailto:b2bsales@filtersfast.com" className="text-brand-orange hover:underline">
                  b2bsales@filtersfast.com
                </a>
              </p>
            </div>
            <Link
              href="/"
              className="inline-block bg-brand-orange hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Approved dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                B2B Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Welcome to your wholesale account dashboard
              </p>
            </div>
            <StatusBadge status={stats.accountStatus} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pricing Tier
              </p>
              <TrendingUp className="w-5 h-5 text-brand-orange" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {stats.pricingTier}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.discountPercentage}% discount
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Orders
              </p>
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalOrders}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.pendingOrders} pending
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Spent
              </p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats.totalSpent.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Avg: ${stats.averageOrderValue.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Quotes
              </p>
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeQuotes}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.acceptedQuotes} accepted
            </p>
          </div>
        </div>

        {/* Credit/Terms Info */}
        {stats.creditLimit && stats.creditLimit > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-brand-orange" />
                Credit & Payment Terms
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.creditLimit.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Credit Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.creditUsed.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Credit</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${stats.creditAvailable.toFixed(2)}
                </p>
              </div>
            </div>

            {stats.outstandingBalance > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-300">
                  <strong>Outstanding Balance:</strong> ${stats.outstandingBalance.toFixed(2)}
                  {stats.overdueAmount > 0 && (
                    <span className="text-red-600 dark:text-red-400 ml-2">
                      (${stats.overdueAmount.toFixed(2)} overdue)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/products"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-brand-orange dark:text-orange-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Browse Products
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              View wholesale catalog with your custom pricing
            </p>
          </Link>

          <Link
            href="/b2b/quotes/new"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Request Quote
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Get custom pricing for bulk or special orders
            </p>
          </Link>

          <Link
            href="/b2b/orders"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Order History
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              View past orders and track shipments
            </p>
          </Link>
        </div>

        {/* Sales Rep Contact */}
        {stats.salesRep && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-brand-orange" />
              Your Account Manager
            </h2>
            <div className="flex items-start">
              <div className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">
                  {stats.salesRep.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {stats.salesRep.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Email:{' '}
                  <a
                    href={`mailto:${stats.salesRep.email}`}
                    className="text-brand-orange hover:underline"
                  >
                    {stats.salesRep.email}
                  </a>
                </p>
                {stats.salesRep.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Phone:{' '}
                    <a
                      href={`tel:${stats.salesRep.phone}`}
                      className="text-brand-orange hover:underline"
                    >
                      {stats.salesRep.phone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

