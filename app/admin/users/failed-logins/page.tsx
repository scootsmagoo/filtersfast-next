'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface FailedLogin {
  id: number;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  reason: string | null;
  created_at: number;
}

export default function FailedLoginsPage() {
  const [logs, setLogs] = useState<FailedLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    fetchLogs();
  }, [emailFilter, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (emailFilter) params.append('email', emailFilter);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/admin/failed-logins?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch failed login attempts');
      }
      
      const data = await response.json();
      setLogs(data.failedLogins);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-8" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
        <span className="sr-only">Loading failed login attempts...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <AdminBreadcrumb />
        <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-brand-orange hover:text-brand-orange/80 mb-4 inline-block"
        >
          ← Back to Admin Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Failed Login Attempts
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor failed login attempts for security
        </p>
      </div>

      {error && (
        <div 
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="text"
              id="email-filter"
              name="emailFilter"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Filter by email..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              aria-label="Filter by email address"
            />
          </div>
          <div>
            <label htmlFor="limit-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Limit
            </label>
            <select
              id="limit-filter"
              name="limit"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              aria-label="Number of entries to display"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" aria-label="Failed login attempts">
            <caption className="sr-only">Failed login attempts showing timestamps, emails, IP addresses, and reasons</caption>
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No failed login attempts found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {log.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.reason || 'Invalid credentials'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Showing {logs.length} failed login attempts
      </div>
    </div>
  );
}

