/**
 * Cart Utilities
 * 
 * Helper functions for cart calculations including discounts
 */

import type { VerificationCheckResult } from './types/idme';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  brand: string;
  sku: string;
  productType?: string;
  giftCardDetails?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  discountPercentage?: number;
  discountType?: string;
}

/**
 * Calculate cart subtotal
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Calculate shipping cost
 */
export function calculateShipping(subtotal: number, freeShippingThreshold: number = 99): number {
  return subtotal >= freeShippingThreshold ? 0 : 9.99;
}

/**
 * Calculate ID.me discount
 */
export function calculateIdMeDiscount(
  subtotal: number,
  verification: VerificationCheckResult | null,
  maxDiscount: number = 100
): number {
  if (!verification?.isVerified || !verification.discountPercentage) {
    return 0;
  }

  const discount = subtotal * (verification.discountPercentage / 100);
  return Math.min(discount, maxDiscount);
}

/**
 * Calculate cart totals with all discounts
 */
export function calculateCartTotals(
  items: CartItem[],
  idmeVerification: VerificationCheckResult | null = null,
  promoDiscount: number = 0,
  taxRate: number = 0
): CartTotals {
  const subtotal = calculateSubtotal(items);
  const shipping = calculateShipping(subtotal);
  
  // Calculate ID.me discount
  const idmeDiscount = calculateIdMeDiscount(subtotal, idmeVerification);
  
  // Use the larger discount (don't stack)
  const discount = Math.max(idmeDiscount, promoDiscount);
  const discountType = idmeDiscount > promoDiscount ? 'idme' : 'promo';
  
  // Calculate tax on discounted amount
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * taxRate;
  
  const total = subtotal + shipping + tax - discount;

  return {
    subtotal,
    shipping,
    tax,
    discount,
    total: Math.max(0, total),
    discountPercentage: idmeVerification?.discountPercentage,
    discountType,
  };
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get discount display text
 */
export function getDiscountText(
  verification: VerificationCheckResult | null,
  discountType: string
): string {
  if (discountType === 'idme' && verification?.verificationType) {
    const typeMap: Record<string, string> = {
      military: 'Military',
      responder: 'First Responder',
      employee: 'Employee',
      student: 'Student',
      teacher: 'Teacher',
      nurse: 'Nurse',
    };
    return `${typeMap[verification.verificationType] || 'Verified'} Discount`;
  }
  return 'Promo Code Discount';
}

