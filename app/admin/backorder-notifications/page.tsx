'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Mail,
  Package,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type {
  BackorderMeta,
  BackorderNotification,
  BackorderSummary,
} from '@/lib/types/backorder';

interface ApiSummaryResponse {
  success: boolean;
  summaries?: BackorderSummary[];
  meta?: BackorderMeta;
  error?: string;
}

interface ApiRequestsResponse {
  success: boolean;
  requests?: BackorderNotification[];
  meta?: BackorderMeta;
  error?: string;
}

export default function AdminBackorderNotificationsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<BackorderSummary[]>([]);
  const [meta, setMeta] = useState<BackorderMeta>({ canComplete: false });

  const [selectedSummary, setSelectedSummary] = useState<BackorderSummary | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requests, setRequests] = useState<BackorderNotification[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/backorder-notifications');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      void fetchSummaries();
    }
  }, [session]);

  const fetchSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/backorder-notifications', {
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiSummaryResponse;
        throw new Error(data.error || 'Failed to load backorder notifications.');
      }

      const data = (await response.json()) as ApiSummaryResponse;
      setSummaries(data.summaries || []);
      if (data.meta) {
        setMeta(data.meta);
      }

      // If current selection no longer exists, clear it
      if (selectedSummary) {
        const stillExists = (data.summaries || []).some(
          (summary) =>
            summary.productId === selectedSummary.productId &&
            summary.optionId === selectedSummary.optionId
        );
        if (!stillExists) {
          setSelectedSummary(null);
          setRequests([]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load backorder notifications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (summary: BackorderSummary) => {
    setRequestsLoading(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const params = new URLSearchParams({ productId: summary.productId });
      if (summary.optionId) {
        params.set('optionId', summary.optionId);
      }

      const response = await fetch(`/api/admin/backorder-notifications?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiRequestsResponse;
        throw new Error(data.error || 'Failed to load requests.');
      }

      const data = (await response.json()) as ApiRequestsResponse;
      setRequests(data.requests || []);
      if (data.meta) {
        setMeta(data.meta);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to load requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSelectSummary = (summary: BackorderSummary) => {
    setSelectedSummary(summary);
    void fetchRequests(summary);
  };

  const handleCompleteRequest = async (requestId: number) => {
    setActionError(null);
    setActionMessage(null);

    try {
      const note =
        typeof window !== 'undefined'
          ? window.prompt('Add internal note (optional):', '')
          : null;

      const response = await fetch(`/api/admin/backorder-notifications/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete request.');
      }

      setActionMessage('Backorder request marked as completed.');
      await fetchSummaries();
      if (selectedSummary) {
        await fetchRequests(selectedSummary);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to complete request.');
    }
  };

  const totalOpen = useMemo(
    () => summaries.reduce((sum, summary) => sum + summary.openRequests, 0),
    [summaries]
  );

  const uniqueProducts = useMemo(
    () => new Set(summaries.map((summary) => summary.productId)).size,
    [summaries]
  );

  const readyCount = useMemo(
    () => summaries.filter((summary) => summary.readyForNotification).length,
    [summaries]
  );

  const awaitingStockCount = summaries.length - readyCount;

  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminBreadcrumb />
        <div className="animate-pulse space-y-4" aria-live="polite" aria-busy="true">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AdminBreadcrumb />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors">
          <Bell className="w-8 h-8 text-brand-orange" aria-hidden="true" />
          Backorder Notifications
        </h1>
        <p className="text-gray-600 dark:text-gray-300 transition-colors max-w-3xl">
          Monitor customer notify-me requests for out-of-stock products. When inventory is ready,
          mark requests as completed so we know notifications have been sent.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Button variant="secondary" size="sm" onClick={() => fetchSummaries()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        {actionMessage && (
          <span className="text-sm text-green-600 dark:text-green-400 transition-colors">
            {actionMessage}
          </span>
        )}
        {actionError && (
          <span className="text-sm text-red-600 dark:text-red-400 transition-colors">
            {actionError}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
          <p className="font-semibold">Unable to load backorder notifications.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <section aria-label="Backorder statistics" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                Open Requests
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                {totalOpen}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center transition-colors">
              <Mail className="w-6 h-6 text-brand-orange" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                Products Impacted
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                {uniqueProducts}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center transition-colors">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                Ready to Notify
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                {readyCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center transition-colors">
              <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                Awaiting Stock
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                {awaitingStockCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center transition-colors">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
              Backorder Queue
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
              Select a row to view individual requests
            </span>
          </div>

          {summaries.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-300 dark:text-green-700 mx-auto mb-4 transition-colors" />
              <p className="text-gray-600 dark:text-gray-400 transition-colors">
                No open backorder notifications 🎉
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 transition-colors">
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      Product
                    </th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      Option
                    </th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      Requests
                    </th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      Last Requested
                    </th>
                    <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      Ready?
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => {
                    const isSelected =
                      selectedSummary &&
                      selectedSummary.productId === summary.productId &&
                      selectedSummary.optionId === summary.optionId;

                    return (
                      <tr
                        key={`${summary.productId}-${summary.optionId ?? 'none'}`}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                        onClick={() => handleSelectSummary(summary)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectSummary(summary);
                          }
                        }}
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`View requests for ${summary.productName}${
                          summary.optionLabel ? ` option ${summary.optionLabel}` : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100 transition-colors">
                          <div className="font-medium">{summary.productName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {summary.productSku}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 transition-colors">
                          {summary.optionLabel ? summary.optionLabel : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100 transition-colors">
                          {summary.openRequests}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 transition-colors">
                          {new Date(summary.lastRequestedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {summary.readyForNotification ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              Awaiting Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-6">
          {selectedSummary ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand-orange" />
                    {selectedSummary.productName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                    SKU: {selectedSummary.productSku}
                    {selectedSummary.optionLabel && (
                      <> • Option: {selectedSummary.optionLabel}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                      selectedSummary.readyForNotification
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {selectedSummary.readyForNotification ? 'Ready' : 'Waiting on Stock'}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchRequests(selectedSummary)}
                    disabled={requestsLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {requestsLoading ? (
                <div className="py-16 text-center text-gray-600 dark:text-gray-400 transition-colors">
                  Loading requests…
                </div>
              ) : requests.length === 0 ? (
                <div className="py-16 text-center text-gray-600 dark:text-gray-400 transition-colors">
                  All requests for this product have been completed.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                            {request.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                            Requested {new Date(request.requestedAt).toLocaleString()}
                          </p>
                        </div>
                        {meta.canComplete && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCompleteRequest(request.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Completed
                          </Button>
                        )}
                      </div>
                      {!selectedSummary.readyForNotification && (
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 transition-colors flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          Waiting on inventory. Current stock:{' '}
                          {selectedSummary.optionId
                            ? selectedSummary.optionStock ?? 0
                            : selectedSummary.productInventoryQuantity}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                        <Clock className="w-4 h-4" />
                        First request: {new Date(selectedSummary.firstRequestedAt).toLocaleDateString()}
                        <span>•</span>
                        Total open: {selectedSummary.openRequests}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-400 transition-colors py-16">
              <Mail className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4 transition-colors" />
              <p>Select a product from the queue to view individual requests.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


