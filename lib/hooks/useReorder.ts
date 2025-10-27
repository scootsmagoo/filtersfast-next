/**
 * useReorder Hook
 * 
 * Handles quick reorder functionality
 */

import { useState } from 'react';
import { useCart, type CartItem } from '@/lib/cart-context';
import { useRouter } from 'next/navigation';

interface ReorderResult {
  isReordering: boolean;
  error: string | null;
  reorder: (orderId: string, navigateToCart?: boolean) => Promise<void>;
}

export function useReorder(): ReorderResult {
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addItemsBatch } = useCart();
  const router = useRouter();

  const reorder = async (orderId: string, navigateToCart: boolean = true) => {
    setIsReordering(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder');
      }

      const data = await response.json();

      if (data.success && data.items && data.items.length > 0) {
        // Transform API response to CartItem format
        const cartItems: CartItem[] = data.items.map((item: any) => ({
          id: item.productId,
          name: item.productName,
          brand: item.brand,
          sku: item.sku,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
        }));

        // Add all items to cart
        addItemsBatch(cartItems);

        // Navigate to cart if requested
        if (navigateToCart) {
          router.push('/cart');
        }
      } else {
        throw new Error('No items found in order');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder';
      setError(errorMessage);
      console.error('Reorder error:', err);
    } finally {
      setIsReordering(false);
    }
  };

  return {
    isReordering,
    error,
    reorder,
  };
}

