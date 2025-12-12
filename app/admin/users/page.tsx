'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Package } from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface Admin {
  id: number;
  user_id: string;
  email: string;
  name: string;
  role_name: string;
  sales_code: string | null;
  is_enabled: number;
  last_login_at: number | null;
  require_2fa: number;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, [includeDisabled]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?includeDisabled=${includeDisabled}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin users');
      }
      
      const data = await response.json();
      setAdmins(data.admins);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" role="status" aria-live="polite">
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
          <span className="sr-only">Loading admin users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <AdminBreadcrumb />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage admin users, roles, and permissions
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

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users/new"
            className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors"
          >
            + Create Admin User
          </Link>
          <Link
            href="/admin/users/roles"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Manage Roles
          </Link>
          <Link
            href="/admin/users/audit"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Audit Log
          </Link>
          <Link
            href="/admin/users/failed-logins"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Failed Logins
          </Link>
        </div>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeDisabled}
            onChange={(e) => setIncludeDisabled(e.target.checked)}
            className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
            id="include-disabled-toggle"
            aria-label="Show disabled users"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Show disabled users
          </span>
        </label>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" aria-label="Admin users table">
          <caption className="sr-only">List of admin users with their roles and settings</caption>
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sales Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Login
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                2FA
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No admin users found
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {admin.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {admin.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                      {admin.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {admin.sales_code || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(admin.last_login_at)}
                  </td>
                  <td className="px-6 py-4">
                    {admin.require_2fa ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">✓ Required</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Optional</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {admin.is_enabled ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/users/${admin.id}`}
                      className="text-brand-orange hover:text-brand-orange/80 font-medium"
                      aria-label={`Edit ${admin.name}`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

