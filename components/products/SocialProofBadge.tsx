'use client';

import { useState, useEffect } from 'react';
import { Users, ShoppingCart, Eye } from 'lucide-react';

interface SocialProofData {
  enabled: boolean;
  recentViews: number;
  uniqueViewers: number;
  recentPurchases: number;
  totalQuantityPurchased: number;
}

interface SocialProofBadgeProps {
  productId: string;
  variant?: 'default' | 'compact' | 'minimal';
  showViews?: boolean;
  showPurchases?: boolean;
  className?: string;
}

/**
 * SocialProofBadge Component
 * Displays real-time social proof indicators (views, purchases)
 */
export default function SocialProofBadge({
  productId,
  variant = 'default',
  showViews = true,
  showPurchases = true,
  className = '',
}: SocialProofBadgeProps) {
  const [data, setData] = useState<SocialProofData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchSocialProof = async () => {
      try {
        const response = await fetch(`/api/social-proof/${encodeURIComponent(productId)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch social proof data');
        }
        
        const result = await response.json();
        
        if (mounted) {
          setData(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchSocialProof();

    // Refresh every 30 seconds
    intervalId = setInterval(fetchSocialProof, 30000);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [productId]);

  // Don't render if disabled, loading, or error
  if (isLoading || error || !data || !data.enabled) {
    return null;
  }

  const hasViews = showViews && data.recentViews > 0;
  const hasPurchases = showPurchases && data.recentPurchases > 0;

  // Don't render if no data to show
  if (!hasViews && !hasPurchases) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div 
        className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Social proof indicators"
      >
        {hasViews && (
          <span className="flex items-center gap-1" aria-label={`${data.recentViews} ${data.recentViews === 1 ? 'person is' : 'people are'} currently viewing this product`}>
            <Eye className="h-3 w-3" aria-hidden="true" />
            <span>{data.recentViews} viewing</span>
          </span>
        )}
        {hasPurchases && (
          <span className="flex items-center gap-1" aria-label={`${data.recentPurchases} ${data.recentPurchases === 1 ? 'person bought' : 'people bought'} this product in the last hour`}>
            <ShoppingCart className="h-3 w-3" aria-hidden="true" />
            <span>{data.recentPurchases} bought</span>
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className={`flex flex-wrap items-center gap-2 ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Social proof indicators"
      >
        {hasViews && (
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-700 dark:text-blue-300"
            aria-label={`${data.recentViews} ${data.recentViews === 1 ? 'person is' : 'people are'} currently viewing this product`}
          >
            <Eye className="h-3 w-3" aria-hidden="true" />
            <span>{data.recentViews} viewing now</span>
          </div>
        )}
        {hasPurchases && (
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md text-xs text-green-700 dark:text-green-300"
            aria-label={`${data.recentPurchases} ${data.recentPurchases === 1 ? 'person bought' : 'people bought'} this product in the last hour`}
          >
            <ShoppingCart className="h-3 w-3" aria-hidden="true" />
            <span>{data.recentPurchases} bought in last hour</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <section 
      className={`space-y-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Social proof indicators"
    >
      {hasViews && (
        <div 
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          role="group"
          aria-label={`Viewing activity: ${data.recentViews} ${data.recentViews === 1 ? 'person is' : 'people are'} currently viewing this product`}
        >
          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {data.recentViews} {data.recentViews === 1 ? 'person is' : 'people are'} viewing this
            </div>
            {data.uniqueViewers > data.recentViews && (
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {data.uniqueViewers} unique viewers
              </div>
            )}
          </div>
        </div>
      )}
      
      {hasPurchases && (
        <div 
          className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          role="group"
          aria-label={`Purchase activity: ${data.recentPurchases} ${data.recentPurchases === 1 ? 'person bought' : 'people bought'} this product in the last hour`}
        >
          <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-900 dark:text-green-100">
              {data.recentPurchases} {data.recentPurchases === 1 ? 'person bought' : 'people bought'} this
            </div>
            {data.totalQuantityPurchased > data.recentPurchases && (
              <div className="text-xs text-green-700 dark:text-green-300">
                {data.totalQuantityPurchased} total items purchased in the last hour
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

