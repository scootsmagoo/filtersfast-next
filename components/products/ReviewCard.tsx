/**
 * ReviewCard Component
 * 
 * Displays a single customer review
 */

import { formatReviewDate } from '@/lib/trustpilot';
import { CheckCircle } from 'lucide-react';
import ReviewStars from './ReviewStars';
import type { ProductReview } from '@/lib/types/reviews';

interface ReviewCardProps {
  review: ProductReview;
  productName?: string;
}

export default function ReviewCard({ review, productName }: ReviewCardProps) {
  const formattedDate = formatReviewDate(review.date);

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <ReviewStars rating={review.rating} size="sm" />
          {review.title && (
            <h3 className="font-semibold text-gray-900 mt-2">
              {review.title}
            </h3>
          )}
        </div>
        {review.isVerified && (
          <div
            className="flex items-center gap-1 text-green-600 text-xs"
            title="Verified Purchase"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Verified</span>
          </div>
        )}
      </div>

      {/* Review Content */}
      <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

      {/* Reviewer Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span className="font-medium">{review.customerName}</span>
        <time dateTime={review.date}>{formattedDate}</time>
      </div>

      {/* Company Response */}
      {review.companyResponse && (
        <div
          className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg"
          role="complementary"
          aria-label="Response from FiltersFast"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-brand-blue text-sm">
              FiltersFast Response
            </span>
            <time
              dateTime={review.companyResponse.date}
              className="text-xs text-gray-500"
            >
              {formatReviewDate(review.companyResponse.date)}
            </time>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {review.companyResponse.message}
          </p>
        </div>
      )}

      {/* Product Name (if comparing reviews from different products) */}
      {productName && (
        <div className="mt-3 text-sm text-gray-500 italic">
          For: {productName}
        </div>
      )}
    </article>
  );
}

