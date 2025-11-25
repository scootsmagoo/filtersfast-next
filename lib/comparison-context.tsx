'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ComparisonProduct {
  id: string;
  productId?: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  category: string;
  description?: string;
  specifications?: Record<string, string>;
  compatibility?: string[];
  partNumbers?: string[];
}

interface ComparisonContextType {
  comparisonProducts: ComparisonProduct[];
  comparisonProductIds: Set<string>;
  maxProducts: number;
  addToComparison: (product: ComparisonProduct) => boolean;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
  isInComparison: (productId: string) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPARISON_PRODUCTS = 4;
const STORAGE_KEY = 'filtersfast-comparison';

// Validate product structure
function isValidProduct(product: any): product is ComparisonProduct {
    return (
      product &&
      typeof product === 'object' &&
      typeof product.id === 'string' &&
      typeof product.name === 'string' &&
      typeof product.brand === 'string' &&
      typeof product.sku === 'string' &&
      typeof product.price === 'number' &&
      typeof product.rating === 'number' &&
      typeof product.reviewCount === 'number' &&
      typeof product.inStock === 'boolean' &&
      typeof product.category === 'string' &&
      product.name.length <= 500 && // Max length validation
      product.brand.length <= 100 &&
      product.sku.length <= 100 &&
      product.price >= 0 && product.price <= 1000000 && // Reasonable price range
      product.rating >= 0 && product.rating <= 5
    );
}

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparisonProducts, setComparisonProducts] = useState<ComparisonProduct[]>([]);
  const [comparisonProductIds, setComparisonProductIds] = useState<Set<string>>(new Set());

  // Load comparison from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= MAX_COMPARISON_PRODUCTS) {
          // Validate and filter out invalid products
          const validProducts = parsed.filter(isValidProduct);
          if (validProducts.length > 0) {
            setComparisonProducts(validProducts);
            setComparisonProductIds(new Set(validProducts.map(p => p.id || p.productId || '').filter(Boolean)));
          } else {
            // Clear invalid data
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      // Silently fail and clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore cleanup errors
      }
    }
  }, []);

  // Save to localStorage whenever comparison changes
  useEffect(() => {
    try {
      if (comparisonProducts.length > 0) {
        // Validate before saving
        const validProducts = comparisonProducts.filter(isValidProduct);
        if (validProducts.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validProducts));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      // Silently fail - localStorage quota exceeded or disabled
      // Don't log sensitive error details
    }
  }, [comparisonProducts]);

  // Add product to comparison
  const addToComparison = useCallback((product: ComparisonProduct): boolean => {
    // Validate product structure
    if (!isValidProduct(product)) {
      return false;
    }

    // Normalize product ID - use productId if available, otherwise id
    const productId = String(product.productId || product.id || '').trim();
    if (!productId || productId.length > 100) {
      return false;
    }

    // Check if already in comparison (check both id and productId)
    const normalizedIds = Array.from(comparisonProductIds);
    const isAlreadyIn = normalizedIds.some(id => 
      id === productId || 
      id === String(product.id) || 
      id === String(product.productId)
    );
    
    if (isAlreadyIn) {
      return false; // Already in comparison
    }

    // Check if we've reached the max
    if (comparisonProducts.length >= MAX_COMPARISON_PRODUCTS) {
      return false; // Cannot add more
    }

    // Ensure product has normalized ID
    const normalizedProduct: ComparisonProduct = {
      ...product,
      id: productId,
      productId: product.productId || productId,
    };

    // Add to comparison
    const newProducts = [...comparisonProducts, normalizedProduct];
    setComparisonProducts(newProducts);
    setComparisonProductIds(new Set([...comparisonProductIds, productId]));
    
    return true;
  }, [comparisonProducts, comparisonProductIds]);

  // Remove product from comparison
  const removeFromComparison = useCallback((productId: string) => {
    const normalizedId = String(productId);
    const newProducts = comparisonProducts.filter(
      p => String(p.id || p.productId || '') !== normalizedId
    );
    setComparisonProducts(newProducts);
    
    const newIds = new Set(comparisonProductIds);
    newIds.delete(normalizedId);
    // Also remove any matching IDs
    Array.from(comparisonProductIds).forEach(id => {
      if (id === normalizedId || String(id) === normalizedId) {
        newIds.delete(id);
      }
    });
    setComparisonProductIds(newIds);
  }, [comparisonProducts, comparisonProductIds]);

  // Clear all products from comparison
  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    setComparisonProductIds(new Set());
  }, []);

  // Check if product is in comparison
  const isInComparison = useCallback((productId: string): boolean => {
    const normalizedId = String(productId);
    if (comparisonProductIds.has(normalizedId)) {
      return true;
    }
    // Also check if any stored ID matches
    return Array.from(comparisonProductIds).some(id => 
      String(id) === normalizedId || id === normalizedId
    );
  }, [comparisonProductIds]);

  const value: ComparisonContextType = {
    comparisonProducts,
    comparisonProductIds,
    maxProducts: MAX_COMPARISON_PRODUCTS,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddMore: comparisonProducts.length < MAX_COMPARISON_PRODUCTS,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    // Return a safe default implementation instead of throwing
    // This handles cases where the provider might not be available during SSR or initial render
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('useComparison called outside ComparisonProvider. Comparison features will be disabled.');
    }
    return {
      comparisonProducts: [],
      comparisonProductIds: new Set<string>(),
      maxProducts: MAX_COMPARISON_PRODUCTS,
      addToComparison: () => false,
      removeFromComparison: () => {},
      clearComparison: () => {},
      isInComparison: () => false,
      canAddMore: false,
    };
  }
  return context;
}

