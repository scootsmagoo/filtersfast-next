'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface Permission {
  role_id: number;
  permission_id: number;
  permission_name: string;
  permission_level: number;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles');
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      const data = await response.json();
      setRoles(data.roles);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionLevelName = (level: number) => {
    switch (level) {
      case -1: return 'No Access';
      case 0: return 'Read-Only';
      case 1: return 'Full Control';
      case 2: return 'Restricted';
      default: return 'Unknown';
    }
  };

  const getPermissionLevelColor = (level: number) => {
    switch (level) {
      case -1: return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 0: return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 1: return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 2: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
        <span className="sr-only">Loading roles...</span>
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
          Admin Roles
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage admin roles and their permissions
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

      <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
          >
            <button
              className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
              onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
              aria-expanded={expandedRole === role.id}
              aria-controls={`role-permissions-${role.id}`}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {role.name}
                </h3>
                {role.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {role.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {role.permissions.length} permissions assigned
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement edit role
                    alert('Edit role feature coming soon');
                  }}
                  className="px-4 py-2 text-sm bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90"
                >
                  Edit
                </button>
                <svg
                  className={`w-6 h-6 text-gray-400 transform transition-transform ${
                    expandedRole === role.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {expandedRole === role.id && (
              <div 
                id={`role-permissions-${role.id}`}
                className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900"
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Permissions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {role.permissions.map((perm) => (
                    <div
                      key={perm.permission_id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm text-gray-900 dark:text-white">
                        {perm.permission_name}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionLevelColor(
                          perm.permission_level
                        )}`}
                      >
                        {getPermissionLevelName(perm.permission_level)}
                      </span>
                    </div>
                  ))}
                </div>
                {role.permissions.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No permissions assigned to this role
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No roles found
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => alert('Create new role feature coming soon')}
          className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90"
        >
          + Create New Role
        </button>
      </div>
    </div>
  );
}

