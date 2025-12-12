'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { B2BAccount } from '@/lib/types/b2b';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function AdminB2BPage() {
  const [accounts, setAccounts] = useState<B2BAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchAccounts();
  }, [filter]);

  const fetchAccounts = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/admin/b2b/accounts'
        : `/api/admin/b2b/accounts?status=${filter}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
      suspended: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: AlertCircle },
    };

    const { color, icon: Icon } = config[status as keyof typeof config];

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    total: accounts.length,
    pending: accounts.filter(a => a.status === 'pending').length,
    approved: accounts.filter(a => a.status === 'approved').length,
    rejected: accounts.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminBreadcrumb />
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            B2B Account Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage wholesale customer applications and accounts
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8" role="region" aria-label="Account Statistics">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Accounts
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.total}
                </p>
              </div>
              <Building2 className="w-10 h-10 text-gray-400" aria-hidden="true" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" aria-hidden="true" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Approved
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" aria-hidden="true" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Rejected
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-400" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px" role="tablist" aria-label="Account Status Filter">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  role="tab"
                  aria-selected={filter === tab}
                  aria-controls="accounts-list"
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    filter === tab
                      ? 'border-brand-orange text-brand-orange dark:text-orange-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab !== 'all' && (
                    <span className="ml-2 text-xs">
                      ({stats[tab]})
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Accounts List */}
          <div id="accounts-list" role="tabpanel" className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No accounts found</p>
              </div>
            ) : (
              accounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/admin/b2b/${account.id}`}
                  className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {account.companyName}
                        </h3>
                        <StatusBadge status={account.status} />
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Contact:</span> {account.contactName}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {account.businessType}
                        </div>
                        <div>
                          <span className="font-medium">Applied:</span>{' '}
                          {new Date(account.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {account.status === 'approved' && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Tier:</span> {account.pricingTier} •{' '}
                          <span className="font-medium">Discount:</span> {account.discountPercentage}% •{' '}
                          <span className="font-medium">Terms:</span> {account.paymentTerms}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" aria-hidden="true" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/b2b/quotes"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <FileText className="w-10 h-10 text-purple-500 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Quote Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Manage and respond to quote requests
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-brand-orange transition-colors" />
            </div>
          </Link>

          <Link
            href="/admin/b2b/tier-pricing"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <Users className="w-10 h-10 text-blue-500 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Tier Pricing
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Configure volume pricing tiers
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-brand-orange transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

