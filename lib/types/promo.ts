/**
 * Promo Code Types
 * Supports percentage discounts, fixed amounts, and free shipping
 */

export interface PromoCode {
  id: string
  code: string // Unique promo code (e.g., "SAVE20")
  description: string
  discountType: 'percentage' | 'fixed' | 'free_shipping'
  discountValue: number // Percentage (0-100) or fixed amount
  minOrderAmount?: number // Minimum order to qualify
  maxDiscount?: number // Max discount cap for percentage
  startDate: Date
  endDate: Date
  usageLimit?: number // Total uses allowed
  usageCount: number // Current usage count
  perCustomerLimit?: number // Uses per customer
  applicableProducts?: string[] // Specific product IDs (null = all)
  applicableCategories?: string[] // Specific categories (null = all)
  firstTimeOnly: boolean // Only for first-time customers
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PromoCodeUsage {
  id: string
  promoCodeId: string
  customerId: string
  orderId: string
  discountAmount: number
  usedAt: Date
}

export interface PromoCodeValidation {
  valid: boolean
  promoCode?: PromoCode
  discountAmount?: number
  error?: string
  errorCode?: 
    | 'NOT_FOUND'
    | 'EXPIRED'
    | 'NOT_STARTED'
    | 'INACTIVE'
    | 'USAGE_LIMIT_REACHED'
    | 'CUSTOMER_LIMIT_REACHED'
    | 'MIN_ORDER_NOT_MET'
    | 'FIRST_TIME_ONLY'
    | 'PRODUCTS_NOT_APPLICABLE'
}

export interface CartItem {
  productId: string
  quantity: number
  price: number
  categoryId?: string
}

export interface PromoCodeRequest {
  code: string
  cartTotal: number
  cartItems: CartItem[]
  customerId?: string
  isFirstTimeCustomer?: boolean
}

export interface PromoCodeApplication {
  success: boolean
  discountAmount: number
  freeShipping: boolean
  newSubtotal: number
  newTotal: number
  promoCode: PromoCode
}

