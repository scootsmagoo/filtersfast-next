/**
 * Address Validation Service
 * SmartyStreets integration for address verification
 */

import {
  AddressInput,
  AddressValidationResponse,
  ValidatedAddress,
  SmartyStreetsResponse,
  AddressSuggestion
} from './types/address';

// Environment variables (set in .env.local)
const SMARTYSTREETS_AUTH_ID = process.env.SMARTYSTREETS_AUTH_ID || '';
const SMARTYSTREETS_AUTH_TOKEN = process.env.SMARTYSTREETS_AUTH_TOKEN || '';
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' && !SMARTYSTREETS_AUTH_ID;

/**
 * Validate an address using SmartyStreets API
 */
export async function validateAddress(
  address: AddressInput
): Promise<AddressValidationResponse> {
  // Use mock data in development if no API credentials
  if (USE_MOCK_DATA) {
    return getMockValidationResponse(address);
  }

  try {
    // OWASP: Validate credentials are configured
    if (!SMARTYSTREETS_AUTH_ID || !SMARTYSTREETS_AUTH_TOKEN) {
      console.error('SmartyStreets credentials not configured');
      return {
        success: false,
        isValid: false,
        hasMultipleCandidates: false,
        candidates: [],
        error: 'Address validation service not configured',
        errorCode: 'CONFIG_ERROR',
      };
    }

    const url = new URL('https://us-street.api.smartystreets.com/street-address');
    url.searchParams.append('auth-id', SMARTYSTREETS_AUTH_ID);
    url.searchParams.append('auth-token', SMARTYSTREETS_AUTH_TOKEN);
    url.searchParams.append('street', address.street);
    if (address.street2) {
      url.searchParams.append('street2', address.street2);
    }
    url.searchParams.append('city', address.city);
    url.searchParams.append('state', address.state);
    url.searchParams.append('zipcode', address.zipCode);
    url.searchParams.append('candidates', '5');
    url.searchParams.append('match', 'invalid'); // Return candidates for invalid addresses

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // OWASP: Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      // OWASP: Don't leak sensitive API details in error
      console.error('SmartyStreets API error:', response.status);
      throw new Error('Address validation service temporarily unavailable');
    }

    const data: SmartyStreetsResponse[] = await response.json();

    // No candidates means address is invalid
    if (!data || data.length === 0) {
      return {
        success: true,
        isValid: false,
        hasMultipleCandidates: false,
        candidates: [],
      };
    }

    // Convert SmartyStreets response to our format
    const candidates: ValidatedAddress[] = data.map((result) => ({
      deliveryLine1: result.delivery_line_1,
      deliveryLine2: result.delivery_line_2,
      lastLine: result.last_line,
      deliveryPointBarcode: result.delivery_point_barcode,
      components: {
        primaryNumber: result.components.primary_number || '',
        streetPredirection: result.components.street_predirection || '',
        streetName: result.components.street_name || '',
        streetSuffix: result.components.street_suffix || '',
        streetPostdirection: result.components.street_postdirection || '',
        secondaryDesignator: result.components.secondary_designator || '',
        secondaryNumber: result.components.secondary_number || '',
        extraSecondaryNumber: result.components.extra_secondary_number || '',
        extraSecondaryDesignator: result.components.extra_secondary_designator || '',
        cityName: result.components.city_name || '',
        stateAbbreviation: result.components.state_abbreviation || '',
        zipcode: result.components.zipcode || '',
        plus4Code: result.components.plus4_code || '',
      },
      metadata: {
        recordType: result.metadata.record_type as any,
        zipType: result.metadata.zip_type as any,
        countyFips: result.metadata.county_fips || '',
        countyName: result.metadata.county_name || '',
        carrierRoute: result.metadata.carrier_route || '',
        congressionalDistrict: result.metadata.congressional_district || '',
        rdi: result.metadata.rdi as any,
        elotSequence: result.metadata.elot_sequence || '',
        elotSort: result.metadata.elot_sort || '',
        latitude: result.metadata.latitude,
        longitude: result.metadata.longitude,
        precision: result.metadata.precision || '',
        timeZone: result.metadata.time_zone || '',
        utcOffset: result.metadata.utc_offset,
        dst: result.metadata.dst,
      },
      analysis: {
        dpvMatchCode: result.analysis.dpv_match_code as any,
        dpvFootnotes: result.analysis.dpv_footnotes || '',
        dpvCmra: result.analysis.dpv_cmra as any,
        dpvVacant: result.analysis.dpv_vacant as any,
        active: result.analysis.active as any,
        footnotes: result.analysis.footnotes,
        lacsLinkCode: result.analysis.lacslink_code,
        lacsLinkIndicator: result.analysis.lacslink_indicator,
        suiteReturnCode: result.analysis.suite_return_code,
      },
    }));

    return {
      success: true,
      isValid: candidates.length > 0 && candidates[0].analysis.dpvMatchCode === 'Y',
      hasMultipleCandidates: candidates.length > 1,
      candidates,
    };
  } catch (error: any) {
    // OWASP: Log full error internally but return generic message
    console.error('Address validation error:', error);
    return {
      success: false,
      isValid: false,
      hasMultipleCandidates: false,
      candidates: [],
      // OWASP: Generic error message to prevent information disclosure
      error: 'Unable to validate address at this time',
      errorCode: 'VALIDATION_ERROR',
    };
  }
}

