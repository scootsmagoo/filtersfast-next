/**
 * Order Management Types
 * For e-commerce order processing and admin management
 */

export type OrderStatus =
  | 'pending'           // Order created, payment pending
  | 'processing'        // Payment received, preparing to ship
  | 'shipped'           // Order shipped
  | 'delivered'         // Order delivered
  | 'cancelled'         // Order cancelled
  | 'refunded'          // Order refunded
  | 'on-hold'           // Order on hold (payment issue, stock issue, etc.)
  | 'failed'            // Payment failed

export type PaymentStatus =
  | 'pending'           // Payment pending
  | 'authorized'        // Payment authorized but not captured
  | 'paid'              // Payment captured/completed
  | 'failed'            // Payment failed
  | 'refunded'          // Fully refunded
  | 'partially-refunded'// Partially refunded
  | 'voided'            // Payment voided

export type ShippingStatus =
  | 'not-shipped'       // Not yet shipped
  | 'preparing'         // Preparing shipment
  | 'shipped'           // Shipped
  | 'in-transit'        // In transit
  | 'out-for-delivery'  // Out for delivery
  | 'delivered'         // Delivered
  | 'failed-delivery'   // Delivery attempt failed
  | 'returned'          // Returned to sender

export type PaymentMethod =
  | 'stripe'            // Stripe payment
  | 'paypal'            // PayPal
  | 'credit-card'       // Credit card (generic)
  | 'net-terms'         // Net payment terms (B2B)
  | 'store-credit'      // Store credit

export interface Order {
  id: string
  order_number: string  // Human-readable order number (e.g., "FF-2025-00123")
  
  // Customer Information
  user_id: string | null  // Null for guest orders
  customer_email: string
  customer_name: string
  is_guest: boolean
  
  // Order Status
  status: OrderStatus
  payment_status: PaymentStatus
  shipping_status: ShippingStatus
  
  // Pricing
  subtotal: number          // Before discounts
  discount_amount: number   // Total discounts applied
  shipping_cost: number
  tax_amount: number
  total: number             // Final total
  
  // Shipping Address (JSON)
  shipping_address: ShippingAddress
  
  // Billing Address (JSON, optional if same as shipping)
  billing_address: ShippingAddress | null
  
  // Payment Information
  payment_method: PaymentMethod
  payment_intent_id: string | null  // Stripe Payment Intent ID
  transaction_id: string | null     // Payment gateway transaction ID
  
  // Shipping Information
  shipping_method: string | null    // e.g., "FedEx Ground", "USPS Priority"
  tracking_number: string | null
  shipped_at: number | null
  delivered_at: number | null
  
  // Discount & Promo
  promo_code: string | null
  promo_discount: number
  
  // Donation
  donation_amount: number
  donation_charity_id: string | null
  
  // Subscription
  is_subscription: boolean
  subscription_id: string | null
  
  // B2B
  is_b2b: boolean
  b2b_account_id: string | null
  purchase_order_number: string | null
  
  // Metadata
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  source: string | null  // e.g., "web", "mobile", "marketplace"
  
  // Notes
  customer_notes: string | null
  internal_notes: string | null
  
  // Timestamps
  created_at: number
  updated_at: number
  cancelled_at: number | null
  refunded_at: number | null
}

export interface OrderItem {
  id: string
  order_id: string
  
  // Product Information
  product_id: string
  product_name: string
  product_sku: string
  product_image: string | null
  
  // Variant Information (if applicable)
  variant_id: string | null
  variant_name: string | null  // e.g., "20x25x1", "Blue", etc.
  
  // Pricing
  quantity: number
  unit_price: number      // Price per unit at time of order
  total_price: number     // quantity * unit_price
  discount: number        // Discount applied to this item
  
  // Fulfillment
  is_shipped: boolean
  shipped_quantity: number
  
  // Metadata
  created_at: number
}

export interface ShippingAddress {
  name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

export interface OrderNote {
  id: string
  order_id: string
  
  // Note Information
  note: string
  note_type: 'customer' | 'internal' | 'system'  // customer = visible to customer, internal = staff only, system = automated
  
  // Author
  author_id: string | null  // Admin user ID or null for system
  author_name: string       // Admin name or "System"
  author_email: string | null
  
  // Metadata
  created_at: number
}

export interface OrderHistory {
  id: string
  order_id: string
  
