/**
 * Custom Air Filter Types
 * 
 * For building custom-sized air filters with exact dimensions
 */

export type MervRating = 'M08' | 'M11' | 'M13';
export type FilterDepth = 1 | 2 | 4; // Inches

export interface CustomFilterDimensions {
  height: number; // Inches (min: 4, max: 30)
  width: number; // Inches (min: 4, max: 36)
  depth: FilterDepth; // 1", 2", or 4"
}

export interface CustomFilterConfiguration {
  dimensions: CustomFilterDimensions;
  mervRating: MervRating;
  quantity: number;
  caseQuantity?: number; // How many filters in a case
}

export interface CustomFilterPricing {
  baseProductId: number;
  sku: string;
  description: string;
  unitPrice: number;
  casePrice?: number;
  caseQuantity?: number;
  isDoubleSize: boolean; // Wide filters (>29.5" width)
  actualDepth: number; // Real depth value
  nominalSize: string; // e.g., "16x25x1"
  minPrice: number; // Minimum allowed price
  cost: number; // Internal cost (for margin calculations)
}

export interface MervRatingInfo {
  code: MervRating;
  name: string;
  description: string;
  rating: number;
  efficiency: string;
  bestFor: string[];
  price: 'Low' | 'Medium' | 'Premium';
}

export const MERV_RATINGS: Record<MervRating, MervRatingInfo> = {
  M08: {
    code: 'M08',
    name: 'MERV 8',
    description: 'Good filtration for residential use',
    rating: 8,
    efficiency: 'Captures 70% of particles',
    bestFor: ['Basic dust', 'Pollen', 'Carpet fibers', 'General home use'],
    price: 'Low',
  },
  M11: {
    code: 'M11',
    name: 'MERV 11',
    description: 'Superior filtration for homes',
    rating: 11,
    efficiency: 'Captures 95% of particles',
    bestFor: ['Fine dust', 'Pet dander', 'Mold spores', 'Smoke', 'Allergies'],
    price: 'Medium',
  },
  M13: {
    code: 'M13',
    name: 'MERV 13',
    description: 'Premium filtration for maximum air quality',
    rating: 13,
    efficiency: 'Captures 98% of particles',
    bestFor: ['Bacteria', 'Viruses', 'Odors', 'Fine particles', 'Health concerns'],
    price: 'Premium',
  },
};

export const FILTER_DEPTHS: Array<{ value: FilterDepth; label: string; actualDepth: number }> = [
  { value: 1, label: '1"', actualDepth: 0.75 },
  { value: 2, label: '2"', actualDepth: 1.75 },
  { value: 4, label: '4"', actualDepth: 3.5 },
];

// Standard product IDs for each MERV/Depth combination (from ASP code)
export const STANDARD_PRODUCT_IDS: Record<MervRating, Record<FilterDepth, number>> = {
  M08: {
    1: 1108,
    2: 2591,
    4: 977,
  },
  M11: {
    1: 1109,
    2: 2968,
    4: 978,
  },
  M13: {
    1: 1381,
    2: 1095,
    4: 2967,
  },
};

// Validation limits
export const DIMENSION_LIMITS = {
  height: { min: 4, max: 30 },
  width: { min: 4, max: 36 },
  depth: [1, 2, 4] as FilterDepth[],
};

// Double size threshold (from ASP code)
export const DOUBLE_SIZE_WIDTH_THRESHOLD = 29.5;

