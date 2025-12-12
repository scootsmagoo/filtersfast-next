'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist-context';
import { useSession } from '@/lib/auth-client';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  productId: string;
  variant?: 'icon' | 'button' | 'icon-text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WishlistButton({
  productId,
  variant = 'icon',
  size = 'md',
  className = '',
}: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist, isLoading } = useWishlist();
  const { data: session } = useSession();
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id) {
      // Redirect to sign in if not authenticated
      router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsToggling(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isToggling || isLoading}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2
          ${inWishlist
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={inWishlist}
        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={`${iconSizeClasses[size]} ${inWishlist ? 'fill-current' : ''}`}
          aria-hidden="true"
        />
      </button>
    );
  }

  if (variant === 'icon-text') {
    return (
      <Button
        onClick={handleClick}
        disabled={isToggling || isLoading}
        variant="outline"
        className={`
          flex items-center gap-2
          ${inWishlist
            ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            : ''
          }
          ${className}
        `}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={`${iconSizeClasses[size]} ${inWishlist ? 'fill-current' : ''}`}
          aria-hidden="true"
        />
        <span>{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
      </Button>
    );
  }

  // variant === 'button'
  return (
    <Button
      onClick={handleClick}
      disabled={isToggling || isLoading}
      variant={inWishlist ? 'outline' : 'primary'}
      className={`
        flex items-center gap-2
        ${inWishlist
          ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : ''
        }
        ${className}
      `}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`${iconSizeClasses[size]} ${inWishlist ? 'fill-current' : ''}`}
        aria-hidden="true"
      />
      <span>{inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
    </Button>
  );
}

