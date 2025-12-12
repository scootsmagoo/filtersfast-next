'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, RefreshCw, FileText } from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface TaxJarStats {
  total_calculations: number;
  successful_calculations: number;
  failed_calculations: number;
  total_order_posts: number;
  successful_posts: number;
  failed_posts: number;
  pending_retries: number;
}

interface TaxJarLog {
  id: number;
  order_id: string | null;
  sales_tax_request: string;
  sales_tax_response: string;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  created_at: number;
}

interface TaxJarOrderPost {
  id: number;
  order_id: string;
  order_status: string;
  tj_resp_status: number | null;
  tj_response: string | null;
  success: boolean;
  created_at: number;
}

export default function TaxJarAdminPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<TaxJarStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<TaxJarLog[]>([]);
  const [recentPosts, setRecentPosts] = useState<TaxJarOrderPost[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'calculations' | 'orders'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/taxjar/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentLogs(data.recent_logs || []);
        setRecentPosts(data.recent_posts || []);
      } else {
        setError('Failed to load TaxJar data. Please try again.');
      }
    } catch (error) {
      console.error('Error loading TaxJar data:', error);
      setError('Failed to load TaxJar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="p-8 text-center">
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center" role="status" aria-live="polite">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" aria-hidden="true" />
          <span className="sr-only">Loading TaxJar data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminBreadcrumb />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TaxJar Integration Dashboard</h1>
        <p className="text-gray-600">Monitor tax calculations and order reporting to TaxJar</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Tax Calculations</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.total_calculations}</p>
            <p className="text-sm text-gray-500">
              {stats.successful_calculations} successful
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Failed Calculations</h3>
              <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.failed_calculations}</p>
            <p className="text-sm text-gray-500">
              {stats.total_calculations > 0
                ? ((stats.failed_calculations / stats.total_calculations) * 100).toFixed(1)
                : 0}% failure rate
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Order Reports</h3>
              <FileText className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.total_order_posts}</p>
            <p className="text-sm text-gray-500">
              {stats.successful_posts} successful
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pending Retries</h3>
              <AlertCircle className="w-5 h-5 text-orange-600" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.pending_retries}</p>
            <p className="text-sm text-gray-500">
              Orders awaiting retry
            </p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8" role="tablist" aria-label="TaxJar data views">
          <button
            onClick={() => setActiveTab('overview')}
            role="tab"
            aria-selected={activeTab === 'overview'}
            aria-controls="overview-panel"
            className={`pb-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('calculations')}
            role="tab"
            aria-selected={activeTab === 'calculations'}
            aria-controls="calculations-panel"
            className={`pb-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              activeTab === 'calculations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tax Calculations
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            role="tab"
            aria-selected={activeTab === 'orders'}
            aria-controls="orders-panel"
            className={`pb-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Order Reports
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">System Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Tax Calculation Success Rate</span>
                <span className="font-semibold">
                  {stats
                    ? ((stats.successful_calculations / (stats.total_calculations || 1)) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Order Reporting Success Rate</span>
                <span className="font-semibold">
                  {stats
                    ? ((stats.successful_posts / (stats.total_order_posts || 1)) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Orders Pending Retry</span>
                <span className="font-semibold">{stats?.pending_retries || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Quick Actions</h2>
              <Button variant="outline" size="sm" onClick={loadData} aria-label="Refresh TaxJar data">
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Refresh Data
              </Button>
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('https://app.taxjar.com', '_blank', 'noopener,noreferrer')}
                aria-label="Open TaxJar Dashboard in new tab"
              >
                Open TaxJar Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('calculations')}
              >
                View Recent Calculations
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('orders')}
              >
                View Order Reports
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'calculations' && (
        <div id="calculations-panel" role="tabpanel" aria-labelledby="calculations-tab">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Tax Calculations</h2>
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tax calculations recorded yet.</p>
                <p className="text-sm mt-2">Calculations will appear here after customers checkout.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" aria-label="Recent tax calculations">
                  <caption className="sr-only">Recent tax calculation requests and responses</caption>
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="text-left py-3 px-4">Order ID</th>
                      <th scope="col" className="text-left py-3 px-4">Status</th>
                      <th scope="col" className="text-left py-3 px-4">Date</th>
                      <th scope="col" className="text-left py-3 px-4">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {log.order_id || <span className="text-gray-400">No order</span>}
                        </td>
                        <td className="py-3 px-4">
                          {log.success ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                              <span className="font-medium">Success</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <XCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                              <span className="font-medium">Failed</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            try {
                              const response = JSON.parse(log.sales_tax_response);
                              return (
                                <details className="cursor-pointer">
                                  <summary className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                                    View Details
                                  </summary>
                                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto" aria-label="API response data">
                                    {JSON.stringify(response, null, 2)}
                                  </pre>
                                </details>
                              );
                            } catch {
                              return <span className="text-gray-400">Invalid response</span>;
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'orders' && (
        <div id="orders-panel" role="tabpanel" aria-labelledby="orders-tab">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Order Reports</h2>
            {recentPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No order reports recorded yet.</p>
                <p className="text-sm mt-2">Reports will appear here after orders are processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" aria-label="Recent order reports to TaxJar">
                  <caption className="sr-only">Recent order reporting attempts to TaxJar with status</caption>
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="text-left py-3 px-4">Order ID</th>
                      <th scope="col" className="text-left py-3 px-4">Action</th>
                      <th scope="col" className="text-left py-3 px-4">Status</th>
                      <th scope="col" className="text-left py-3 px-4">Date</th>
                      <th scope="col" className="text-left py-3 px-4">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{post.order_id}</td>
                        <td className="py-3 px-4 capitalize">{post.order_status}</td>
                        <td className="py-3 px-4">
                          {post.success ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                              <span className="font-medium">{post.tj_resp_status}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <XCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                              <span className="font-medium">{post.tj_resp_status || 'Error'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(post.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {post.tj_response ? (
                            (() => {
                              try {
                                const response = JSON.parse(post.tj_response);
                                return (
                                  <details className="cursor-pointer">
                                    <summary className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                                      View Details
                                    </summary>
                                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-w-md" aria-label="API response data">
                                      {JSON.stringify(response, null, 2)}
                                    </pre>
                                  </details>
                                );
                              } catch {
                                return <span className="text-gray-400">Invalid response</span>;
                              }
                            })()
                          ) : (
                            <span className="text-gray-400">No response</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

