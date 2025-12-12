/**
 * Shipping Insurance Types and Utilities
 * 
 * Provides optional shipping insurance for high-value orders to protect
 * customers from loss or damage during transit.
 */

export type InsuranceCarrier = 'standard' | 'premium' | 'none';

export interface InsuranceOption {
  carrier: InsuranceCarrier;
  name: string;
  description: string;
  calculateCost: (orderSubtotal: number) => number;
  minOrderValue?: number;
}

export interface InsuranceSelection {
  carrier: InsuranceCarrier;
  cost: number;
  coverageAmount: number;
}

/**
 * Calculate Standard Insurance Cost (based on legacy USPS tiered pricing)
 * Tiered pricing structure for basic coverage
 * 
 * OWASP: Input validation to prevent NaN, Infinity, negative numbers, and overflow
 */
export function calculateStandardInsurance(subtotal: number): number {
  // Input validation (OWASP: A03:2021 - Injection)
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return 0;
  }
  
  // Prevent integer overflow (OWASP: A04:2021 - Insecure Design)
  if (subtotal > Number.MAX_SAFE_INTEGER) {
    return 0;
  }
  
  if (subtotal < 50) return 1.30;
  if (subtotal < 100) return 2.20;
  if (subtotal < 200) return 3.20;
  if (subtotal < 300) return 4.20;
  if (subtotal < 400) return 5.20;
  if (subtotal < 500) return 6.20;
  if (subtotal < 600) return 7.20;
  if (subtotal < 700) return 8.20;
  if (subtotal < 800) return 9.20;
  if (subtotal < 900) return 10.20;
  if (subtotal < 1000) return 11.20;
  // $1 per $100 over $1000
  return 11.20 + Math.floor((subtotal - 1000) / 100);
}

/**
 * Calculate Premium Insurance Cost (based on legacy UPS percentage pricing)
 * 0.35% of order value for higher-value orders
 * 
 * OWASP: Input validation to prevent NaN, Infinity, negative numbers, and overflow
 */
export function calculatePremiumInsurance(subtotal: number): number {
  // Input validation (OWASP: A03:2021 - Injection)
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return 0;
  }
  
  // Prevent integer overflow (OWASP: A04:2021 - Insecure Design)
  if (subtotal > Number.MAX_SAFE_INTEGER) {
    return 0;
  }
  
  if (subtotal <= 100) return 0;
  // Calculate insurance on rounded-up $100 increments
  const roundedValue = Math.ceil(subtotal / 100) * 100;
  return roundedValue * 0.0035; // 0.35%
}

/**
 * Available Insurance Options
 */
export const INSURANCE_OPTIONS: InsuranceOption[] = [
  {
    carrier: 'none',
    name: 'No Insurance',
    description: 'I understand orders are shipped at my own risk',
    calculateCost: () => 0,
  },
  {
    carrier: 'standard',
    name: 'Standard Coverage',
    description: 'Protection against loss or damage during shipping',
    calculateCost: calculateStandardInsurance,
    minOrderValue: 50, // Recommended for orders $50+
  },
  {
    carrier: 'premium',
    name: 'Premium Coverage',
    description: 'Enhanced protection with expedited claims processing',
    calculateCost: calculatePremiumInsurance,
    minOrderValue: 100, // Recommended for orders $100+
  },
];

/**
 * Get recommended insurance option based on order value
 */
export function getRecommendedInsurance(orderSubtotal: number): InsuranceCarrier {
  if (orderSubtotal >= 200) return 'premium';
  if (orderSubtotal >= 50) return 'standard';
  return 'none';
}

/**
 * Format insurance selection for display
 */
export function formatInsuranceSelection(selection: InsuranceSelection | null): string {
  if (!selection || selection.carrier === 'none') {
    return 'No insurance';
  }
  
  const option = INSURANCE_OPTIONS.find(opt => opt.carrier === selection.carrier);
  return `${option?.name || 'Insurance'} - $${selection.cost.toFixed(2)}`;
}

/**
 * Validate insurance selection
 * 
 * OWASP: Server-side validation with sanitized error messages
 */
export function validateInsurance(
  carrier: InsuranceCarrier,
  orderSubtotal: number
): { valid: boolean; message?: string } {
  // Input validation (OWASP: A03:2021 - Injection)
  if (!Number.isFinite(orderSubtotal) || orderSubtotal < 0) {
    return { valid: false, message: 'Invalid order amount' };
  }
  
  if (carrier === 'none') {
    return { valid: true };
  }

  const option = INSURANCE_OPTIONS.find(opt => opt.carrier === carrier);
  if (!option) {
    return { valid: false, message: 'Invalid insurance option' };
  }

  if (option.minOrderValue && orderSubtotal < option.minOrderValue) {
    // OWASP: Prevent XSS - use hardcoded message with safe number formatting
    return {
      valid: false,
      message: `This coverage requires a minimum order of $${Math.floor(option.minOrderValue)}`,
    };
  }

  return { valid: true };
}

