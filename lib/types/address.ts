/**
 * Address Validation Type Definitions
 * For SmartyStreets address validation integration
 */

export interface AddressInput {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface AddressComponents {
  primaryNumber: string;
  streetPredirection: string;
  streetName: string;
  streetSuffix: string;
  streetPostdirection: string;
  secondaryDesignator: string;
  secondaryNumber: string;
  extraSecondaryNumber: string;
  extraSecondaryDesignator: string;
  cityName: string;
  stateAbbreviation: string;
  zipcode: string;
  plus4Code: string;
}

export interface AddressMetadata {
  recordType: 'S' | 'H' | 'F' | 'P' | 'G' | 'R'; // Street, Highrise, Firm, PO Box, General Delivery, Rural Route
  zipType: 'Standard' | 'PO Box' | 'Unique' | 'Military';
  countyFips: string;
  countyName: string;
  carrierRoute: string;
  congressionalDistrict: string;
  rdi: 'Residential' | 'Commercial' | ''; // Residential Delivery Indicator
  elotSequence: string;
  elotSort: string;
  latitude: number;
  longitude: number;
  precision: string;
  timeZone: string;
  utcOffset: number;
  dst: boolean;
}

export interface AddressAnalysis {
  dpvMatchCode: 'Y' | 'N' | 'S' | 'D'; // Y=confirmed, N=not confirmed, S=confirmed without secondary, D=confirmed but missing secondary
  dpvFootnotes: string;
  dpvCmra: 'Y' | 'N'; // Commercial Mail Receiving Agency
  dpvVacant: 'Y' | 'N';
  active: 'Y' | 'N';
  footnotes?: string;
  lacsLinkCode?: string;
  lacsLinkIndicator?: string;
  suiteReturnCode?: string;
}

export interface ValidatedAddress {
  deliveryLine1: string;
  deliveryLine2?: string;
  lastLine: string;
  deliveryPointBarcode: string;
  components: AddressComponents;
  metadata: AddressMetadata;
  analysis: AddressAnalysis;
}

export interface AddressValidationResult {
  isValid: boolean;
  candidates: ValidatedAddress[];
  inputAddress: AddressInput;
}

export interface AddressValidationResponse {
  success: boolean;
  isValid: boolean;
  hasMultipleCandidates: boolean;
  candidates: ValidatedAddress[];
  error?: string;
  errorCode?: string;
}

export interface AddressSuggestion {
  fullAddress: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  isResidential: boolean;
  isCommercial: boolean;
  isPOBox: boolean;
  confidence: 'exact' | 'high' | 'medium';
}

// SmartyStreets API response types
export interface SmartyStreetsComponent {
  primary_number: string;
  street_predirection: string;
  street_name: string;
  street_suffix: string;
  street_postdirection: string;
  secondary_designator: string;
  secondary_number: string;
  extra_secondary_number: string;
  extra_secondary_designator: string;
  city_name: string;
  state_abbreviation: string;
  zipcode: string;
  plus4_code: string;
}

export interface SmartyStreetsMetadata {
  record_type: string;
  zip_type: string;
  county_fips: string;
  county_name: string;
  carrier_route: string;
  congressional_district: string;
  rdi: string;
  elot_sequence: string;
  elot_sort: string;
  latitude: number;
  longitude: number;
  precision: string;
  time_zone: string;
  utc_offset: number;
  dst: boolean;
}

export interface SmartyStreetsAnalysis {
  dpv_match_code: string;
  dpv_footnotes: string;
  dpv_cmra: string;
  dpv_vacant: string;
  active: string;
  footnotes?: string;
  lacslink_code?: string;
  lacslink_indicator?: string;
  suite_return_code?: string;
}

export interface SmartyStreetsResponse {
  delivery_line_1: string;
  delivery_line_2?: string;
  last_line: string;
  delivery_point_barcode: string;
  components: SmartyStreetsComponent;
  metadata: SmartyStreetsMetadata;
  analysis: SmartyStreetsAnalysis;
}

export interface AddressValidationLog {
  id: string;
  timestamp: Date;
  inputAddress: string;
  responseData: string;
  candidateCount: number;
  selectedCandidate?: number;
  userId?: string;
  orderId?: string;
}

