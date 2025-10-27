/**
 * ReorderButton Component
 * 
 * Reusable button for reordering previous orders
 */

'use client';

import { useState } from 'react';
import { RotateCcw, Check, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useReorder } from '@/lib/hooks/useReorder';
import { useStatusAnnouncement } from '@/components/ui/StatusAnnouncementProvider';

interface ReorderButtonProps {
  orderId: string;
  orderNumber?: string;
  itemCount?: number;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showText?: boolean;
  navigateToCart?: boolean;
}

export default function ReorderButton({
  orderId,
  orderNumber,
  itemCount,
  variant = 'outline',
  size = 'md',
  fullWidth = false,
  showText = true,
  navigateToCart = true,
}: ReorderButtonProps) {
  const { isReordering, error, reorder } = useReorder();
  const { announceSuccess, announceError } = useStatusAnnouncement();
  const [justReordered, setJustReordered] = useState(false);

  const handleReorder = async () => {
    try {
      await reorder(orderId, navigateToCart);
      
      // Success feedback
      setJustReordered(true);
      const message = orderNumber 
        ? `Order ${orderNumber} has been added to your cart`
        : `${itemCount || 'Items'} added to your cart`;
      announceSuccess(message);

      // Reset success state after 2 seconds
      setTimeout(() => setJustReordered(false), 2000);
    } catch (err) {
      announceError(error || 'Failed to reorder. Please try again.');
    }
  };

  const sizeClasses = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-3 px-6',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <Button
        onClick={handleReorder}
        disabled={isReordering}
        variant={justReordered ? 'primary' : variant}
        className={`
          flex items-center justify-center gap-2 
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${justReordered ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}
        `}
      >
        {justReordered ? (
          <>
            <Check className={iconSizes[size]} />
            {showText && <span>Added to Cart!</span>}
          </>
        ) : isReordering ? (
          <>
            <RotateCcw className={`${iconSizes[size]} animate-spin`} />
            {showText && <span>Adding...</span>}
          </>
        ) : (
          <>
            <RotateCcw className={iconSizes[size]} />
            {showText && <span>Reorder</span>}
          </>
        )}
      </Button>
      
      {/* Error Message */}
      {error && !isReordering && (
        <div 
          className="mt-2 flex items-start gap-2 text-sm text-red-600"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

