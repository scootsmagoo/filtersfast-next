/**
 * ProductReviews Component
 * 
 * Main component for displaying product reviews with summary and list
 */

'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';
import ReviewStars from './ReviewStars';
import ReviewCard from './ReviewCard';
import { getTrustpilotProfileUrl } from '@/lib/trustpilot-config';
import type { ProductReviewsData } from '@/lib/types/reviews';

interface ProductReviewsProps {
  productId: string;
  productName: string;
  productSku?: string;
}

export default function ProductReviews({
  productId,
  productName,
  productSku,
}: ProductReviewsProps) {
  const [reviewsData, setReviewsData] = useState<ProductReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    fetchReviews(currentPage);
  }, [productId, currentPage]);

  const fetchReviews = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      // Use product SKU if provided, otherwise use product ID
      const identifier = productSku || productId;
      const response = await fetch(`/api/reviews/${encodeURIComponent(identifier)}?page=${page}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviewsData(data);
      setIsConfigured(data.configured !== false);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Unable to load reviews at this time.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  // Loading state
  if (loading && !reviewsData) {
    return (
      <div className="py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchReviews(currentPage)}
          className="text-brand-orange hover:text-brand-orange-dark font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Not configured - show Trustpilot widget fallback
  if (!isConfigured || !reviewsData) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            See what our customers are saying about us on Trustpilot
          </p>
          <a
            href={getTrustpilotProfileUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark font-medium"
          >
            View Reviews on Trustpilot
            <ExternalLink className="w-4 h-4" />
          </a>
          {/* Trustpilot Widget Script */}
          <div className="mt-6">
            <div
              className="trustpilot-widget"
              data-locale="en-US"
              data-template-id="53aa8912dec7e10d38f59f36"
              data-businessunit-id="47783f490000640005020cf6"
              data-style-height="140px"
              data-style-width="100%"
              data-theme="light"
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const { reviews, summary, hasMore } = reviewsData;
  const hasReviews = reviews.length > 0;

  return (
    <section className="py-12" id="reviews">
      {/* Reviews Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <a
          href={getTrustpilotProfileUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-orange transition-colors"
          aria-label="View all reviews on Trustpilot (opens in new window)"
        >
          <img
            src="/images/trustpilot-logo.svg"
            alt="Trustpilot"
            className="h-6"
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
          <span>Powered by Trustpilot</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Review Summary */}
      {summary && summary.totalReviews > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Average Rating */}
            <div className="flex-shrink-0 text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {summary.averageRating.toFixed(1)}
              </div>
              <ReviewStars rating={summary.averageRating} size="lg" />
              <p className="text-sm text-gray-600 mt-2">
                Based on {summary.totalReviews.toLocaleString()} review
                {summary.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 w-full">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.distribution[stars as 1 | 2 | 3 | 4 | 5];
                const percentage =
                  summary.totalReviews > 0
                    ? (count / summary.totalReviews) * 100
                    : 0;

                return (
                  <div
                    key={stars}
                    className="flex items-center gap-3 mb-2"
                  >
                    <span className="text-sm text-gray-600 w-8">
                      {stars} ★
                    </span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange transition-all"
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${stars} star: ${percentage.toFixed(0)}%`}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {hasReviews ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              productName={undefined} // Only show on comparison pages
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-brand-orange text-brand-orange rounded-lg hover:bg-brand-orange hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Reviews
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            No reviews yet for this product.
          </p>
          <p className="text-sm text-gray-500">
            Be the first to review this product!
          </p>
        </div>
      )}
    </section>
  );
}

