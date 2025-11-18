'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { Star, Search, Plus, Minus, History } from 'lucide-react';

interface LoyaltyAccount {
  id: string;
  customerEmail: string;
  pointsBalance: number;
  lifetimePoints: number;
  tierLevel: number;
  tierName: string;
  lastActivityAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  orderId: string | null;
  orderNumber: string | null;
  description: string | null;
  performedBy: string | null;
  createdAt: number;
}

export default function LoyaltyAccountsPage() {
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setAccount(null);
    setTransactions([]);

    try {
      const response = await fetch(`/api/admin/loyalty/accounts?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to load account');
      }

      setAccount(data.account);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (points: number) => {
    if (!account || !email.trim()) return;

    const description = window.prompt('Enter description for this adjustment:');
    if (description === null) return;

    setAdjusting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/loyalty/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          points,
          description,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to adjust points');
      }

      // Reload account data
      await handleSearch();
      alert(`Points adjusted successfully. New balance: ${data.transaction.balanceAfter}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to adjust points');
    } finally {
      setAdjusting(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      earned: 'Earned',
      redeemed: 'Redeemed',
      expired: 'Expired',
      adjusted: 'Adjusted',
      refunded: 'Refunded',
      bonus: 'Bonus',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      earned: 'text-green-600 dark:text-green-400',
      redeemed: 'text-red-600 dark:text-red-400',
      expired: 'text-gray-600 dark:text-gray-400',
      adjusted: 'text-blue-600 dark:text-blue-400',
      refunded: 'text-yellow-600 dark:text-yellow-400',
      bonus: 'text-purple-600 dark:text-purple-400',
    };
    return colors[type] || 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AdminBreadcrumb />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors">
          <Star className="w-8 h-8 text-brand-orange" aria-hidden="true" />
          Loyalty Accounts
        </h1>
        <p className="text-gray-600 dark:text-gray-300 transition-colors">
          Search for customer loyalty accounts and manage points.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="customer@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
      </Card>

      {account && (
        <>
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Account Details
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAdjust(100)}
                  disabled={adjusting}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  +100
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAdjust(-100)}
                  disabled={adjusting}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  -100
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const points = window.prompt('Enter points to adjust (positive to add, negative to subtract):');
                    if (points) {
                      const pointsNum = parseInt(points);
                      if (!isNaN(pointsNum)) {
                        handleAdjust(pointsNum);
                      }
                    }
                  }}
                  disabled={adjusting}
                >
                  Custom
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {account.customerEmail}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Points Balance</p>
                <p className="text-2xl font-bold text-brand-orange">
                  {account.pointsBalance.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lifetime Points</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {account.lifetimePoints.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tier</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {account.tierName} (Level {account.tierLevel})
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Activity</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {account.lastActivityAt
                    ? new Date(account.lastActivityAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Created</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(account.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {transactions.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Transaction History
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Points
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Balance After
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Order
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(txn.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${getTransactionTypeColor(txn.type)}`}>
                            {getTransactionTypeLabel(txn.type)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {txn.points > 0 ? '+' : ''}
                          {txn.points.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                          {txn.balanceAfter.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {txn.description || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {txn.orderNumber || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

