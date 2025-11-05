'use client'

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  ArrowRight,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Download,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Redirect {
  id: number;
  source_path: string;
  destination_path: string;
  redirect_type: '301' | '302';
  is_regex: boolean;
  is_active: boolean;
  description?: string;
  hit_count: number;
  created_at: string;
  updated_at: string;
}

interface RedirectStats {
  total: number;
  active: number;
  inactive: number;
  regex: number;
  permanent: number;
  temporary: number;
  totalHits: number;
  topRedirects: Array<{
    id: number;
    source_path: string;
    destination_path: string;
    hit_count: number;
  }>;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [stats, setStats] = useState<RedirectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchRedirects();
    fetchStats();
  }, [searchQuery, showActiveOnly]);

  const fetchRedirects = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (showActiveOnly) params.set('activeOnly', 'true');
      params.set('limit', '100');

      const response = await fetch(`/api/admin/redirects?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRedirects(data.data);
      } else {
        setError('Failed to fetch redirects');
      }
    } catch (error) {
      console.error('Failed to fetch redirects:', error);
      setError('Failed to fetch redirects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/redirects/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/redirects/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeleteConfirm(null);
        fetchRedirects();
        fetchStats();
      } else {
        setError('Failed to delete redirect. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete redirect:', error);
      setError('Failed to delete redirect. Please try again.');
    }
  };

  const handleToggleActive = async (redirect: Redirect) => {
    try {
      const response = await fetch(`/api/admin/redirects/${redirect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !redirect.is_active })
      });

      if (response.ok) {
        fetchRedirects();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to toggle redirect:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Source Path', 'Destination Path', 'Type', 'Active', 'Regex', 'Hits', 'Description'];
    const rows = redirects.map(r => [
      r.source_path,
      r.destination_path,
      r.redirect_type,
      r.is_active ? 'Yes' : 'No',
      r.is_regex ? 'Yes' : 'No',
      r.hit_count,
      r.description || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redirects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"
            aria-hidden="true"
          ></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading redirects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            URL Redirect Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage URL redirects for SEO preservation and site migration
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                aria-label="Dismiss error message"
              >
                <XCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" role="region" aria-label="Redirect statistics">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Redirects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white" aria-label={`${stats.total} total redirects`}>{stats.total}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400" aria-label={`${stats.active} active redirects`}>{stats.active}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hits</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400" aria-label={`${stats.totalHits.toLocaleString()} total hits`}>
                    {stats.totalHits.toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="w-10 h-10 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Regex Patterns</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" aria-label={`${stats.regex} regex patterns`}>{stats.regex}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
            </Card>
          </div>
        )}

        {/* Actions Bar */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex-1 w-full md:w-auto">
              <label htmlFor="search-redirects" className="sr-only">
                Search redirects
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <input
                  id="search-redirects"
                  type="text"
                  placeholder="Search redirects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                  aria-label="Search redirects by source path, destination path, or description"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label 
                htmlFor="active-only-filter" 
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <input
                  id="active-only-filter"
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="rounded text-brand-orange focus:ring-brand-orange focus:ring-2 focus:ring-offset-2"
                  aria-label="Show only active redirects"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active Only</span>
              </label>

              <Button
                variant="secondary"
                onClick={exportToCSV}
                className="inline-flex items-center gap-2"
                aria-label="Export redirects to CSV file"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Export CSV
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center gap-2"
                aria-label="Bulk import redirects from CSV"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Bulk Import
              </Button>

              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2"
                aria-label="Add new redirect"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Redirect
              </Button>
            </div>
          </div>
        </Card>

        {/* Redirects Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table" aria-label="URL redirects">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source → Destination
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hits
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {redirects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No redirects found. Create your first redirect to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  redirects.map((redirect) => (
                    <tr key={redirect.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-gray-900 dark:text-white">
                              {redirect.source_path}
                            </code>
                            {redirect.is_regex && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                                REGEX
                              </span>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 my-1" />
                          <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {redirect.destination_path}
                          </code>
                          {redirect.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {redirect.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            redirect.redirect_type === '301'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          }`}
                          aria-label={`${redirect.redirect_type} ${redirect.redirect_type === '301' ? 'Permanent' : 'Temporary'} redirect`}
                        >
                          {redirect.redirect_type} {redirect.redirect_type === '301' ? 'Permanent' : 'Temporary'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(redirect)}
                          className={`px-3 py-1 text-xs font-semibold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            redirect.is_active
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40 focus:ring-green-500'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500'
                          }`}
                          aria-label={`${redirect.is_active ? 'Deactivate' : 'Activate'} redirect from ${redirect.source_path}`}
                          aria-pressed={redirect.is_active}
                        >
                          {redirect.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                        {redirect.hit_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingRedirect(redirect)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label={`Edit redirect from ${redirect.source_path} to ${redirect.destination_path}`}
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(redirect.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            aria-label={`Delete redirect from ${redirect.source_path} to ${redirect.destination_path}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Redirects */}
        {stats && stats.topRedirects.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Most Used Redirects
            </h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table" aria-label="Most used redirects">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Source → Destination
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Hits
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.topRedirects.map((redirect, index) => (
                      <tr key={redirect.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                              {redirect.source_path}
                            </code>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                              {redirect.destination_path}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-900 dark:text-white">
                          {redirect.hit_count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
        >
          <Card className="max-w-md w-full p-6">
            <h3 id="delete-title" className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this redirect? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
                aria-label="Cancel deletion"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 border-red-600"
                aria-label="Confirm delete redirect"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modals will be added in the next update */}
      {showCreateModal && (
        <RedirectFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRedirects();
            fetchStats();
          }}
        />
      )}

      {editingRedirect && (
        <RedirectFormModal
          redirect={editingRedirect}
          onClose={() => setEditingRedirect(null)}
          onSuccess={() => {
            setEditingRedirect(null);
            fetchRedirects();
            fetchStats();
          }}
        />
      )}

      {showBulkModal && (
        <BulkImportModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false);
            fetchRedirects();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}

// Modal components will be in the next file...
function RedirectFormModal({ redirect, onClose, onSuccess }: {
  redirect?: Redirect;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Implementation in next iteration
  return null;
}

function BulkImportModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Implementation in next iteration
  return null;
}

