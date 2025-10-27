/**
 * Appliance Models Types
 * 
 * For saving customer's appliances (refrigerators, HVAC, water filters, etc.)
 * and finding compatible filters
 */

export type ApplianceType = 
  | 'refrigerator'
  | 'hvac'
  | 'water-filter'
  | 'humidifier'
  | 'pool'
  | 'other';

export interface ApplianceModel {
  id: string;
  modelNumber: string;
  brand: string;
  type: ApplianceType;
  description?: string;
  imageUrl?: string;
}

export interface SavedModel {
  id: string;
  userId: string;
  modelId: string;
  model: ApplianceModel;
  nickname?: string; // e.g., "Kitchen Fridge", "Master Bedroom AC"
  location?: string; // e.g., "Kitchen", "Basement"
  dateAdded: string;
  lastUsed?: string;
}

export interface ModelLookupResult {
  model: ApplianceModel;
  compatibleProducts: CompatibleProduct[];
  matchConfidence: 'exact' | 'partial' | 'suggested';
}

export interface CompatibleProduct {
  id: number;
  name: string;
  sku: string;
  brand: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isPrimary: boolean; // Primary/recommended filter for this model
}

export interface ModelSearchParams {
  query: string;
  type?: ApplianceType;
  brand?: string;
  limit?: number;
}

export interface SaveModelRequest {
  modelNumber: string;
  nickname?: string;
  location?: string;
}

export interface UpdateModelRequest {
  nickname?: string;
  location?: string;
}

