/**
 * Shipping API Types
 * For FedEx, USPS, UPS shipping integrations
 */

// ==================== Shipping Configuration ====================

export interface ShippingConfig {
  id: string;
  carrier: ShippingCarrier;
  is_active: boolean;
  
  // API Credentials (encrypted in storage)
  api_credentials: Record<string, string>;
  
  // Shipping Settings
  origin_address: ShippingOriginAddress;
  default_package_dimensions?: PackageDimensions;
  
  // Rate Settings
  markup_percentage?: number;  // Add percentage to carrier rates
  markup_fixed?: number;       // Add fixed amount to carrier rates
  free_shipping_threshold?: number;
  
  // Metadata
  created_at: number;
  updated_at: number;
}

export type ShippingCarrier = 'fedex' | 'usps' | 'ups' | 'dhl';

export interface ShippingOriginAddress {
  name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface PackageDimensions {
  length: number;  // inches
  width: number;   // inches
  height: number;  // inches
  weight: number;  // pounds
}

// ==================== Shipping Rate Request/Response ====================

export interface ShippingRateRequest {
  origin: ShippingOriginAddress;
  destination: ShippingDestinationAddress;
  packages: Package[];
  
  // Optional filters
  carriers?: ShippingCarrier[];
  service_types?: string[];
}

export interface ShippingDestinationAddress {
  name?: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_residential?: boolean;
}

export interface Package {
  weight: number;        // pounds
  length?: number;       // inches
  width?: number;        // inches
  height?: number;       // inches
  insured_value?: number;
  contents_type?: 'merchandise' | 'documents' | 'gift' | 'sample';
}

export interface ShippingRate {
  carrier: ShippingCarrier;
  service_name: string;
  service_code: string;
  
  // Pricing
  rate: number;
  currency: string;
  retail_rate?: number;  // List rate before discounts
  
  // Delivery Estimate
  delivery_days?: number;
  delivery_date?: string;  // ISO date
  delivery_guarantee?: boolean;
  
  // Additional Info
  zone?: string;
  dimensional_weight?: number;
  billable_weight?: number;
  
  // Metadata
  carrier_rate_id?: string;  // For rate shopping/booking
  raw_response?: any;        // Store full carrier response
}

export interface ShippingRateResponse {
  rates: ShippingRate[];
  errors: ShippingRateError[];
}

export interface ShippingRateError {
  carrier: ShippingCarrier;
  error: string;
  code?: string;
}

// ==================== Shipment Creation ====================

export interface CreateShipmentRequest {
  carrier: ShippingCarrier;
  service_code: string;
  
  // Addresses
  origin: ShippingOriginAddress;
  destination: ShippingDestinationAddress;
  
  // Package Info
  packages: Package[];
  
  // Label Options
  label_format?: 'PDF' | 'PNG' | 'ZPL';
  label_size?: '4x6' | '8x11';
  
  // Additional Options
  signature_required?: boolean;
  saturday_delivery?: boolean;
  insurance_amount?: number;
  
  // Reference
  reference_number?: string;  // Order number, etc.
  
  // Customs (for international)
  customs_declaration?: CustomsDeclaration;
}

export interface CustomsDeclaration {
  contents_type: 'merchandise' | 'documents' | 'gift' | 'sample' | 'return';
  contents_explanation?: string;
  non_delivery_option: 'return' | 'abandon';
  
  items: CustomsItem[];
  
  // Additional Info
  eel_pfc?: string;  // Export information
  invoice_number?: string;
}

export interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number;
  origin_country: string;
  hs_tariff_code?: string;
}

export interface Shipment {
  id: string;
  carrier: ShippingCarrier;
  service_name: string;
  service_code: string;
  
  // Tracking
  tracking_number: string;
  label_url: string;
  
  // Pricing
  rate: number;
  currency: string;
  
  // Addresses
  origin: ShippingOriginAddress;
  destination: ShippingDestinationAddress;
  
  // Status
  status: ShipmentStatus;
  
  // Metadata
  order_id?: string;
  reference_number?: string;
  created_at: number;
  carrier_shipment_id?: string;
  raw_response?: any;
}

export type ShipmentStatus =
  | 'label_created'      // Label created but not yet in carrier system
  | 'in_transit'         // Package picked up and in transit
  | 'out_for_delivery'   // Out for delivery
  | 'delivered'          // Successfully delivered
  | 'exception'          // Delivery exception
  | 'failed'             // Delivery failed
  | 'returned'           // Returned to sender
  | 'cancelled'          // Shipment cancelled

// ==================== Tracking ====================

export interface TrackingRequest {
  carrier: ShippingCarrier;
  tracking_number: string;
}

export interface TrackingInfo {
  carrier: ShippingCarrier;
  tracking_number: string;
  status: ShipmentStatus;
  
  // Delivery Info
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  delivery_signature?: string;
  
  // Location
  current_location?: string;
  
  // Events
  events: TrackingEvent[];
  
  // Metadata
  updated_at: number;
  raw_response?: any;
}

