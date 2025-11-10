// Enhanced product interface for search functionality
export interface SearchableProduct {
  id: number | string; // Can be numeric (legacy) or string (database IDs)
  productId?: string; // Original database product ID (for linking)
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
  productType?: string;
  requiresShipping?: boolean;
  
  // Search-specific fields
  category: 'refrigerator' | 'water' | 'air' | 'pool' | 'humidifier' | 'sale';
  description: string;
  searchKeywords: string[]; // Pre-computed search terms
  partNumbers: string[]; // Alternative part numbers
  compatibility: string[]; // Compatible appliance models
  specifications?: Record<string, string>; // Technical specs
}

export interface SearchResult {
  product: SearchableProduct;
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'keyword';
  matchedFields: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  query: string;
  suggestions?: string[];
  filters?: {
    categories: { [key: string]: number };
    brands: { [key: string]: number };
    priceRange: { min: number; max: number };
  };
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
}
