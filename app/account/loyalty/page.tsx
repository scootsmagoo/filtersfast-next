'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Star, Award, TrendingUp, History, Gift, Loader2 } from 'lucide-react';

interface LoyaltyAccount {
  pointsBalance: number;
  lifetimePoints: number;
  tierLevel: number;
  tierName: string;
  lastActivityAt: number | null;
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  orderId: string | null;
  orderNumber: string | null;
  description: string | null;
  createdAt: number;
}

export default function LoyaltyPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.user?.email) {
      setError('Please sign in to view your loyalty points');
      setLoading(false);
      return;
    }

    loadLoyaltyData();
  }, [session, sessionLoading]);

  const loadLoyaltyData = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError('');

    try {
      const [balanceRes, historyRes] = await Promise.all([
        fetch('/api/loyalty/balance'),
        fetch('/api/loyalty/history'),
      ]);

      const balanceData = await balanceRes.json();
      const historyData = await historyRes.json();

      if (!balanceRes.ok || !balanceData.success) {
        throw new Error(balanceData?.error || 'Failed to load loyalty balance');
      }
      if (!historyRes.ok || !historyData.success) {
        throw new Error(historyData?.error || 'Failed to load transaction history');
      }

      setAccount(balanceData.account);
      setTransactions(historyData.transactions || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load loyalty data');
    } finally {
      setLoading(false);
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

  const getTierColor = (tierLevel: number) => {
    const colors: Record<number, string> = {
      1: 'text-amber-600 dark:text-amber-400',
      2: 'text-gray-400 dark:text-gray-500',
      3: 'text-yellow-500 dark:text-yellow-400',
      4: 'text-purple-600 dark:text-purple-400',
    };
    return colors[tierLevel] || 'text-gray-600 dark:text-gray-400';
  };

  if (sessionLoading || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" aria-hidden="true" />
          <span className="sr-only">Loading loyalty program data...</span>
        </div>
      </div>
    );
  }

  if (error && !account) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Card className="p-6">
          <div className="text-center">
            <div role="alert" aria-live="polite" className="text-red-600 dark:text-red-400 mb-4">
              {error}
            </div>
            <Button onClick={() => window.location.href = '/sign-in'}>
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3 transition-colors">
          <Star className="w-8 h-8 text-brand-orange" aria-hidden="true" />
          Loyalty Program
        </h1>
        <p className="text-gray-600 dark:text-gray-300 transition-colors">
          Earn points with every purchase and redeem them for discounts!
        </p>
      </div>

      {account && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 border-brand-orange/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Points Balance</p>
                  <p className="text-4xl font-bold text-brand-orange">
                    {account.pointsBalance.toLocaleString()}
                  </p>
                </div>
                <Star className="w-12 h-12 text-brand-orange opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lifetime Points</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {account.lifetimePoints.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-gray-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Tier</p>
                  <p className={`text-2xl font-bold ${getTierColor(account.tierLevel)}`}>
                    {account.tierName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Level {account.tierLevel}
                  </p>
                </div>
                <Award className={`w-10 h-10 ${getTierColor(account.tierLevel)}`} />
              </div>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                How It Works
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Earn Points
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 1 point per dollar spent on purchases</li>
                  <li>• 50 points for product reviews</li>
                  <li>• 100 points for successful referrals</li>
                  <li>• 200 points on your birthday</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Redeem Points
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 100 points = $1.00 discount</li>
                  <li>• Minimum 100 points to redeem</li>
                  <li>• Use points at checkout</li>
                  <li>• Points never expire</li>
                </ul>
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
                <table className="w-full" role="table" aria-label="Loyalty points transaction history">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type
                      </th>
                      <th scope="col" className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Points
                      </th>
                      <th scope="col" className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Balance
                      </th>
                      <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
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
                          <time dateTime={new Date(txn.createdAt).toISOString()}>
                            {new Date(txn.createdAt).toLocaleString()}
                          </time>
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
                          {txn.orderNumber && (
                            <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                              (Order: {txn.orderNumber})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {transactions.length === 0 && (
            <Card className="p-12 text-center">
              <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No transactions yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start earning points by making a purchase!
              </p>
              <Button onClick={() => window.location.href = '/products'}>
                Shop Now
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

