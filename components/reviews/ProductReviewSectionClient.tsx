/**
 * Product Review Section (Client-Side)
 * Fetches and displays reviews client-side for client components
 */

'use client';

import { useState, useEffect } from 'react';
import ReviewSummary from './ReviewSummary';
import ReviewList from './ReviewList';
import { TrustPilotReview } from '@/lib/trustpilot/client';
import { Loader2 } from 'lucide-react';

interface ProductReviewSectionClientProps {
  productSku: string;
  productName: string;
  initialReviewCount?: number;
}

export default function ProductReviewSectionClient({
  productSku,
  productName,
  initialReviewCount = 20,
}: ProductReviewSectionClientProps) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<TrustPilotReview[]>([]);
  const [summary, setSummary] = useState({
    totalReviews: 0,
    averageRating: 0,
    starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  useEffect(() => {
    fetchReviews();
  }, [productSku]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/product/${encodeURIComponent(productSku)}?perPage=${initialReviewCount}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setSummary(data.summary || {
          totalReviews: 0,
          averageRating: 0,
          starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin motion-reduce:animate-none text-brand-orange" aria-hidden="true" />
          <span className="ml-3 text-gray-600">Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12" id="reviews">
      {/* Review Summary */}
      <ReviewSummary
        totalReviews={summary.totalReviews}
        averageRating={summary.averageRating}
        starDistribution={summary.starDistribution}
        productName={productName}
        className="mb-12"
      />

      {/* Review List */}
      <div className="mt-8">
        <ReviewList
          initialReviews={reviews}
          productSku={productSku}
          productName={productName}
          totalReviews={summary.totalReviews}
        />
      </div>
    </div>
  );
}

