'use client';

import { useState, useEffect } from 'react';
import { Star, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

interface LoyaltyPointsRedeemProps {
  cartTotal: number;
  onPointsRedeemed: (points: number, discountAmount: number) => void;
  onPointsRemoved: () => void;
  appliedPoints?: number;
  appliedDiscount?: number;
}

export default function LoyaltyPointsRedeem({
  cartTotal,
  onPointsRedeemed,
  onPointsRemoved,
  appliedPoints,
  appliedDiscount,
}: LoyaltyPointsRedeemProps) {
  const { data: session } = useSession();
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      loadBalance();
    } else {
      setLoadingBalance(false);
    }
  }, [session]);

  const loadBalance = async () => {
    if (!session?.user?.email) return;

    setLoadingBalance(true);
    try {
      const response = await fetch('/api/loyalty/balance');
      const data = await response.json();

      if (data.success && data.account) {
        setPointsBalance(data.account.pointsBalance);
      }
    } catch (err) {
      console.error('Error loading loyalty balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleRedeem = async () => {
    if (!session?.user?.email) {
      setError('Please sign in to redeem loyalty points');
      return;
    }

    const points = parseInt(pointsToRedeem);
    if (!points || points <= 0) {
      setError('Please enter a valid number of points');
      return;
    }

    if (pointsBalance !== null && points > pointsBalance) {
      setError(`You only have ${pointsBalance.toLocaleString()} points available`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const discountAmount = data.transaction.discountAmount || points / 100;
        onPointsRedeemed(points, discountAmount);
        setPointsToRedeem('');
        setError(null);
        // Reload balance
        await loadBalance();
      } else {
        setError(data.error || 'Failed to redeem points');
      }
    } catch (err) {
      console.error('Error redeeming loyalty points:', err);
      setError('Failed to redeem points. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPointsToRedeem('');
    setError(null);
    onPointsRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRedeem();
    }
  };

  // Don't show if user is not signed in
  if (!session?.user?.email) {
    return null;
  }

  // Don't show if loading balance
  if (loadingBalance) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Loyalty Points
        </label>
        <div className="flex items-center gap-2 text-sm text-gray-500" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Loading points balance...</span>
        </div>
      </div>
    );
  }

  // Don't show if no points available
  if (pointsBalance === null || pointsBalance < 100) {
    return null;
  }

  // If points are already applied, show success state
  if (appliedPoints && appliedDiscount) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                {appliedPoints.toLocaleString()} points applied
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                ${appliedDiscount.toFixed(2)} discount applied
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1"
            aria-label="Remove loyalty points discount"
            type="button"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="loyalty-points" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Redeem Loyalty Points
      </label>
      
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-4 h-4 text-brand-orange" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          You have {pointsBalance?.toLocaleString()} points available
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="loyalty-points" className="sr-only">
            Enter points to redeem
          </label>
          <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            id="loyalty-points"
            type="number"
            min="100"
            step="100"
            max={pointsBalance || undefined}
            value={pointsToRedeem}
            onChange={(e) => {
              setPointsToRedeem(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter points (min 100)"
            className="input-field pl-10 w-full"
            disabled={loading}
            aria-describedby={error ? 'loyalty-error' : undefined}
            aria-invalid={error ? 'true' : 'false'}
            aria-required="false"
          />
        </div>
        
        <button
          onClick={handleRedeem}
          disabled={loading || !pointsToRedeem || parseInt(pointsToRedeem) < 100}
          className="btn-secondary min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={loading ? 'Redeeming points...' : 'Redeem loyalty points'}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mx-auto" aria-hidden="true" />
              <span className="sr-only">Redeeming points...</span>
            </>
          ) : (
            'Redeem'
          )}
        </button>
      </div>

      {pointsToRedeem && parseInt(pointsToRedeem) >= 100 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ${((parseInt(pointsToRedeem) || 0) / 100).toFixed(2)} discount will be applied
        </p>
      )}

      {error && (
        <div 
          id="loyalty-error"
          className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        100 points = $1.00 discount. Minimum 100 points to redeem.
      </p>
    </div>
  );
}

