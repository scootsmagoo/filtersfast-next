/**
 * Star Rating Component
 * Displays star ratings with accessibility support
 */

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0-5, can be decimal (e.g., 4.5)
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showNumber?: boolean;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  showNumber = false,
  className = '',
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  // WCAG 2.1.1: Keyboard support for interactive stars
  const handleKeyDown = (rating: number) => (e: React.KeyboardEvent) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRatingChange?.(rating);
    }
  };

  // Generate star elements
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <button
        key={`full-${i}`}
        type="button"
        className={`inline-flex items-center justify-center p-0 border-0 bg-transparent ${
          interactive ? 'cursor-pointer hover:scale-110 transition-transform motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-1 rounded' : ''
        }`}
        onClick={() => interactive && onRatingChange?.(i + 1)}
        onKeyDown={handleKeyDown(i + 1)}
        disabled={!interactive}
        aria-hidden="true"
        tabIndex={interactive ? 0 : -1}
      >
        <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
      </button>
    );
  }

  if (hasHalfStar) {
    stars.push(
      <div key="half" className="relative" aria-hidden="true">
        <Star
          className={`${sizeClasses[size]} text-yellow-400`}
          fill="none"
        />
        <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
          <Star
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          />
        </div>
      </div>
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    const starRating = fullStars + (hasHalfStar ? 1 : 0) + i + 1;
    stars.push(
      <button
        key={`empty-${i}`}
        type="button"
        className={`inline-flex items-center justify-center p-0 border-0 bg-transparent ${
          interactive ? 'cursor-pointer hover:scale-110 transition-transform motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-1 rounded' : ''
        }`}
        onClick={() => interactive && onRatingChange?.(starRating)}
        onKeyDown={handleKeyDown(starRating)}
        disabled={!interactive}
        aria-hidden="true"
        tabIndex={interactive ? 0 : -1}
      >
        <Star className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`} fill="none" />
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${rating} out of ${maxStars} stars`}
      >
        {stars}
      </div>
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
