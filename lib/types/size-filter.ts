// Type definitions for size-based filter browsing

export interface FilterDimensions {
  height: number;
  width: number;
  depth: number;
}

export interface SizeFilterProduct {
  id: number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  badges?: string[];
  dimensions: FilterDimensions;
  mervRating?: number;
  category: 'air' | 'water' | 'refrigerator' | 'pool' | 'humidifier';
  packSize?: number; // 1, 4, 6, 12, etc.
}

export interface SizeFilterOptions {
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  category?: string | null;
  mervRating?: number | null;
  minPrice?: number;
  maxPrice?: number;
}

export interface CommonSize {
  height: number;
  width: number;
  depth: number;
  label: string;
  popularity: number; // 1-10 for sorting
  category: 'air' | 'water' | 'refrigerator' | 'pool' | 'humidifier';
}

