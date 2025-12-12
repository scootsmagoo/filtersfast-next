/**
 * Review Summary Component
 * Displays aggregate review statistics with star distribution
 */

import StarRating from './StarRating';
import { ExternalLink } from 'lucide-react';

interface ReviewSummaryProps {
  totalReviews: number;
  averageRating: number;
  starDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  productName?: string;
  className?: string;
}

export default function ReviewSummary({
  totalReviews,
  averageRating,
  starDistribution,
  productName,
  className = '',
}: ReviewSummaryProps) {
  if (totalReviews === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No reviews yet. Be the first to review {productName ? `"${productName}"` : 'this product'}!
        </p>
          <a
            href="https://www.trustpilot.com/review/www.filtersfast.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
            aria-label="Write a review on Trustpilot (opens in new tab)"
          >
            Write a Review on Trustpilot
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
      </div>
    );
  }

  // Calculate percentages for each star rating
  const starPercentages = Object.entries(starDistribution)
    .reverse()
    .map(([stars, count]) => ({
      stars: parseInt(stars),
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
    }));

  return (
    <section
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}
      aria-labelledby="review-summary-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 id="review-summary-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Reviews
        </h2>
        <a
          href="https://www.trustpilot.com/review/www.filtersfast.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          aria-label="View FiltersFast reviews on Trustpilot (opens in new tab)"
        >
          <img
            src="/images/trustpilot-logo.png"
            alt="Trustpilot"
            width={120}
            height={30}
            className="h-7 w-auto"
          />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Rating */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} size="lg" className="mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on <strong>{totalReviews.toLocaleString()}</strong> {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Star Distribution */}
        <div className="space-y-2">
          {starPercentages.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                {stars} {stars === 1 ? 'star' : 'stars'}
              </span>
              <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500 motion-reduce:transition-none"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${stars} star: ${percentage}%`}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                {percentage}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500 w-8 text-right">
                ({count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <a
          href="https://www.trustpilot.com/review/www.filtersfast.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
        >
          Write a Review
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
