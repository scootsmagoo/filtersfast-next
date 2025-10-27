/**
 * ReviewStars Component
 * 
 * Displays star rating with accessibility support
 */

import { Star } from 'lucide-react';

interface ReviewStarsProps {
  rating: number; // 0-5
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

export default function ReviewStars({
  rating,
  size = 'md',
  showNumber = false,
  className = '',
}: ReviewStarsProps) {
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(roundedRating);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className="flex items-center"
        role="img"
        aria-label={`${rating.toFixed(1)} out of 5 stars`}
      >
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${starSize} fill-brand-orange text-brand-orange`}
            aria-hidden="true"
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative" aria-hidden="true">
            <Star className={`${starSize} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${starSize} fill-brand-orange text-brand-orange`} />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${starSize} text-gray-300`}
            aria-hidden="true"
          />
        ))}
      </div>

      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