  // Change Information
  action: string            // e.g., "status_changed", "item_added", "refund_issued"
  old_value: string | null
  new_value: string | null
  description: string       // Human-readable description
  
  // Author
  performed_by_id: string | null  // Admin user ID or null for system
  performed_by_name: string       // Admin name, customer name, or "System"
  
  // Metadata
  created_at: number
}

export interface OrderRefund {
  id: string
  order_id: string
  
  // Refund Information
  amount: number
  reason: string
  refund_type: 'full' | 'partial'
  
  // Payment Gateway
  payment_intent_id: string
  refund_id: string  // Stripe refund ID or similar
  
  // Status
  status: 'pending' | 'succeeded' | 'failed'
  
  // Refunded Items (JSON array of item IDs)
  refunded_items: string[] | null  // Array of order_item IDs
  
  // Author
  processed_by_id: string | null
  processed_by_name: string
  
  // Metadata
  created_at: number
  processed_at: number | null
}

// ==================== Request/Response Types ====================

export interface CreateOrderRequest {
  // Customer
  user_id?: string
  customer_email: string
  customer_name: string
  is_guest?: boolean
  
  // Items
  items: Array<{
    product_id: string
    product_name: string
    product_sku: string
    product_image?: string
    variant_id?: string
    variant_name?: string
    quantity: number
    unit_price: number
  }>
  
  // Addresses
  shipping_address: ShippingAddress
  billing_address?: ShippingAddress
  
  // Payment
  payment_method: PaymentMethod
  payment_intent_id?: string
  
  // Pricing
  subtotal: number
  discount_amount?: number
  shipping_cost: number
  tax_amount: number
  total: number
  
  // Optional
  promo_code?: string
  promo_discount?: number
  donation_amount?: number
  donation_charity_id?: string
  customer_notes?: string
  shipping_method?: string
  
  // B2B
  is_b2b?: boolean
  b2b_account_id?: string
  purchase_order_number?: string
  
  // Subscription
  is_subscription?: boolean
  subscription_id?: string
  
  // Metadata
  ip_address?: string
  user_agent?: string
  referrer?: string
  source?: string
}

export interface UpdateOrderRequest {
  // Status Updates
  status?: OrderStatus
  payment_status?: PaymentStatus
  shipping_status?: ShippingStatus
  
  // Shipping Updates
  shipping_method?: string
  tracking_number?: string
  shipped_at?: number
  delivered_at?: number
  
  // Notes
  internal_notes?: string
  
  // Address Updates (only allow before shipping)
  shipping_address?: ShippingAddress
  billing_address?: ShippingAddress
}

export interface OrderFilters {
  status?: OrderStatus[]
  payment_status?: PaymentStatus[]
  shipping_status?: ShippingStatus[]
  date_from?: string  // ISO date
  date_to?: string    // ISO date
  search?: string     // Search in order number, customer name, email
  user_id?: string
  is_b2b?: boolean
  is_subscription?: boolean
  limit?: number
  offset?: number
}

export interface OrderStats {
  total_orders: number
  total_revenue: number
  
  // By Status
  pending_orders: number
  processing_orders: number
  shipped_orders: number
  delivered_orders: number
  cancelled_orders: number
  
  // By Payment Status
  paid_orders: number
  unpaid_orders: number
  refunded_orders: number
  
  // Today
  orders_today: number
  revenue_today: number
  
  // This Month
  orders_this_month: number
  revenue_this_month: number
  
  // Average Order Value
  average_order_value: number
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export interface OrderDetailResponse extends Order {
  items: OrderItem[]
  notes: OrderNote[]
  history: OrderHistory[]
  refunds: OrderRefund[]
}

// ==================== Admin Action Types ====================

export interface AddOrderNoteRequest {
  note: string
  note_type: 'internal' | 'customer'
}

export interface RefundOrderRequest {
  amount: number
  reason: string
  refund_type: 'full' | 'partial'
  refunded_items?: string[]  // Order item IDs
  notify_customer?: boolean
}

export interface CancelOrderRequest {
  reason: string
  refund?: boolean
  notify_customer?: boolean
}

export interface UpdateShippingRequest {
  shipping_method?: string
  tracking_number?: string
  carrier?: string
  notify_customer?: boolean
}

