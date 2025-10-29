/**
 * Appliance Model Lookup Types
 * 
 * For helping customers find the right filter for their appliance
 */

export type ApplianceType = 'refrigerator' | 'hvac' | 'furnace' | 'air_purifier' | 'humidifier' | 'water_filter' | 'pool' | 'other';

export interface ApplianceModel {
  id: string;
  
  // Model identification
  brand: string;
  modelNumber: string;
  modelName?: string;
  applianceType: ApplianceType;
  
  // Search optimization
  searchableText: string; // Normalized for fuzzy search
  aliases?: string[]; // Alternative model numbers
  
  // Product compatibility
  compatibleFilters: CompatibleFilter[];
  
  // Additional info
  notes?: string;
  imageUrl?: string;
  manufacturerUrl?: string;
  
  // Metadata
  verified: boolean; // Manufacturer verified data
  popularity: number; // Search/save count
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CompatibleFilter {
  productId: string;
  productName: string;
  productSku: string;
  productImage?: string;
  price: number;
  isPrimary: boolean; // Main recommended filter
  filterType: string; // "air", "water", etc.
  replacementFrequency?: number; // Months
  notes?: string;
}

export interface SavedModel {
  id: string;
  customerId: string;
  modelId: string;
  
  // Denormalized for quick access
  brand: string;
  modelNumber: string;
  applianceType: ApplianceType;
  
  // User customization
  nickname?: string; // "Kitchen Fridge", "Master Bedroom AC"
  location?: string;
  notes?: string;
  
  // Tracking
  lastOrderedDate?: Date | string;
  nextReminderDate?: Date | string;
  reminderEnabled: boolean;
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ModelSearchQuery {
  query: string;
  brand?: string;
  applianceType?: ApplianceType;
  limit?: number;
  offset?: number;
}

export interface ModelSearchResult {
  models: ApplianceModel[];
  total: number;
  query: string;
  suggestions?: string[]; // "Did you mean...?"
}

export interface BrandInfo {
  name: string;
  slug: string;
  logoUrl?: string;
  modelCount: number;
  applianceTypes: ApplianceType[];
}

// Form inputs
export interface SaveModelInput {
  modelId: string;
  nickname?: string;
  location?: string;
  notes?: string;
  reminderEnabled?: boolean;
}

export interface UpdateSavedModelInput {
  nickname?: string;
  location?: string;
  notes?: string;
  reminderEnabled?: boolean;
  nextReminderDate?: Date | string;
}

// Stats and analytics
export interface ModelStats {
  totalModels: number;
  totalBrands: number;
  savedModelsCount: number;
  mostPopularBrands: { brand: string; count: number }[];
  recentSearches: string[];
}

// Popular brands list
export const POPULAR_BRANDS = [
  'GE',
  'Whirlpool',
  'Samsung',
  'LG',
  'Frigidaire',
  'Honeywell',
  'Carrier',
  'Trane',
  'Lennox',
  'Rheem',
  'Goodman',
  'American Standard',
  'Aprilaire',
  'Filtrete',
  '3M',
  'Kenmore',
  'Maytag',
  'Bosch',
  'KitchenAid',
  'Electrolux',
] as const;

export const APPLIANCE_TYPE_LABELS: Record<ApplianceType, string> = {
  refrigerator: 'Refrigerator',
  hvac: 'HVAC',
  furnace: 'Furnace',
  air_purifier: 'Air Purifier',
  humidifier: 'Humidifier',
  water_filter: 'Water Filter',
  pool: 'Pool/Spa',
  other: 'Other',
};

export const APPLIANCE_TYPE_ICONS: Record<ApplianceType, string> = {
  refrigerator: '🧊',
  hvac: '❄️',
  furnace: '🔥',
  air_purifier: '💨',
  humidifier: '💧',
  water_filter: '🚰',
  pool: '🏊',
  other: '🔧',
};

