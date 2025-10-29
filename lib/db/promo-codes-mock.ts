/**
 * Mock Promo Code Data (for testing without database)
 * Use this when database is not available
 */

import { PromoCode } from '@/lib/types/promo'

// Hardcoded promo codes for testing
export const MOCK_PROMO_CODES: PromoCode[] = [
  {
    id: '1',
    code: 'SAVE20',
    description: '20% off your entire order',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 50,
    maxDiscount: 100,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 1000,
    usageCount: 0,
    perCustomerLimit: 1,
    firstTimeOnly: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    code: 'WELCOME10',
    description: 'Welcome! Get 10% off your first order',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: undefined,
    maxDiscount: undefined,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: undefined,
    usageCount: 0,
    perCustomerLimit: 1,
    firstTimeOnly: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    code: 'FREESHIP',
    description: 'Free shipping on any order',
    discountType: 'free_shipping',
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscount: undefined,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: undefined,
    usageCount: 0,
    perCustomerLimit: 2,
    firstTimeOnly: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    code: 'FILTER25',
    description: '$25 off orders over $100',
    discountType: 'fixed',
    discountValue: 25,
    minOrderAmount: 100,
    maxDiscount: undefined,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 500,
    usageCount: 0,
    perCustomerLimit: 1,
    firstTimeOnly: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    code: 'BULK15',
    description: '15% off bulk orders over $200',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 200,
    maxDiscount: 150,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: undefined,
    usageCount: 0,
    perCustomerLimit: undefined,
    firstTimeOnly: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

/**
 * Get promo code by code (mock version)
 */
export function getPromoCodeMock(code: string): PromoCode | null {
  const promo = MOCK_PROMO_CODES.find(
    p => p.code.toUpperCase() === code.toUpperCase() && p.active
  )
  return promo || null
}

/**
 * Get customer usage count (mock - always returns 0)
 */
export function getCustomerUsageCountMock(promoCodeId: string, customerId: string): number {
  return 0 // Mock: customer hasn't used any codes yet
}

/**
 * Check if customer is first-time (mock - always returns false)
 */
export function isFirstTimeCustomerMock(customerId: string): boolean {
  return false // Mock: treat all customers as returning
}