export interface TrackingEvent {
  timestamp: number;
  status: string;
  description: string;
  location?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// ==================== USPS Specific Types ====================

export interface USPSCredentials {
  user_id: string;
  password?: string;  // Some USPS APIs don't require password
}

export type USPSServiceType = 
  | 'PRIORITY'
  | 'PRIORITY_EXPRESS'
  | 'FIRST_CLASS'
  | 'PARCEL_SELECT'
  | 'MEDIA_MAIL'
  | 'LIBRARY_MAIL'
  | 'PRIORITY_MAIL_INTERNATIONAL'
  | 'FIRST_CLASS_PACKAGE_INTERNATIONAL'
  | 'GLOBAL_EXPRESS_GUARANTEED'
  | 'EXPRESS_MAIL_INTERNATIONAL';

export interface USPSRateRequest {
  user_id: string;
  origin_zip: string;
  destination_zip: string;
  packages: USPSPackage[];
  service?: USPSServiceType;
}

export interface USPSPackage {
  weight_pounds: number;
  weight_ounces: number;
  container?: 'VARIABLE' | 'FLAT_RATE_ENVELOPE' | 'FLAT_RATE_BOX' | 'RECTANGULAR' | 'NONRECTANGULAR';
  size?: 'REGULAR' | 'LARGE' | 'OVERSIZE';
  width?: number;
  length?: number;
  height?: number;
  girth?: number;
  machinable?: boolean;
}

// ==================== UPS Specific Types ====================

export interface UPSCredentials {
  client_id: string;
  client_secret: string;
  account_number: string;
}

export type UPSServiceCode =
  | '01' // Next Day Air
  | '02' // 2nd Day Air
  | '03' // Ground
  | '07' // Worldwide Express
  | '08' // Worldwide Expedited
  | '11' // Standard
  | '12' // 3 Day Select
  | '13' // Next Day Air Saver
  | '14' // Next Day Air Early
  | '54' // Worldwide Express Plus
  | '59' // 2nd Day Air AM
  | '65' // Express Saver
  | '96'; // UPS Worldwide Express Freight

export interface UPSRateRequest {
  credentials: UPSCredentials;
  origin: ShippingOriginAddress;
  destination: ShippingDestinationAddress;
  packages: UPSPackage[];
  service_code?: UPSServiceCode;
  pickup_type?: 'DAILY_PICKUP' | 'CUSTOMER_COUNTER' | 'ONE_TIME_PICKUP' | 'ON_CALL_AIR' | 'LETTER_CENTER';
}

export interface UPSPackage {
  packaging_type?: '01' | '02' | '03' | '04' | '21' | '24' | '25'; // Package types
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  insured_value?: number;
}

// ==================== FedEx Specific Types ====================

export interface FedExCredentials {
  account_number: string;
  meter_number: string;
  key: string;
  password: string;
}

export type FedExServiceType =
  | 'FEDEX_GROUND'
  | 'GROUND_HOME_DELIVERY'
  | 'FEDEX_EXPRESS_SAVER'
  | 'FEDEX_2_DAY'
  | 'FEDEX_2_DAY_AM'
  | 'STANDARD_OVERNIGHT'
  | 'PRIORITY_OVERNIGHT'
  | 'FIRST_OVERNIGHT'
  | 'INTERNATIONAL_ECONOMY'
  | 'INTERNATIONAL_PRIORITY'
  | 'INTERNATIONAL_FIRST';

export interface FedExRateRequest {
  credentials: FedExCredentials;
  origin: ShippingOriginAddress;
  destination: ShippingDestinationAddress;
  packages: FedExPackage[];
  service_type?: FedExServiceType;
  dropoff_type?: 'REGULAR_PICKUP' | 'DROP_BOX' | 'BUSINESS_SERVICE_CENTER' | 'STATION';
}

export interface FedExPackage {
  packaging_type?: 'YOUR_PACKAGING' | 'FEDEX_ENVELOPE' | 'FEDEX_PAK' | 'FEDEX_BOX' | 'FEDEX_TUBE';
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  insured_value?: number;
}

// ==================== Admin Management Types ====================

export interface ShippingConfigUpdate {
  carrier: ShippingCarrier;
  is_active?: boolean;
  api_credentials?: Record<string, string>;
  origin_address?: ShippingOriginAddress;
  default_package_dimensions?: PackageDimensions;
  markup_percentage?: number;
  markup_fixed?: number;
  free_shipping_threshold?: number;
}

export interface ShippingRule {
  id: string;
  name: string;
  priority: number;  // Lower number = higher priority
  is_active: boolean;
  
  // Conditions
  conditions: {
    min_weight?: number;
    max_weight?: number;
    min_order_value?: number;
    max_order_value?: number;
    destination_countries?: string[];
    destination_states?: string[];
    destination_zip_codes?: string[];
  };
  
  // Actions
  actions: {
    carrier_filter?: ShippingCarrier[];  // Only show these carriers
    service_filter?: string[];           // Only show these services
    free_shipping?: boolean;
    discount_percentage?: number;
    discount_fixed?: number;
    markup_percentage?: number;
    markup_fixed?: number;
  };
  
  created_at: number;
  updated_at: number;
}

// ==================== Shipping Zone Types ====================

export interface ShippingZone {
  id: string;
  name: string;
  
  // Geographic Coverage
  countries?: string[];
  states?: string[];
  zip_code_ranges?: ZipCodeRange[];
  
  // Rates
  rates: ZoneRate[];
  
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface ZipCodeRange {
  from: string;
  to: string;
}

export interface ZoneRate {
  carrier: ShippingCarrier;
  service_name: string;
  service_code: string;
  
  // Tiered pricing
  tiers: RateTier[];
}

export interface RateTier {
  min_weight: number;
  max_weight: number;
  rate: number;
}

