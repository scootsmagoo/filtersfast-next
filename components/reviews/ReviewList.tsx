/**
 * Review List Component
 * Displays a list of reviews with pagination
 */

'use client';

import { useState } from 'react';
import { TrustPilotReview } from '@/lib/trustpilot/client';
import ReviewCard from './ReviewCard';
import Button from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface ReviewListProps {
  initialReviews: TrustPilotReview[];
  productSku: string;
  productName?: string;
  totalReviews: number;
  showProductName?: boolean;
}

export default function ReviewList({
  initialReviews,
  productSku,
  productName,
  totalReviews,
  showProductName = false,
}: ReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialReviews.length < totalReviews);

  const loadMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/product/${encodeURIComponent(productSku)}?page=${page + 1}`);
      if (response.ok) {
        const data = await response.json();
        setReviews([...reviews, ...data.reviews]);
        setPage(page + 1);
        setHasMore(reviews.length + data.reviews.length < totalReviews);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          No reviews yet for {productName || 'this product'}.
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          Be the first to share your experience!
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="sr-only">
        Product Reviews
      </h2>

      {/* Review List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {reviews.map((review, index) => (
          <ReviewCard
            key={review.id || `review-${index}`}
            review={review}
            source={review.id ? 'trustpilot' : 'imported'}
            showProductName={showProductName}
            productName={productName}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="secondary"
            className="min-w-[200px]"
            aria-label={`Load more reviews (showing ${reviews.length} of ${totalReviews})`}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span aria-live="polite">Loading more reviews...</span>
              </>
            ) : (
              <>
                Load More Reviews ({reviews.length} of {totalReviews})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Review Count Info */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        Showing {reviews.length} of {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
      </p>
    </section>
  );
}
