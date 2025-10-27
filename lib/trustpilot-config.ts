/**
 * Trustpilot Configuration
 * 
 * Add these to your .env.local file:
 * TRUSTPILOT_API_KEY=your_api_key_here
 * TRUSTPILOT_BUSINESS_UNIT_ID=47783f490000640005020cf6
 * NEXT_PUBLIC_TRUSTPILOT_ENABLED=true
 */

export const trustpilotConfig = {
  // API Configuration
  apiKey: process.env.TRUSTPILOT_API_KEY || '',
  businessUnitId: process.env.TRUSTPILOT_BUSINESS_UNIT_ID || '47783f490000640005020cf6',
  
  // API Endpoints
  baseUrl: 'https://api.trustpilot.com/v1',
  
  // Feature Flag
  isEnabled: process.env.NEXT_PUBLIC_TRUSTPILOT_ENABLED === 'true',
  
  // Widget Configuration (for fallback when no reviews)
  widget: {
    templateId: '53aa8912dec7e10d38f59f36',
    locale: 'en-US',
    theme: 'light',
  },
  
  // Display Settings
  maxReviewsPerPage: 20,
  maxReviewsOnProductPage: 5,
  
  // Cache Settings (optional, for future optimization)
  cacheTTL: 3600, // 1 hour in seconds
} as const;

/**
 * Check if Trustpilot is properly configured
 */
export function isTrustpilotConfigured(): boolean {
  return !!(trustpilotConfig.apiKey && trustpilotConfig.businessUnitId && trustpilotConfig.isEnabled);
}

/**
 * Get Trustpilot profile URL
 */
export function getTrustpilotProfileUrl(): string {
  return 'https://www.trustpilot.com/review/www.filtersfast.com';
}