/**
 * Convert validated addresses to user-friendly suggestions
 */
export function convertToSuggestions(
  candidates: ValidatedAddress[]
): AddressSuggestion[] {
  return candidates.map((candidate) => {
    const components = candidate.components;
    const metadata = candidate.metadata;

    // Build street address
    const streetParts = [
      components.primaryNumber,
      components.streetPredirection,
      components.streetName,
      components.streetSuffix,
      components.streetPostdirection,
    ].filter(Boolean);
    
    const street = streetParts.join(' ');

    // Build street2 (apartment, suite, etc.)
    const street2Parts = [
      components.secondaryDesignator,
      components.secondaryNumber,
    ].filter(Boolean);
    
    const street2 = street2Parts.length > 0 ? street2Parts.join(' ') : undefined;

    const fullAddress = `${candidate.deliveryLine1}${
      candidate.deliveryLine2 ? ', ' + candidate.deliveryLine2 : ''
    }, ${candidate.lastLine}`;

    const isResidential = metadata.rdi === 'Residential';
    const isCommercial = metadata.rdi === 'Commercial';
    const isPOBox = metadata.zipType === 'PO Box';

    // Determine confidence level
    let confidence: 'exact' | 'high' | 'medium' = 'exact';
    if (candidate.analysis.dpvMatchCode === 'Y') {
      confidence = 'exact';
    } else if (candidate.analysis.dpvMatchCode === 'S') {
      confidence = 'high';
    } else {
      confidence = 'medium';
    }

    return {
      fullAddress,
      street,
      street2,
      city: components.cityName,
      state: components.stateAbbreviation,
      zipCode: `${components.zipcode}${components.plus4Code ? '-' + components.plus4Code : ''}`,
      isResidential,
      isCommercial,
      isPOBox,
      confidence,
    };
  });
}

/**
 * Mock validation response for development
 */
function getMockValidationResponse(
  address: AddressInput
): AddressValidationResponse {
  // Simulate different scenarios based on input
  const streetLower = address.street.toLowerCase();

  // Simulate invalid address
  if (streetLower.includes('invalid') || streetLower.includes('fake')) {
    return {
      success: true,
      isValid: false,
      hasMultipleCandidates: false,
      candidates: [],
    };
  }

  // Simulate multiple candidates
  if (streetLower.includes('main') || streetLower.includes('123')) {
    return {
      success: true,
      isValid: true,
      hasMultipleCandidates: true,
      candidates: createMockCandidates(address, 3),
    };
  }

  // Simulate single exact match
  return {
    success: true,
    isValid: true,
    hasMultipleCandidates: false,
    candidates: createMockCandidates(address, 1),
  };
}

/**
 * Create mock candidate addresses
 */
function createMockCandidates(
  input: AddressInput,
  count: number
): ValidatedAddress[] {
  const candidates: ValidatedAddress[] = [];

  for (let i = 0; i < count; i++) {
    const variant = i === 0 ? '' : ` Unit ${i}`;
    candidates.push({
      deliveryLine1: `${input.street}${variant}`.toUpperCase(),
      deliveryLine2: input.street2?.toUpperCase(),
      lastLine: `${input.city.toUpperCase()}, ${input.state.toUpperCase()} ${input.zipCode}-0000`,
      deliveryPointBarcode: '000000000000',
      components: {
        primaryNumber: input.street.split(' ')[0] || '',
        streetPredirection: '',
        streetName: input.street.split(' ').slice(1).join(' ') || '',
        streetSuffix: 'St',
        streetPostdirection: '',
        secondaryDesignator: i > 0 ? 'Unit' : '',
        secondaryNumber: i > 0 ? i.toString() : '',
        extraSecondaryNumber: '',
        extraSecondaryDesignator: '',
        cityName: input.city,
        stateAbbreviation: input.state,
        zipcode: input.zipCode,
        plus4Code: '0000',
      },
      metadata: {
        recordType: 'S',
        zipType: 'Standard',
        countyFips: '00000',
        countyName: 'Mock County',
        carrierRoute: 'C000',
        congressionalDistrict: '01',
        rdi: i % 2 === 0 ? 'Residential' : 'Commercial',
        elotSequence: '0000',
        elotSort: 'A',
        latitude: 40.7128,
        longitude: -74.0060,
        precision: 'Zip9',
        timeZone: 'Eastern',
        utcOffset: -5,
        dst: true,
      },
      analysis: {
        dpvMatchCode: 'Y',
        dpvFootnotes: 'AABB',
        dpvCmra: 'N',
        dpvVacant: 'N',
        active: 'Y',
      },
    });
  }

  return candidates;
}

