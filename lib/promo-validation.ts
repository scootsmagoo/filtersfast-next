/**
 * Promo Code Validation Logic
 */

import {
  PromoCode,
  PromoCodeValidation,
  PromoCodeRequest,
  PromoCodeApplication,
  CartItem
} from '@/lib/types/promo'
import {
  getPromoCode,
  getCustomerUsageCount,
  isFirstTimeCustomer
} from '@/lib/db/promo-codes'
import {
  getPromoCodeMock,
  getCustomerUsageCountMock,
  isFirstTimeCustomerMock
} from '@/lib/db/promo-codes-mock'

/**
 * Validate a promo code
 */
export function validatePromoCode(request: PromoCodeRequest, useMock: boolean = false): PromoCodeValidation {
  // Get promo code from database or mock data
  const promoCode = useMock 
    ? getPromoCodeMock(request.code)
    : getPromoCode(request.code)
  
  if (!promoCode) {
    return {
      valid: false,
      error: 'Promo code not found',
      errorCode: 'NOT_FOUND'
    }
  }
  
  // Check if active
  if (!promoCode.active) {
    return {
      valid: false,
      error: 'This promo code is no longer active',
      errorCode: 'INACTIVE'
    }
  }
  
  // Check date range
  const now = new Date()
  if (now < promoCode.startDate) {
    return {
      valid: false,
      error: `This promo code is not valid until ${promoCode.startDate.toLocaleDateString()}`,
      errorCode: 'NOT_STARTED'
    }
  }
  
  if (now > promoCode.endDate) {
    return {
      valid: false,
      error: 'This promo code has expired',
      errorCode: 'EXPIRED'
    }
  }
  
  // Check usage limit
  if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
    return {
      valid: false,
      error: 'This promo code has reached its usage limit',
      errorCode: 'USAGE_LIMIT_REACHED'
    }
  }
  
  // Check per-customer limit
  if (request.customerId && promoCode.perCustomerLimit) {
    const customerUsageCount = useMock
      ? getCustomerUsageCountMock(promoCode.id, request.customerId)
      : getCustomerUsageCount(promoCode.id, request.customerId)
    if (customerUsageCount >= promoCode.perCustomerLimit) {
      return {
        valid: false,
        error: 'You have already used this promo code the maximum number of times',
        errorCode: 'CUSTOMER_LIMIT_REACHED'
      }
    }
  }
  
  // Check first-time only
  if (promoCode.firstTimeOnly) {
    if (!request.customerId) {
      return {
        valid: false,
        error: 'This promo code is only valid for registered customers',
        errorCode: 'FIRST_TIME_ONLY'
      }
    }
    
    const isFirstTime = useMock
      ? isFirstTimeCustomerMock(request.customerId)
      : isFirstTimeCustomer(request.customerId)
    if (!isFirstTime) {
      return {
        valid: false,
        error: 'This promo code is only valid for first-time customers',
        errorCode: 'FIRST_TIME_ONLY'
      }
    }
  }
  
  // Check product/category applicability
  if (promoCode.applicableProducts || promoCode.applicableCategories) {
    const hasApplicableItems = checkApplicableItems(request.cartItems, promoCode)
    if (!hasApplicableItems) {
      return {
        valid: false,
        error: 'This promo code is not applicable to items in your cart',
        errorCode: 'PRODUCTS_NOT_APPLICABLE'
      }
    }
  }
  
  // Calculate discount amount
  const discountAmount = calculateDiscount(request.cartTotal, request.cartItems, promoCode)
  
  // Check minimum order amount
  if (promoCode.minOrderAmount && request.cartTotal < promoCode.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order of $${promoCode.minOrderAmount.toFixed(2)} required for this promo code`,
      errorCode: 'MIN_ORDER_NOT_MET'
    }
  }
  
  return {
    valid: true,
    promoCode,
    discountAmount
  }
}

/**
 * Check if cart has applicable items
 */
function checkApplicableItems(cartItems: CartItem[], promoCode: PromoCode): boolean {
  if (!promoCode.applicableProducts && !promoCode.applicableCategories) {
    return true // No restrictions
  }
  
  for (const item of cartItems) {
    // Check products
    if (promoCode.applicableProducts?.includes(item.productId)) {
      return true
    }
    
    // Check categories
    if (item.categoryId && promoCode.applicableCategories?.includes(item.categoryId)) {
      return true
    }
  }
  
  return false
}

/**
 * Calculate discount amount
 */
function calculateDiscount(
  cartTotal: number,
  cartItems: CartItem[],
  promoCode: PromoCode
): number {
  if (promoCode.discountType === 'free_shipping') {
    return 0 // Shipping discount handled separately
  }
  
  // Calculate applicable items total
  let applicableTotal = cartTotal
  
  if (promoCode.applicableProducts || promoCode.applicableCategories) {
    applicableTotal = cartItems
      .filter(item => {
        if (promoCode.applicableProducts?.includes(item.productId)) return true
        if (item.categoryId && promoCode.applicableCategories?.includes(item.categoryId)) return true
        return false
      })
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
  
  let discount = 0
  
  if (promoCode.discountType === 'percentage') {
    discount = applicableTotal * (promoCode.discountValue / 100)
    
    // Apply max discount cap if set
    if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
      discount = promoCode.maxDiscount
    }
  } else if (promoCode.discountType === 'fixed') {
    discount = Math.min(promoCode.discountValue, applicableTotal)
  }
  
  return Math.round(discount * 100) / 100 // Round to 2 decimals
}

/**
 * Apply promo code to cart
 */
export function applyPromoCode(
  cartTotal: number,
  cartItems: CartItem[],
  promoCode: PromoCode,
  shippingCost: number = 0
): PromoCodeApplication {
  const discountAmount = calculateDiscount(cartTotal, cartItems, promoCode)
  const freeShipping = promoCode.discountType === 'free_shipping'
  
  const newSubtotal = cartTotal - discountAmount
  const newShipping = freeShipping ? 0 : shippingCost
  const newTotal = newSubtotal + newShipping
  
  return {
    success: true,
    discountAmount,
    freeShipping,
    newSubtotal,
    newTotal,
    promoCode
  }
}

