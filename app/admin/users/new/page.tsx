'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface Role {
  id: number;
  name: string;
  description: string;
}

interface SalesCode {
  id: number;
  code: string;
  name: string;
}

export default function NewAdminUserPage() {
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [salesCodes, setSalesCodes] = useState<SalesCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    roleId: '',
    salesCodeId: '',
    require2fa: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch roles
      const rolesResponse = await fetch('/api/admin/roles');
      if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
      const rolesData = await rolesResponse.json();
      setRoles(rolesData.roles);

      // Fetch sales codes
      const salesResponse = await fetch('/api/admin/sales-codes');
      if (!salesResponse.ok) throw new Error('Failed to fetch sales codes');
      const salesData = await salesResponse.json();
      setSalesCodes(salesData.salesCodes);

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          roleId: parseInt(formData.roleId),
          salesCodeId: formData.salesCodeId ? parseInt(formData.salesCodeId) : undefined,
          require2fa: formData.require2fa,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create admin user');
      }

      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
        <span className="sr-only">Loading form data...</span>
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
          Create Admin User
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add a new admin user to the system
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

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            User Information
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                aria-required="true"
                aria-describedby="email-help"
              />
              <p id="email-help" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                If the email exists, it will be linked. Otherwise, a new account will be created.
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role <span className="text-red-500" aria-label="required">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                aria-required="true"
              >
                <option value="">Select role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.description && ` - ${role.description}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sales-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Code
              </label>
              <select
                id="sales-code"
                name="salesCode"
                value={formData.salesCodeId}
                onChange={(e) => setFormData({ ...formData, salesCodeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Sales code assignment"
              >
                <option value="">None</option>
                {salesCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.name} ({code.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="require-2fa"
                  name="require2fa"
                  checked={formData.require2fa}
                  onChange={(e) => setFormData({ ...formData, require2fa: e.target.checked })}
                  className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  aria-label="Require two-factor authentication"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Require 2FA (Recommended)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
            aria-disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Admin User'}
            {saving && <span className="sr-only">Please wait, creating admin user...</span>}
          </button>
        </div>
      </form>
    </div>
  );
}

