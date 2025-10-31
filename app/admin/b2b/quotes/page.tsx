'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { QuoteRequest } from '@/lib/types/b2b';

export default function AdminB2BQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'quoted' | 'accepted' | 'declined'>('all');

  useEffect(() => {
    fetchQuotes();
  }, [filter]);

  const fetchQuotes = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/admin/b2b/quotes'
        : `/api/admin/b2b/quotes?status=${filter}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load quotes');
      }

      const data = await response.json();
      setQuotes(data.quotes);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: Clock },
      submitted: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      quoted: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: FileText },
      accepted: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
      declined: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: AlertCircle },
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
    total: quotes.length,
    submitted: quotes.filter(q => q.status === 'submitted').length,
    quoted: quotes.filter(q => q.status === 'quoted').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    declined: quotes.filter(q => q.status === 'declined').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/admin/b2b"
          className="inline-flex items-center text-brand-orange hover:underline mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to B2B Dashboard
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quote Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and respond to wholesale quote requests
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8" role="region" aria-label="Quote Statistics">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quotes</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.submitted}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quoted</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.quoted}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.accepted}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Declined</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.declined}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px" role="tablist" aria-label="Quote Status Filter">
              {(['all', 'submitted', 'quoted', 'accepted', 'declined'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  role="tab"
                  aria-selected={filter === tab}
                  aria-controls="quotes-list"
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    filter === tab
                      ? 'border-brand-orange text-brand-orange dark:text-orange-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab !== 'all' && (
                    <span className="ml-2 text-xs">({stats[tab]})</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Quotes List */}
          <div id="quotes-list" role="tabpanel" className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading quotes...</p>
              </div>
            ) : quotes.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No quote requests found</p>
              </div>
            ) : (
              quotes.map((quote) => (
                <div key={quote.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {quote.quoteNumber}
                        </h3>
                        <StatusBadge status={quote.status} />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Company:</span> {quote.companyName}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>{new Date(quote.createdAt).toLocaleDateString()}</p>
                      {quote.submittedAt && (
                        <p className="text-xs">Submitted: {new Date(quote.submittedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Items Requested ({quote.items.length}):
                    </p>
                    <div className="space-y-1">
                      {quote.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                          <span>• {item.description}</span>
                          <span className="font-medium">Qty: {item.quantity}</span>
                        </div>
                      ))}
                      {quote.items.length > 3 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          + {quote.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Customer Message */}
                  {quote.customerMessage && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Customer Message:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{quote.customerMessage}</p>
                    </div>
                  )}

                  {/* Quote Total */}
                  {quote.total !== undefined && (
                    <div className="mb-3">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        Total: ${quote.total.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {quote.status === 'submitted' && (
                      <Link
                        href={`/admin/b2b/quotes/${quote.id}`}
                        className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white text-sm rounded-md transition-colors"
                        aria-label={`Respond to quote ${quote.quoteNumber}`}
                      >
                        Respond to Quote
                      </Link>
                    )}
                    <Link
                      href={`/admin/b2b/quotes/${quote.id}`}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md transition-colors"
                      aria-label={`View details for quote ${quote.quoteNumber}`}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

