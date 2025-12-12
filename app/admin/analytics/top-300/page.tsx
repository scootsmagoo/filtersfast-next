'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import Button from '@/components/ui/Button';
import { formatCurrency, formatNumber } from '@/lib/analytics-utils';
import { AlertTriangle, CheckCircle2, Download, ListOrdered, RefreshCw } from 'lucide-react';

type ReportRow = {
  productId: string;
  productName: string;
  sku: string;
  variantId: string | null;
  optionDescription: string | null;
  quantitySold: number;
  revenue: number;
  stock: number;
  ignoreStock: boolean;
  flagStock: string;
};

type ReportMeta = {
  days: number;
  limit: number;
  startDate: string;
  endDate: string;
};

const DAY_OPTIONS = [7, 14, 30];
const LIMIT_OPTIONS = [100, 200, 300, 350];

export default function Top300ReportPage() {
  const [days, setDays] = useState(7);
  const [limit, setLimit] = useState(300);
  const [report, setReport] = useState<ReportRow[]>([]);
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Loading top 300 products...');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchReport() {
      setLoading(true);
      setError(null);
      setStatusMessage('Loading top products report...');

      try {
        const response = await fetch(`/api/admin/analytics/top-300?days=${days}&limit=${limit}&_=${refreshKey}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to load report');
        }

        const data = await response.json();

        if (cancelled) return;

        setReport(data.report || []);
        setMeta(data.meta || null);
        setStatusMessage('Top 300 products report ready');
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch top 300 report', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setStatusMessage('Failed to load top 300 products report');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [days, limit, refreshKey]);

  const totalQuantity = useMemo(
    () => report.reduce((sum, row) => sum + (row.quantitySold || 0), 0),
    [report]
  );

  const totalRevenue = useMemo(
    () => report.reduce((sum, row) => sum + (row.revenue || 0), 0),
    [report]
  );

  const formatCsvCell = (value: unknown) => {
    const stringValue = String(value ?? '').replace(/\r?\n/g, ' ').trim();
    const guarded =
      stringValue.length > 0 && /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;

    return guarded.includes(',') || guarded.includes('"')
      ? `"${guarded.replace(/"/g, '""')}"`
      : guarded;
  };

  const handleExportCsv = () => {
    if (report.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Rank',
      'SKU',
      'Product ID',
      'Product Name',
      'Option ID',
      'Option Description',
      'Quantity Sold',
      'Revenue',
      'Stock',
      'Ignore Stock',
      'Stock Flag',
    ];

    const rows = report.map((row, index) => [
      index + 1,
      row.sku,
      row.productId,
      row.productName,
      row.variantId ?? '',
      row.optionDescription ?? '',
      row.quantitySold,
      row.revenue,
      row.stock,
      row.ignoreStock ? 'Yes' : 'No',
      row.flagStock,
    ]);

    const csv = [headers, ...rows]
      .map((line) => line.map(formatCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `top-products-${days}d-${limit}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderStatusBadge = (row: ReportRow) => {
    if (row.flagStock === 'Out of stock') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
          <AlertTriangle className="h-3 w-3" />
          Out of stock
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        In stock
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        <AdminBreadcrumb
          items={[
            { label: 'Analytics', href: '/admin/analytics' },
            { label: 'Top 300 Products', href: '/admin/analytics/top-300', icon: ListOrdered },
          ]}
        />
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Top 300 Products Report</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Legacy `top300.asp` parity report showing the highest velocity SKUs over the selected window.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleRefresh} aria-label="Refresh report">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="secondary" onClick={handleExportCsv} aria-label="Export report as CSV">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800 lg:grid-cols-3">
          <div>
            <label htmlFor="days-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time window
            </label>
            <select
              id="days-select"
              value={days}
              onChange={(event) => setDays(parseInt(event.target.value, 10))}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="limit-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Result limit
            </label>
            <select
              id="limit-select"
              value={limit}
              onChange={(event) => setLimit(parseInt(event.target.value, 10))}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Top {option}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-900 dark:text-white">Summary</p>
            <p className="mt-1">
              Range:{' '}
              {meta
                ? `${new Date(meta.startDate).toLocaleDateString()} – ${new Date(meta.endDate).toLocaleDateString()}`
                : '—'}
            </p>
            <p>Total items: {formatNumber(report.length)}</p>
            <p>Units sold: {formatNumber(totalQuantity)}</p>
            <p>Revenue: {formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-lg bg-white p-12 shadow dark:bg-gray-800">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-orange" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Crunching sales data…</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Rank
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      SKU / Product ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Product / Option
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Qty Sold
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Revenue
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Stock
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Ignore Stock
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {report.map((row, index) => {
                    const isTopTen = index < 10;

                    return (
                      <tr
                        key={`${row.productId}-${row.variantId ?? 'base'}`}
                        className={isTopTen ? 'bg-orange-50/40 dark:bg-orange-500/5' : undefined}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          <span aria-label={`Rank ${index + 1}`}>#{index + 1}</span>
                          {isTopTen && (
                            <span className="ml-2 rounded-full bg-brand-orange/10 px-2 py-0.5 text-xs font-medium text-brand-orange">
                              Top 10
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-mono text-xs uppercase text-gray-500 dark:text-gray-400">{row.sku}</div>
                        <div className="text-gray-900 dark:text-gray-100">{row.productId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-semibold">{row.productName}</div>
                        {row.optionDescription && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Option: {row.optionDescription} {row.variantId ? `(${row.variantId})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatNumber(row.quantitySold)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {formatNumber(row.stock)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {row.ignoreStock ? 'Yes' : 'No'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{renderStatusBadge(row)}</td>
                      </tr>
                    );
                  })}
                  {report.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No products meet the criteria for this window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


