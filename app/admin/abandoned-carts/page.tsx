/**
 * Admin Abandoned Cart Dashboard
 * View and analyze abandoned cart recovery metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { AbandonedCart, AbandonedCartStats } from '@/lib/db/abandoned-carts';
import Card from '@/components/ui/Card';

interface AbandonedCartWithItems extends Omit<AbandonedCart, 'cart_data'> {
  cart_items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCartWithItems[]>([]);
  const [stats, setStats] = useState<AbandonedCartStats | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'recovered' | 'opted_out'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const filterOptions = [
    { value: 'all', label: 'All Carts' },
    { value: 'pending', label: 'Pending' },
    { value: 'recovered', label: 'Recovered' },
    { value: 'opted_out', label: 'Opted Out' },
  ];

  useEffect(() => {
    fetchCarts();
    fetchStats();
  }, [selectedFilter, currentPage]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/abandoned-carts/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        filter: selectedFilter,
      });

      const response = await fetch(`/api/admin/abandoned-carts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch carts');
      
      const data = await response.json();
      setCarts(data.carts);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (cart: AbandonedCartWithItems) => {
    if (cart.converted) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Recovered</span>;
    }
    if (cart.opted_out) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Opted Out</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Abandoned Cart Recovery</h1>
        <p className="text-gray-600">Monitor and analyze cart abandonment metrics</p>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Abandoned</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_abandoned}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Recovery Rate</p>
            <p className="text-3xl font-bold text-green-600">{stats.recovery_rate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">{stats.total_recovered} recovered</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Value Recovered</p>
            <p className="text-3xl font-bold text-green-600">${stats.total_value_recovered.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">
              of ${stats.total_value_abandoned.toLocaleString()} abandoned
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Emails Sent</p>
            <p className="text-3xl font-bold text-blue-600">{stats.emails_sent}</p>
            <p className="text-xs text-gray-500 mt-1">Recovery emails</p>
          </Card>
        </div>
      )}

      {/* Additional Metrics Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Recent Abandons</p>
            <p className="text-2xl font-bold text-orange-600">{stats.recent_abandons}</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Cart Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.total_abandoned > 0 ? (stats.total_value_abandoned / stats.total_abandoned).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per abandoned cart</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Recovered Value</p>
            <p className="text-2xl font-bold text-green-600">
              ${stats.total_recovered > 0 ? (stats.total_value_recovered / stats.total_recovered).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per recovered cart</p>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" role="tablist" aria-label="Cart filter options">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedFilter(option.value as any);
                  setCurrentPage(1);
                }}
                role="tab"
                aria-selected={selectedFilter === option.value}
                aria-controls={`${option.value}-panel`}
                tabIndex={selectedFilter === option.value ? 0 : -1}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-t ${
                  selectedFilter === option.value
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Carts List */}
      <div id={`${selectedFilter}-panel`} role="tabpanel" aria-labelledby={`${selectedFilter}-tab`}>
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <div 
              className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"
              role="img"
              aria-label="Loading spinner"
            ></div>
            <p className="mt-2 text-gray-600">Loading abandoned carts...</p>
            <span className="sr-only">Please wait while we load the cart data</span>
          </div>
        ) : error ? (
          <Card className="p-6 bg-red-50 border-red-200" role="alert" aria-live="assertive">
            <p className="text-red-800">{error}</p>
          </Card>
        ) : carts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No abandoned carts found</p>
          </Card>
        ) : (
        <ul className="space-y-4" role="list" aria-label="Abandoned carts">
          {carts.map((cart) => (
            <li key={cart.id}>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{cart.email}</h3>
                      <span 
                        className={getStatusBadge(cart).props.className}
                        role="status"
                        aria-label={`Status: ${cart.converted ? 'Recovered' : cart.opted_out ? 'Opted out' : 'Pending'}`}
                      >
                        {getStatusBadge(cart).props.children}
                      </span>
                    </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Abandoned: {formatDate(cart.abandoned_at)}</span>
                    <span>•</span>
                    <span>Value: ${cart.cart_value.toFixed(2)}</span>
                    <span>•</span>
                    <span>Emails Sent: {cart.email_sent_count}/3</span>
                  </div>
                </div>
                {cart.converted && cart.order_id && (
                  <div className="text-right text-sm">
                    <p className="text-green-600 font-medium">✓ Recovered</p>
                    <p className="text-gray-500">Order: {cart.order_id}</p>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="bg-gray-50 rounded-lg p-4" role="region" aria-labelledby={`cart-${cart.id}-items`}>
                <h4 id={`cart-${cart.id}-items`} className="text-sm font-medium text-gray-900 mb-2">Cart Items:</h4>
                <ul className="space-y-2" role="list">
                  {cart.cart_items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.name} <span className="text-gray-500">(<span className="sr-only">Quantity:</span>Qty: {item.quantity})</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        <span className="sr-only">Price:</span>
                        ${item.price.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total:</span>
                  <span className="text-lg font-bold text-gray-900">${cart.cart_value.toFixed(2)}</span>
                </div>
              </div>

              {/* Email Status */}
              {cart.last_email_sent && (
                <div className="mt-4 text-xs text-gray-500">
                  Last email sent: {formatDate(cart.last_email_sent)}
                </div>
              )}
            </Card>
            </li>
          ))}
        </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex justify-center space-x-2" aria-label="Pagination navigation" role="navigation">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            aria-disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700" role="status" aria-live="polite" aria-atomic="true">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            aria-disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Next
          </button>
        </nav>
      )}

      {/* Instructions */}
      <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 How Abandoned Cart Recovery Works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li><strong>1 Hour:</strong> First reminder email sent ("You left something behind")</li>
          <li><strong>24 Hours:</strong> Second reminder with social proof and urgency</li>
          <li><strong>72 Hours:</strong> Final reminder with special offer</li>
          <li><strong>Auto-Cleanup:</strong> Carts older than 90 days are automatically deleted</li>
        </ul>
        <div className="mt-4 p-4 bg-white rounded-md">
          <p className="text-sm font-medium text-blue-900 mb-2">🔧 Scheduled Jobs:</p>
          <code className="block text-xs text-blue-700 bg-blue-100 p-2 rounded">
            npx tsx scripts/send-abandoned-cart-emails.ts
          </code>
          <p className="text-xs text-blue-700 mt-2">Run this hourly via cron or task scheduler</p>
        </div>
      </Card>
    </div>
  );
}

