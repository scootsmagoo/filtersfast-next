'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  AlertCircle,
  ArrowUpRight,
  Layers,
  RefreshCw,
  Ruler,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { ListBySizeEntry, ListBySizeSummary } from '@/lib/types/product';

type ActiveFilter = 'all' | 'active' | 'inactive';

interface ApiResponse {
  success: boolean;
  entries: ListBySizeEntry[];
  summary: ListBySizeSummary;
  total: number;
}

export default function ListBySizeAdminPage() {
  const [entries, setEntries] = useState<ListBySizeEntry[]>([]);
  const [summary, setSummary] = useState<ListBySizeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ search: string; size: string; active: ActiveFilter }>({
    search: '',
    size: '',
    active: 'active',
  });
  const [searchInput, setSearchInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const sizeOptions = useMemo(() => summary?.sizes ?? [], [summary]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    let ignore = false;
    const loadEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.size) params.set('size', filters.size);
        if (filters.active) params.set('active', filters.active);
        const query = params.toString();
        const response = await fetch(`/api/admin/list-by-size${query ? `?${query}` : ''}`, {
          cache: 'no-store',
        });
        const data: ApiResponse = await response.json();
        if (!response.ok) {
          throw new Error((data as any)?.error || 'Failed to load list-by-size data');
        }
        if (!ignore) {
          setEntries(data.entries || []);
          setSummary(data.summary || null);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message || 'Unable to load list-by-size data');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadEntries();
    return () => {
      ignore = true;
    };
  }, [filters, refreshKey]);

  const handleToggle = async (entry: ListBySizeEntry) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/list-by-size/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-active' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update entry');
      }

      const updated: ListBySizeEntry = data.entry;
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSummary((prev) => {
        if (!prev || entry.sizeActive === updated.sizeActive) {
          return prev;
        }
        const delta = updated.sizeActive ? 1 : -1;
        const nextActive = Math.max(0, Math.min(prev.total, prev.active + delta));
        return {
          ...prev,
          active: nextActive,
          inactive: prev.total - nextActive,
        };
      });
      setToast(
        `Entry ${updated.sizeActive ? 'activated' : 'deactivated'} for ${updated.sizeLabel || updated.sizeKey}`,
      );
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update entry');
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim(),
    }));
  };

  const resetFilters = () => {
    setFilters({ search: '', size: '', active: 'active' });
    setSearchInput('');
  };

  const statBlocks = [
    {
      label: 'Active assignments',
      value: summary?.active ?? 0,
      accent: 'text-green-600',
    },
    {
      label: 'Inactive assignments',
      value: summary?.inactive ?? 0,
      accent: 'text-red-600',
    },
    {
      label: 'Total rows',
      value: summary?.total ?? 0,
      accent: 'text-brand-blue',
    },
  ];

  const renderBooleanBadge = (value: boolean, yesLabel = 'YES', noLabel = 'NO') => (
    <span
      className={clsx(
        'inline-flex min-w-[64px] items-center justify-center rounded-full px-2 py-1 text-xs font-semibold',
        value ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
      )}
    >
      {value ? yesLabel : noLabel}
    </span>
  );

  const renderAvailability = (entry: ListBySizeEntry) => {
    const isAvailable = entry.optionUnavailable ? false : (entry.optionActualInventory ?? 0) > 0 || (entry.inventoryQuantity ?? 0) > 0;
    return renderBooleanBadge(isAvailable, 'Available', 'Unavailable');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'List by Size', href: '/admin/list-by-size' },
        ]}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <Ruler className="h-8 w-8 text-brand-orange" aria-hidden="true" />
            List by Size Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Curate and audit size-specific merchandising rows for the customer-facing size lookup experience.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => resetFilters()}
            aria-label="Reset filters"
          >
            Reset Filters
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            aria-label="Refresh list"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
        >
          {toast}
        </div>
      )}

      {error && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {statBlocks.map((stat) => (
          <Card key={stat.label} className="px-4 py-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={clsx('text-2xl font-semibold', stat.accent)}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 border-b border-gray-200 p-4 dark:border-gray-700 md:grid-cols-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2">
            <label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search products, SKUs, or sizes
            </label>
            <div className="flex rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-brand-orange dark:border-gray-700 dark:bg-gray-900">
              <span className="flex items-center px-3 text-gray-500">
                <Search className="h-4 w-4" aria-hidden="true" />
              </span>
              <input
                id="search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-r-lg border-0 bg-transparent py-2 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
                placeholder="e.g. 16x25x1 or FF-1625"
              />
              <Button type="submit" variant="ghost" size="sm" className="rounded-l-none">
                Apply
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <label htmlFor="sizeFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Size
            </label>
            <select
              id="sizeFilter"
              value={filters.size}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  size: event.target.value,
                }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All sizes</option>
              {sizeOptions.map((size) => (
                <option key={size.sizeKey} value={size.sizeKey}>
                  {size.sizeLabel} ({size.active}/{size.total})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as ActiveFilter[]).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={filters.active === value ? 'primary' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      active: value,
                    }))
                  }
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-orange" aria-hidden="true" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading size assignments...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Layers className="mx-auto mb-4 h-10 w-10 text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">No assignments found</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Adjust your filters or create entries through product merchandising workflows.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700" role="table">
              <caption className="sr-only">List by size merchandising assignments</caption>
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    ID / Product / Option
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    Brand
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    Size
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    Rating
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Ignore Stock
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Dropship
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Stock (Parent)
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actual (Option)
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Pack Size
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Available
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Active
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={clsx(
                      'transition-colors',
                      entry.sizeActive ? 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800' : 'bg-gray-50/70 dark:bg-gray-800/60',
                    )}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-gray-900 dark:text-white">{entry.id}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Product:{' '}
                        {entry.productId ? (
                          <Link
                            href={`/admin/products/${entry.productId}`}
                            className="text-brand-orange hover:underline"
                          >
                            {entry.productSku || entry.productId}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Option:{' '}
                        {entry.optionId ? (
                          <>
                            <span className="font-medium">{entry.optionId}</span>
                            {entry.optionDescrip ? ` – ${entry.optionDescrip}` : null}
                          </>
                        ) : (
                          'None'
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-gray-800 dark:text-gray-200">
                      <div className="font-semibold">{entry.brand || '—'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{entry.productName || 'Unnamed product'}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{entry.sizeLabel}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{entry.sizeKey}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-gray-800 dark:text-gray-200">
                      <div>{entry.ratingLabel || '—'}</div>
                      <div className="text-xs uppercase text-gray-500 dark:text-gray-400">{entry.quality}</div>
                    </td>
                    <td className="px-4 py-4 text-right align-top">{renderBooleanBadge(!entry.trackInventory)}</td>
                    <td className="px-4 py-4 text-right align-top">{renderBooleanBadge(entry.optionDropShip)}</td>
                    <td className="px-4 py-4 text-right align-top text-gray-900 dark:text-gray-100">
                      {entry.inventoryQuantity ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-right align-top text-gray-900 dark:text-gray-100">
                      {entry.optionActualInventory ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-right align-top text-gray-900 dark:text-gray-100">
                      {entry.packSize || '—'}
                    </td>
                    <td className="px-4 py-4 text-center align-top">{renderAvailability(entry)}</td>
                    <td className="px-4 py-4 text-center align-top">
                      {renderBooleanBadge(entry.sizeActive, 'Active', 'Inactive')}
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(entry)}
                          aria-label={`Toggle active status for entry ${entry.id}`}
                        >
                          {entry.sizeActive ? (
                            <ToggleLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ToggleRight className="mr-2 h-4 w-4" aria-hidden="true" />
                          )}
                          Toggle
                        </Button>
                        <Link
                          href={`/filters/size?size=${encodeURIComponent(entry.sizeKey)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded border border-transparent px-3 py-2 text-sm font-medium text-brand-orange hover:text-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                        >
                          <ArrowUpRight className="mr-1 h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

