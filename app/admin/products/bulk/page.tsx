'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type AdminProductListItem = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  status: string;
  price: number;
};

type BulkJob = {
  id: string;
  type: string;
  status: string;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  processedItems: number;
  failedItems: number;
  totalItems: number;
  summary: Record<string, any> | null;
};

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'out-of-stock', label: 'Out of Stock' }
];

interface PriceRow {
  productId: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
}

const jobTypeLabels: Record<string, string> = {
  'status-update': 'Status Update',
  'price-update': 'Price Update',
  'inventory-update': 'Inventory Update',
  'import-csv': 'CSV Import',
  'export-csv': 'CSV Export'
};

const jobStatusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

export default function ProductBulkToolingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminProductListItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<AdminProductListItem[]>([]);
  const [statusTarget, setStatusTarget] = useState('draft');
  const [statusNote, setStatusNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const [priceRows, setPriceRows] = useState<PriceRow[]>([
    { productId: '', price: '', compareAtPrice: '', costPrice: '' }
  ]);
  const [priceLoading, setPriceLoading] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    allowCreate: false,
    updateStatus: true,
    updatePricing: true,
    updateInventory: true
  });
  const [importLoading, setImportLoading] = useState(false);

  const [exportFilters, setExportFilters] = useState({
    status: '',
    brand: ''
  });
  const [exportLoading, setExportLoading] = useState(false);

  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const selectedProductIds = useMemo(() => new Set(selectedProducts.map((p) => p.id)), [selectedProducts]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 8000);
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await fetch('/api/admin/products/bulk/jobs?limit=20');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error(error);
      showToast('Failed to load job history', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs().catch(console.error);
  }, []);

  const searchProducts = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/admin/products?search=${encodeURIComponent(searchTerm.trim())}&limit=20`
      );
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (error) {
      console.error(error);
      showToast('Failed to search products', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddProduct = (product: AdminProductListItem) => {
    if (selectedProductIds.has(product.id)) return;
    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStatusSubmit = async () => {
    if (selectedProducts.length === 0) {
      showToast('Select at least one product', 'error');
      return;
    }

    setStatusLoading(true);
    try {
      const response = await fetch('/api/admin/products/bulk/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productIds: selectedProducts.map((p) => p.id),
          status: statusTarget,
          note: statusNote
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Bulk status update failed');
      }

      showToast('Bulk status update scheduled');
      setSelectedProducts([]);
      setStatusNote('');
      await fetchJobs();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Failed to schedule status update', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePriceSubmit = async () => {
    const payloadRows = priceRows
      .map((row) => ({
        productId: row.productId.trim(),
        price: row.price.trim(),
        compareAtPrice: row.compareAtPrice.trim(),
        costPrice: row.costPrice.trim()
      }))
      .filter((row) => row.productId);

    if (payloadRows.length === 0) {
      showToast('Add at least one product price row', 'error');
      return;
    }

    const updates = payloadRows.map((row) => {
      const update: Record<string, number | null | string> = { productId: row.productId };
      if (row.price !== '') update.price = parseFloat(row.price);
      if (row.compareAtPrice !== '') update.compareAtPrice = row.compareAtPrice === 'null' ? null : parseFloat(row.compareAtPrice);
      if (row.costPrice !== '') update.costPrice = row.costPrice === 'null' ? null : parseFloat(row.costPrice);
      return update;
    });

    setPriceLoading(true);
    try {
      const response = await fetch('/api/admin/products/bulk/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Bulk price update failed');
      }

      showToast('Bulk price update scheduled');
      setPriceRows([{ productId: '', price: '', compareAtPrice: '', costPrice: '' }]);
      await fetchJobs();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Failed to schedule price update', 'error');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      showToast('Choose a CSV file to import', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('allowCreate', String(importOptions.allowCreate));
    formData.append('updateStatus', String(importOptions.updateStatus));
    formData.append('updatePricing', String(importOptions.updatePricing));
    formData.append('updateInventory', String(importOptions.updateInventory));

    setImportLoading(true);
    try {
      const response = await fetch('/api/admin/products/bulk/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'CSV import failed');
      }

      showToast('CSV import scheduled');
      setImportFile(null);
      await fetchJobs();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Failed to schedule CSV import', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportSubmit = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/admin/products/bulk/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            status: exportFilters.status || undefined,
            brand: exportFilters.brand || undefined
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'CSV export failed');
      }

      showToast('CSV export job created');
      await fetchJobs();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Failed to schedule CSV export', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const formatSummary = (summary: Record<string, any> | null) => {
    if (!summary) return '—';
    return Object.entries(summary)
      .map(([key, value]) => {
        const formattedValue =
          value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
        return `${key}: ${formattedValue}`;
      })
      .join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                Product Bulk Tooling
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Perform large-scale product updates, imports, and exports.
              </p>
            </div>
            <Link href="/admin/products">
              <Button variant="secondary">Back to Products</Button>
            </Link>
          </div>
          {toastMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-md px-4 py-2 ${
                toastType === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {toastMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Bulk Status Update
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
                  Search products by SKU or name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="e.g. FF123"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                  <Button onClick={searchProducts} disabled={searchLoading}>
                    {searchLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleAddProduct(product)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.sku} · {product.brand} · {product.status}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProducts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                    Selected ({selectedProducts.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.sku} · {product.brand}
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => handleRemoveProduct(product.id)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
                    New Status
                  </label>
                  <select
                    value={statusTarget}
                    onChange={(event) => setStatusTarget(event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
                    Optional note
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    placeholder="Reason for update"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                </div>
              </div>

              <Button onClick={handleStatusSubmit} disabled={statusLoading}>
                {statusLoading ? 'Scheduling...' : 'Schedule Status Update'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Bulk Price Update
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add products with new pricing. Leave fields blank if you do not want to change that value.
              </p>
              <div className="space-y-3">
                {priceRows.map((row, index) => {
                  const productIdId = `price-row-${index}-product`
                  const priceId = `price-row-${index}-price`
                  const compareId = `price-row-${index}-compare`
                  const costId = `price-row-${index}-cost`

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                      <div className="flex flex-col">
                        <label htmlFor={productIdId} className="sr-only">
                          Product ID row {index + 1}
                        </label>
                        <input
                          id={productIdId}
                          type="text"
                          value={row.productId}
                          onChange={(event) => {
                            const value = event.target.value;
                            setPriceRows((prev) =>
                              prev.map((item, idx) => (idx === index ? { ...item, productId: value } : item))
                            );
                          }}
                          placeholder="Product ID"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor={priceId} className="sr-only">
                          Price row {index + 1}
                        </label>
                        <input
                          id={priceId}
                          type="number"
                          step="0.01"
                          value={row.price}
                          onChange={(event) => {
                            const value = event.target.value;
                            setPriceRows((prev) =>
                              prev.map((item, idx) => (idx === index ? { ...item, price: value } : item))
                            );
                          }}
                          placeholder="Price"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor={compareId} className="sr-only">
                          Compare-at price row {index + 1}
                        </label>
                        <input
                          id={compareId}
                          type="text"
                          value={row.compareAtPrice}
                          onChange={(event) => {
                            const value = event.target.value;
                            setPriceRows((prev) =>
                              prev.map((item, idx) => (idx === index ? { ...item, compareAtPrice: value } : item))
                            );
                          }}
                          placeholder="Compare at price"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label htmlFor={costId} className="sr-only">
                            Cost row {index + 1}
                          </label>
                          <input
                            id={costId}
                            type="text"
                            value={row.costPrice}
                            onChange={(event) => {
                              const value = event.target.value;
                              setPriceRows((prev) =>
                                prev.map((item, idx) => (idx === index ? { ...item, costPrice: value } : item))
                              );
                            }}
                            placeholder="Cost"
                            className="px-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setPriceRows((prev) => prev.filter((_, idx) => idx !== index))
                          }
                          aria-label={`Remove price row ${index + 1}`}
                          disabled={priceRows.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setPriceRows((prev) => [...prev, { productId: '', price: '', compareAtPrice: '', costPrice: '' }])
                  }
                >
                  Add Row
                </Button>
                <Button onClick={handlePriceSubmit} disabled={priceLoading}>
                  {priceLoading ? 'Scheduling...' : 'Schedule Price Update'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              CSV Import
            </h2>
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-orange/90 file:text-white hover:file:bg-brand-orange cursor-pointer"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.allowCreate}
                    onChange={(event) =>
                      setImportOptions((prev) => ({ ...prev, allowCreate: event.target.checked }))
                    }
                  />
                  Allow creating missing products (not yet supported)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.updateStatus}
                    onChange={(event) =>
                      setImportOptions((prev) => ({ ...prev, updateStatus: event.target.checked }))
                    }
                  />
                  Update status
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.updatePricing}
                    onChange={(event) =>
                      setImportOptions((prev) => ({ ...prev, updatePricing: event.target.checked }))
                    }
                  />
                  Update pricing
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importOptions.updateInventory}
                    onChange={(event) =>
                      setImportOptions((prev) => ({ ...prev, updateInventory: event.target.checked }))
                    }
                  />
                  Update inventory
                </label>
              </div>
              <Button onClick={handleImportSubmit} disabled={importLoading}>
                {importLoading ? 'Scheduling...' : 'Upload CSV'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              CSV Export
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
                    Status
                  </label>
                  <select
                    value={exportFilters.status}
                    onChange={(event) => setExportFilters((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  >
                    <option value="">All</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
                    Brand Contains
                  </label>
                  <input
                    type="text"
                    value={exportFilters.brand}
                    onChange={(event) => setExportFilters((prev) => ({ ...prev, brand: event.target.value }))}
                    placeholder="Optional brand filter"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                </div>
              </div>
              <Button onClick={handleExportSubmit} disabled={exportLoading}>
                {exportLoading ? 'Scheduling...' : 'Generate Export'}
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
              Background Jobs
            </h2>
            <Button variant="secondary" onClick={fetchJobs} disabled={jobsLoading}>
              {jobsLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No recent bulk jobs. Schedule an action above to get started.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium">
                          {jobTypeLabels[job.type] ?? job.type}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{job.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            job.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : job.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {jobStatusLabels[job.status] ?? job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {dateFormatter.format(new Date(job.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {formatSummary(job.summary)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.type === 'export-csv' && job.status === 'completed' ? (
                          <Link
                            href={`/api/admin/products/bulk/jobs/${job.id}/download`}
                            className="text-brand-orange hover:text-brand-orange/80 font-medium"
                          >
                            Download
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

