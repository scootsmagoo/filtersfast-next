'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Admin {
  id: number;
  user_id: string;
  email: string;
  name: string;
  role_id: number;
  role_name: string;
  sales_code_id: number | null;
  is_enabled: number;
  require_2fa: number;
}

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

interface Permission {
  permission_id: number;
  permission_name: string;
  permission_level: number;
}

export default function EditAdminUserPage() {
  const router = useRouter();
  const params = useParams();
  const adminId = params.id as string;

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [salesCodes, setSalesCodes] = useState<SalesCode[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    roleId: 0,
    salesCodeId: null as number | null,
    isEnabled: true,
    require2fa: true,
  });

  useEffect(() => {
    fetchData();
  }, [adminId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch admin details
      const adminResponse = await fetch(`/api/admin/users/${adminId}`);
      if (!adminResponse.ok) throw new Error('Failed to fetch admin');
      const adminData = await adminResponse.json();
      
      setAdmin(adminData.admin);
      setPermissions(adminData.permissions);
      setFormData({
        roleId: adminData.admin.role_id,
        salesCodeId: adminData.admin.sales_code_id,
        isEnabled: adminData.admin.is_enabled === 1,
        require2fa: adminData.admin.require_2fa === 1,
      });

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
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update admin');
      }

      setSuccess(true);
      setTimeout(() => router.push('/admin/users'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to disable this admin user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete admin');
      }

      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
        <span className="sr-only">Loading admin user details...</span>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600" role="alert" aria-live="assertive">
          Admin user not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-brand-orange hover:text-brand-orange/80 mb-4 inline-block"
        >
          ← Back to Admin Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Edit Admin User
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Update admin user settings and permissions
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

      {success && (
        <div 
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <p className="text-green-800 dark:text-green-200">
            Admin user updated successfully! Redirecting...
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          User Information
        </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name-display" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name-display"
                value={admin.name}
                disabled
                aria-readonly="true"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="email-display" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email-display"
                value={admin.email}
                disabled
                aria-readonly="true"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="role-edit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                id="role-edit"
                name="role"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                aria-required="true"
              >
                <option value="">Select role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sales-code-edit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Code
              </label>
              <select
                id="sales-code-edit"
                name="salesCode"
                value={formData.salesCodeId || ''}
                onChange={(e) => setFormData({ ...formData, salesCodeId: e.target.value ? parseInt(e.target.value) : null })}
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

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="is-enabled"
                  name="isEnabled"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  aria-label="Account enabled status"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Account Enabled
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="require-2fa-edit"
                  name="require2fa"
                  checked={formData.require2fa}
                  onChange={(e) => setFormData({ ...formData, require2fa: e.target.checked })}
                  className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  aria-label="Require two-factor authentication"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Require 2FA
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            aria-label="Disable this admin user"
          >
            Disable User
          </button>
          <div className="flex space-x-4">
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
              {saving ? 'Saving...' : 'Save Changes'}
              {saving && <span className="sr-only">Please wait, saving changes...</span>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

