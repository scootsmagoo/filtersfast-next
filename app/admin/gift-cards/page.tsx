'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/cart-utils';
import clsx from 'clsx';

interface GiftCardRecord {
  id: string;
  code: string;
  initial_value: number;
  balance: number;
  currency: string;
  status: string;
  recipient_name?: string | null;
  recipient_email?: string | null;
  purchaser_name?: string | null;
  purchaser_email?: string | null;
  order_id?: string | null;
  order_item_id?: string | null;
  send_at?: number | null;
  issued_at?: number | null;
  delivered_at?: number | null;
  updated_at: number;
  created_at: number;
}

interface GiftCardResponse {
  success: boolean;
  giftCards: GiftCardRecord[];
  total: number;
  limit: number;
  offset: number;
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  pending: 'Scheduled',
  partially_redeemed: 'Partially Redeemed',
  redeemed: 'Redeemed',
  void: 'Voided',
};

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  partially_redeemed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  redeemed: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  void: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

export default function GiftCardsAdminPage() {
  const [giftCards, setGiftCards] = useState<GiftCardRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchGiftCards = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'all') params.append('status', statusFilter);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    try {
      const response = await fetch(`/api/admin/gift-cards?${params.toString()}`);
      const data = (await response.json()) as GiftCardResponse;
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to load gift cards');
      }

      setGiftCards(data.giftCards);
      setTotal(data.total);
      setLimit(data.limit);
      setOffset(data.offset);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load gift cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  const handleAdjustBalance = async (id: string) => {
    const input = window.prompt('Enter adjustment amount (positive to credit, negative to debit):');
    if (!input) return;

    const amount = Number(input);
    if (!Number.isFinite(amount) || amount === 0) {
      alert('Enter a valid non-zero amount.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/gift-cards?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Adjustment failed');
      }

      setGiftCards((prev) =>
        prev.map((card) => (card.id === id ? { ...card, balance: data.giftCard.balance } : card))
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to adjust gift card');
    }
  };

  const handleStatusUpdate = async (card: GiftCardRecord, action: 'void' | 'reactivate') => {
    try {
      const payload: Record<string, unknown> = { action, id: card.id };
      if (action === 'reactivate') {
        const amountStr = window.prompt('Enter starting balance for reactivated gift card:', '0');
        if (!amountStr) return;
        const amount = Number(amountStr);
        if (!Number.isFinite(amount) || amount <= 0) {
          alert('Enter a positive amount.');
          return;
        }
        payload.balance = amount;
      }

      const response = await fetch('/api/admin/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to update gift card status');
      }

      setGiftCards((prev) =>
        prev.map((item) => (item.id === card.id ? { ...item, ...data.giftCard } : item))
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to update gift card');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
            Gift Cards
          </h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">
            Manage digital gift card issuance, balances, and status.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Search by code or email
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="e.g. AB12-CD34-EF56 or name@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Scheduled</option>
                <option value="partially_redeemed">Partially redeemed</option>
                <option value="redeemed">Redeemed</option>
                <option value="void">Voided</option>
              </select>
            </div>

            <div className="flex items-end gap-3">
              <Button
                onClick={() => {
                  setOffset(0);
                  fetchGiftCards();
                }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setOffset(0);
                  fetchGiftCards();
                }}
                disabled={loading}
              >
                Reset
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300 transition-colors">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {giftCards.map((card) => (
                  <tr key={card.id}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100 uppercase">
                      {card.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      <div className="font-semibold">
                        {formatPrice(card.balance)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Issued {formatPrice(card.initial_value)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div>{card.recipient_name || '—'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {card.recipient_email || 'Not provided'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={clsx(
                          'inline-flex px-2 py-1 rounded-full text-xs font-semibold',
                          statusStyles[card.status] || statusStyles.active
                        )}
                      >
                        {statusLabels[card.status] || card.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(card.updated_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAdjustBalance(card.id)}
                        disabled={loading}
                      >
                        Adjust Balance
                      </Button>
                      {card.status !== 'void' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusUpdate(card, 'void')}
                          disabled={loading}
                        >
                          Void
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusUpdate(card, 'reactivate')}
                          disabled={loading}
                        >
                          Reactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && giftCards.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No gift cards found. Adjust your filters and try again.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {giftCards.length} of {total} gift cards
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {Math.floor(offset / limit) + 1} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOffset(Math.min(offset + limit, (totalPages - 1) * limit))}
                disabled={offset + limit >= total || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

