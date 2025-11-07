/**
 * Saved Address Types
 * For managing user saved addresses
 */

export interface SavedAddress {
  id: number;
  user_id: string;
  label: string; // e.g., "Home", "Work", "Office"
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string | null;
  is_default: 0 | 1; // 0 = not default, 1 = default
  created_at: number;
  updated_at: number;
}

export interface AddressFormData {
  label: string;
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string | null;
  is_default?: 0 | 1;
}

export interface AddressListResponse {
  success: boolean;
  addresses: SavedAddress[];
  total: number;
}

export interface SingleAddressResponse {
  success: boolean;
  address: SavedAddress | null;
}
