'use client';

import { useState } from 'react';
import { useComparison, type ComparisonProduct } from '@/lib/comparison-context';
import { useStatusAnnouncement } from '@/components/ui/StatusAnnouncementProvider';
import { Scale, X, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ComparisonButtonProps {
  product: ComparisonProduct;
  variant?: 'default' | 'icon' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ComparisonButton({ 
  product, 
  variant = 'default',
  size = 'md',
  className = '' 
}: ComparisonButtonProps) {
  const { addToComparison, removeFromComparison, isInComparison, canAddMore, comparisonProducts } = useComparison();
  const { announceSuccess, announceError } = useStatusAnnouncement();
  const [isProcessing, setIsProcessing] = useState(false);

  const productId = product.id || product.productId || '';
  const inComparison = isInComparison(productId);
  const isMaxReached = comparisonProducts.length >= 4;

  const handleClick = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isProcessing) return;

    setIsProcessing(true);
    
    try {
      if (inComparison) {
        removeFromComparison(productId);
        announceSuccess(`${product.name} removed from comparison`);
      } else {
        if (!canAddMore) {
          announceError(`You can compare up to 4 products. Remove one to add another.`);
          setIsProcessing(false);
          return;
        }
        
        const success = addToComparison(product);
        if (success) {
          announceSuccess(`${product.name} added to comparison`);
        } else {
          announceError(`Unable to add ${product.name} to comparison`);
        }
      }
    } catch (error) {
      // Don't expose error details to users
      announceError('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isProcessing || (!inComparison && !canAddMore)}
        className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 ${
          inComparison
            ? 'bg-brand-orange text-white hover:bg-brand-orange-dark'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        } ${className}`}
        aria-label={inComparison ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
        aria-pressed={inComparison}
        title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
      >
        {inComparison ? (
          <Check className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Scale className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isProcessing || (!inComparison && !canAddMore)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 ${
          inComparison
            ? 'bg-brand-orange text-white hover:bg-brand-orange-dark'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } ${className}`}
        aria-label={inComparison ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
        aria-pressed={inComparison}
      >
        {inComparison ? (
          <>
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>In Comparison</span>
          </>
        ) : (
          <>
            <Scale className="w-4 h-4" aria-hidden="true" />
            <span>Compare</span>
          </>
        )}
      </button>
    );
  }

  // Default variant
  return (
    <Button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isProcessing || (!inComparison && !canAddMore)}
      variant={inComparison ? 'primary' : 'secondary'}
      size={size}
      className={className}
      aria-label={inComparison ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
      aria-pressed={inComparison}
    >
      {inComparison ? (
        <>
          <Check className="w-4 h-4" aria-hidden="true" />
          Remove from Comparison
        </>
      ) : (
        <>
          <Scale className="w-4 h-4" aria-hidden="true" />
          Add to Comparison
        </>
      )}
    </Button>
  );
}

