/**
 * Store / Dealer Locator Types
 * Shared types between admin CRUD and customer-facing locator UI
 */

export type StoreLocationType = 'retail' | 'dealer' | 'distributor' | 'service_center';

export type StoreLocationStatus = 'active' | 'inactive';

export interface StoreLocation {
  id: string;
  name: string;
  slug: string;
  locationType: StoreLocationType;
  status: StoreLocationStatus;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hours?: Record<string, string> | null;
  services?: string[] | null;
  notes?: string | null;
  shippingZoneId?: string | null;
  shippingZoneName?: string | null;
  taxRegionCode?: string | null;
  taxRateOverride?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoreLocationFormData {
  name: string;
  slug?: string;
  locationType: StoreLocationType;
  status?: StoreLocationStatus;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hours?: Record<string, string> | null;
  services?: string[] | null;
  notes?: string | null;
  shippingZoneId?: string | null;
  taxRegionCode?: string | null;
  taxRateOverride?: number | null;
}

export interface StoreLocationFilters {
  search?: string;
  states?: string[];
  types?: StoreLocationType[];
  onlyActive?: boolean;
  limit?: number;
}

export interface StoreLocationListResponse {
  success: boolean;
  locations: StoreLocation[];
  total: number;
}

export interface StoreLocationWithDistance extends StoreLocation {
  distanceMiles?: number | null;
}

