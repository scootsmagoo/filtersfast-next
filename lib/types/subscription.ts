/**
 * Subscription System Types
 * For Subscribe & Save recurring orders (Home Filter Club)
 */

export interface Subscription {
  id: string
  customerId: string
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  frequency: number // In months (1-12)
  nextDeliveryDate: Date
  lastOrderDate?: Date
  lastOrderId?: string
  createdAt: Date
  updatedAt: Date
  pausedUntil?: Date
  cancellationReason?: string
  cancellationDate?: Date
  discountPercentage: number // Default 5% for Subscribe & Save
}

export interface SubscriptionItem {
  id: string
  subscriptionId: string
  productId: string
  productName: string
  productImage?: string
  quantity: number
  price: number // Price at time of subscription
  addedAt: Date
}

export interface SubscriptionHistory {
  id: string
  subscriptionId: string
  action: 
    | 'created' 
    | 'paused' 
    | 'resumed' 
    | 'cancelled' 
    | 'item_added' 
    | 'item_removed' 
    | 'frequency_changed'
    | 'order_processed'
  details?: string
  performedAt: Date
  performedBy?: string // Customer or system
}

export interface CreateSubscriptionRequest {
  customerId: string
  frequency: number // 1-12 months
  items: {
    productId: string
    productName: string
    productImage?: string
    quantity: number
    price: number
  }[]
}

export interface UpdateSubscriptionRequest {
  frequency?: number
  pausedUntil?: Date
  status?: 'active' | 'paused' | 'cancelled'
  cancellationReason?: string
}

export interface AddSubscriptionItemRequest {
  subscriptionId: string
  productId: string
  productName: string
  productImage?: string
  quantity: number
  price: number
}

export interface SubscriptionSummary {
  subscription: Subscription
  items: SubscriptionItem[]
  itemCount: number
  totalPrice: number
  totalWithDiscount: number
  nextDelivery: string
  canPause: boolean
  canResume: boolean
  canCancel: boolean
}

// For "Subscribe & Save" product page option
export interface SubscriptionOption {
  enabled: boolean
  discount: number // Percentage (typically 5%)
  frequencies: number[] // Available frequencies [1, 2, 3, 6, 12]
  defaultFrequency: number // Default selection (typically 6 months)
}

// Upcoming order preview
export interface UpcomingOrder {
  subscriptionId: string
  scheduledDate: Date
  items: SubscriptionItem[]
  estimatedTotal: number
  canAddItems: boolean
  canSkip: boolean
}

