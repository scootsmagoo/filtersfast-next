/**
 * Review Card Component
 * Displays an individual review from TrustPilot
 */

import { TrustPilotReview } from '@/lib/trustpilot/client';
import StarRating from './StarRating';
import { CheckCircle } from 'lucide-react';

interface ReviewCardProps {
  review: TrustPilotReview;
  source?: 'trustpilot' | 'imported';
  showProductName?: boolean;
  productName?: string;
}

export default function ReviewCard({
  review,
  source = 'trustpilot',
  showProductName = false,
  productName,
}: ReviewCardProps) {
  const reviewDate = new Date(review.createdAt);
  const formattedDate = reviewDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const replyDate = review.companyReply
    ? new Date(review.companyReply.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="border-b border-gray-200 dark:border-gray-700 py-6 last:border-b-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={review.stars} size="sm" />
            {review.isVerified && (
              <div
                className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
                title="Verified Purchase"
              >
                <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verified</span>
              </div>
            )}
          </div>
          {review.title && (
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {review.title}
            </h3>
          )}
        </div>
      </div>

      {/* Review Text */}
      {review.text && (
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          {review.text}
        </p>
      )}

      {/* Product Name (if applicable) */}
      {showProductName && productName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
          Product: {productName}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            {review.consumer.displayName}
          </span>
          {review.consumer.displayLocation && (
            <>
              <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">•</span>
              <span>{review.consumer.displayLocation}</span>
            </>
          )}
        </div>
        <time dateTime={review.createdAt}>{formattedDate}</time>
      </div>

      {/* Source Badge */}
      <div className="mt-2">
        {source === 'imported' ? (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
            Collected by FiltersFast.com
          </span>
        ) : (
          <a
            href="https://www.trustpilot.com/review/www.filtersfast.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-2 py-1 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="View this review on Trustpilot.com (opens in new tab)"
          >
            Collected by Trustpilot.com
          </a>
        )}
      </div>

      {/* Company Reply */}
      {review.companyReply && (
        <div className="mt-4 pl-4 border-l-2 border-brand-orange">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase">
              FiltersFast Response
            </span>
            {replyDate && (
              <time
                dateTime={review.companyReply.createdAt}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                {replyDate}
              </time>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {review.companyReply.text}
          </p>
        </div>
      )}
    </article>
  );
}
