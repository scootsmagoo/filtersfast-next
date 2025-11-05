'use client'

import { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  LayoutGrid,
  X
} from 'lucide-react';
import Link from 'next/link';

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
  const deleteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRedirects();
    fetchStats();
  }, [searchQuery, showActiveOnly]);

  // WCAG 2.4.3 Fix: Focus management for delete modal
  useEffect(() => {
    if (deleteConfirm && deleteModalRef.current) {
      const cancelButton = deleteModalRef.current.querySelector('button') as HTMLElement;
      cancelButton?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setDeleteConfirm(null);
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [deleteConfirm]);

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
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Back to Admin Dashboard
          </Link>
        </div>

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
          ref={deleteModalRef}
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
                aria-label="Cancel deletion and close dialog"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 border-red-600 focus:ring-red-500"
                aria-label="Confirm delete redirect permanently"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create/Edit Redirect Modal */}
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

// Redirect Form Modal (Create/Edit)
function RedirectFormModal({ redirect, onClose, onSuccess }: {
  redirect?: Redirect;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    source_path: redirect?.source_path || '',
    destination_path: redirect?.destination_path || '',
    redirect_type: redirect?.redirect_type || '301' as '301' | '302',
    is_regex: redirect?.is_regex || false,
    is_active: redirect?.is_active !== false,
    description: redirect?.description || ''
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // WCAG 2.4.3 Fix: Focus management and keyboard handling
  useEffect(() => {
    // Focus close button when modal opens
    closeButtonRef.current?.focus();

    // Escape key closes modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };

    // Focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, saving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const url = redirect 
        ? `/api/admin/redirects/${redirect.id}`
        : '/api/admin/redirects';
      
      const method = redirect ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save redirect');
      }
    } catch (err) {
      setError('Failed to save redirect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 id="form-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            {redirect ? 'Edit Redirect' : 'Add Redirect'}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div 
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" 
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="source_path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source Path *
            </label>
            <input
              id="source_path"
              type="text"
              required
              value={formData.source_path}
              onChange={(e) => setFormData({ ...formData, source_path: e.target.value })}
              placeholder="/old-page or /products/.*"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
              maxLength={500}
              aria-describedby="source_path-hint"
              aria-required="true"
            />
            <p id="source_path-hint" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The URL path to redirect from (e.g., /old-page)
            </p>
          </div>

          <div>
            <label htmlFor="destination_path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destination Path *
            </label>
            <input
              id="destination_path"
              type="text"
              required
              value={formData.destination_path}
              onChange={(e) => setFormData({ ...formData, destination_path: e.target.value })}
              placeholder="/new-page"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
              maxLength={500}
              aria-describedby="destination_path-hint"
              aria-required="true"
            />
            <p id="destination_path-hint" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The URL path to redirect to (e.g., /new-page)
            </p>
          </div>

          <div>
            <label htmlFor="redirect_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Redirect Type *
            </label>
            <select
              id="redirect_type"
              value={formData.redirect_type}
              onChange={(e) => setFormData({ ...formData, redirect_type: e.target.value as '301' | '302' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
              aria-describedby="redirect_type-hint"
              aria-required="true"
            >
              <option value="301">301 - Permanent Redirect</option>
              <option value="302">302 - Temporary Redirect</option>
            </select>
            <p id="redirect_type-hint" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use 301 for permanent changes, 302 for temporary redirects
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of why this redirect exists..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
              maxLength={500}
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="is_regex" className="flex items-center gap-2 cursor-pointer">
              <input
                id="is_regex"
                type="checkbox"
                checked={formData.is_regex}
                onChange={(e) => setFormData({ ...formData, is_regex: e.target.checked })}
                className="rounded text-brand-orange focus:ring-brand-orange focus:ring-2 focus:ring-offset-2"
                aria-describedby={formData.is_regex ? "regex-warning" : undefined}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Use Regex Pattern Matching
              </span>
            </label>
            {formData.is_regex && (
              <p id="regex-warning" className="text-xs text-yellow-600 dark:text-yellow-400 ml-6" role="note">
                ⚠️ Regex patterns are powerful but can be complex. Test thoroughly before activating.
              </p>
            )}

            <label htmlFor="is_active" className="flex items-center gap-2 cursor-pointer">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded text-brand-orange focus:ring-brand-orange focus:ring-2 focus:ring-offset-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Active (redirect will be applied immediately)
              </span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
              aria-label="Cancel and close modal"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              aria-busy={saving}
              aria-label={redirect ? 'Update redirect and close' : 'Create redirect and close'}
            >
              {saving ? 'Saving...' : (redirect ? 'Update Redirect' : 'Create Redirect')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Bulk Import Modal
function BulkImportModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; failed: number; errors: any[] } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // WCAG 2.4.3 Fix: Focus management and keyboard handling
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importing) {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, importing]);

  const handleImport = async () => {
    setError(null);
    setResult(null);
    setImporting(true);

    try {
      // Parse CSV
      const lines = csvText.trim().split('\n');
      if (lines.length === 0) {
        setError('CSV is empty');
        setImporting(false);
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Validate headers
      const requiredHeaders = ['source_path', 'destination_path'];
      const hasRequired = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequired) {
        setError('CSV must have columns: source_path, destination_path (optional: redirect_type, description, is_regex, is_active)');
        setImporting(false);
        return;
      }

      // Parse data rows
      const redirects = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return {
          source_path: row.source_path,
          destination_path: row.destination_path,
          redirect_type: row.redirect_type || '301',
          is_regex: row.is_regex === 'true' || row.is_regex === '1',
          is_active: row.is_active !== 'false' && row.is_active !== '0',
          description: row.description || undefined
        };
      }).filter(r => r.source_path && r.destination_path);

      if (redirects.length === 0) {
        setError('No valid redirects found in CSV');
        setImporting(false);
        return;
      }

      if (redirects.length > 1000) {
        setError('Maximum 1000 redirects per import. Please split your CSV.');
        setImporting(false);
        return;
      }

      // Send to API
      const response = await fetch('/api/admin/redirects/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirects })
      });

      const data = await response.json();

      if (response.ok || response.status === 207) {
        setResult(data.data);
        if (data.data.failed === 0) {
          setTimeout(() => onSuccess(), 2000);
        }
      } else {
        setError(data.error || 'Failed to import redirects');
      }
    } catch (err) {
      setError('Failed to parse CSV or import redirects. Please check format.');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !importing) onClose();
      }}
    >
      <Card className="max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 id="bulk-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Bulk Import Redirects
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            disabled={importing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
            aria-label="Close bulk import modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div 
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" 
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div 
            className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" 
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-green-800 dark:text-green-300 font-semibold mb-2">
              ✅ Import Complete: {result.created} created, {result.failed} failed
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-green-700 dark:text-green-400 mb-1">Errors:</p>
                <ul className="text-xs text-green-700 dark:text-green-400 list-disc list-inside">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>...and {result.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload CSV File
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-orange file:text-white hover:file:bg-brand-orange-dark file:cursor-pointer file:focus:outline-none file:focus:ring-2 file:focus:ring-brand-orange file:focus:ring-offset-2"
              aria-label="Upload CSV file with redirects"
              aria-describedby="csv-format-info"
            />
          </div>

          <div>
            <label htmlFor="csv-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Or Paste CSV Content
            </label>
            <textarea
              id="csv-text"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="source_path,destination_path,redirect_type,description
/old-page,/new-page,301,Product page migration
/blog/old,/blog/new,301,Blog post update"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
              aria-describedby="csv-format-info"
              aria-label="CSV content for bulk import"
            />
          </div>

          <div 
            id="csv-format-info"
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            role="region"
            aria-label="CSV format instructions"
          >
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">CSV Format:</h3>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <li><strong>Required columns:</strong> source_path, destination_path</li>
              <li><strong>Optional columns:</strong> redirect_type (301/302), description, is_regex (true/false), is_active (true/false)</li>
              <li><strong>Max:</strong> 1000 redirects per import</li>
              <li><strong>Example:</strong> /old-page,/new-page,301,Migration note</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={importing}
              aria-label={result ? 'Close bulk import modal' : 'Cancel bulk import'}
            >
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button
                type="button"
                variant="primary"
                onClick={handleImport}
                disabled={importing || !csvText.trim()}
                aria-busy={importing}
                aria-label="Import redirects from CSV"
                aria-disabled={importing || !csvText.trim()}
              >
                {importing ? 'Importing...' : 'Import Redirects'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

