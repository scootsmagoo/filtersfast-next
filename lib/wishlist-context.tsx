'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';

export interface WishlistProduct {
  id: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  primaryImage: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  slug?: string | null;
}

interface WishlistContextType {
  wishlistProducts: WishlistProduct[];
  wishlistProductIds: Set<string>;
  isLoading: boolean;
  itemCount: number;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist products
  const loadWishlist = useCallback(async () => {
    if (!session?.user?.id) {
      setWishlistProducts([]);
      setWishlistProductIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/wishlist/default/products');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWishlistProducts(data.products || []);
          // Use productId if available, otherwise fall back to id
          // Also normalize IDs to strings for comparison
          const productIdSet = new Set(
            (data.products || []).flatMap((p: WishlistProduct) => {
              const ids: string[] = [];
              if (p.productId) ids.push(String(p.productId));
              if (p.id) ids.push(String(p.id));
              return ids;
            })
          );
          setWishlistProductIds(productIdSet);
          console.log('[Wishlist Context] Loaded wishlist product IDs:', Array.from(productIdSet));
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Load wishlist on mount and when session changes
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Add product to wishlist
  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!session?.user?.id) {
      console.error('[Wishlist Context] No user session');
      return false;
    }

    try {
      console.log('[Wishlist Context] Adding product to wishlist:', productId);
      const response = await fetch(`/api/wishlist/default/products/${encodeURIComponent(productId)}`, {
        method: 'POST',
      });

      let data;
      try {
        const text = await response.text();
        console.log('[Wishlist Context] Raw response text:', text);
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('[Wishlist Context] Failed to parse JSON:', parseError);
        data = {};
      }
      console.log('[Wishlist Context] Response:', { status: response.status, data });

      if (response.ok) {
        if (data.success) {
          // Refresh wishlist
          await loadWishlist();
          return true;
        } else {
          console.error('[Wishlist Context] API returned success=false:', data.error);
        }
      } else {
        // If product is already in wishlist (400), refresh the wishlist state
        if (response.status === 400 && data.error === 'Product already in wishlist') {
          console.log('[Wishlist Context] Product already in wishlist, refreshing state');
          await loadWishlist();
          return true; // Return true since the product IS in the wishlist
        }
        console.error('[Wishlist Context] API error:', response.status, data);
      }
      return false;
    } catch (error) {
      console.error('[Wishlist Context] Error adding to wishlist:', error);
      return false;
    }
  }, [session?.user?.id, loadWishlist]);

  // Remove product from wishlist
  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      const response = await fetch(`/api/wishlist/default/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh wishlist
          await loadWishlist();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }, [session?.user?.id, loadWishlist]);

  // Check if product is in wishlist
  // This checks both the exact ID and tries to match against stored product IDs
  const isInWishlist = useCallback((productId: string): boolean => {
    const normalizedId = String(productId);
    
    // Direct match
    if (wishlistProductIds.has(normalizedId)) {
      return true;
    }
    
    // Also check if any wishlist product matches this ID (handles both UUID and numeric IDs)
    const isIn = Array.from(wishlistProductIds).some(storedId => {
      return storedId === normalizedId || String(storedId) === normalizedId;
    });
    
    console.log('[Wishlist Context] Checking if in wishlist:', { 
      productId, 
      normalizedId, 
      isIn, 
      allIds: Array.from(wishlistProductIds),
      directMatch: wishlistProductIds.has(normalizedId)
    });
    
    return isIn;
  }, [wishlistProductIds]);

  const value: WishlistContextType = {
    wishlistProducts,
    wishlistProductIds,
    isLoading,
    itemCount: wishlistProducts.length,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist: loadWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

