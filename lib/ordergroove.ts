/**
 * OrderGroove API Integration
 * Handles communication with OrderGroove subscription management platform
 * 
 * OrderGroove provides subscription management, order scheduling, and customer portal
 * This integration allows syncing subscriptions with OrderGroove if enabled
 */

import crypto from 'crypto'

// Environment configuration
const ORDERGROOVE_CONFIG = {
  enabled: process.env.ORDERGROOVE_ENABLED === 'true',
  merchantId: process.env.ORDERGROOVE_MERCHANT_ID || '',
  apiKey: process.env.ORDERGROOVE_API_KEY || '',
  hashKey: process.env.ORDERGROOVE_HASH_KEY || '',
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://restapi.ordergroove.com'
    : 'https://staging.restapi.ordergroove.com',
  portalUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.ordergroove.com'
    : 'https://staging.v2.ordergroove.com'
}

/**
 * OrderGroove Subscription Data
 */
export interface OGSubscription {
  merchant: string
  customer: string
  product: string
  offer: string
  order: string
  session_id: string
  payment: string
  shipping_address: string
  quantity: number
  every: number // Frequency value
  every_period: number // Period type (3 = months)
}

/**
 * OrderGroove Order Data
 */
export interface OGOrder {
  public_id: string
  customer: string
  merchant: string
  payment: string
  shipping_address: string
  place: string // Next order date
  status: number // 1 = active
}

/**
 * OrderGroove Item Data (for one-time additions)
 */
export interface OGItem {
  order: string
  offer: string
  product: string
  quantity: number
}

/**
 * Generate OrderGroove authentication hash
 */
export function generateOGHash(userId: string): string {
  if (!ORDERGROOVE_CONFIG.hashKey) {
    throw new Error('OrderGroove hash key not configured')
  }

  // RC4 encryption + Base64 encoding (as used in legacy system)
  const cipher = crypto.createCipheriv(
    'rc4',
    Buffer.from(ORDERGROOVE_CONFIG.hashKey),
    ''
  )
  
  let encrypted = cipher.update(userId.toString(), 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  return encrypted
}

/**
 * Generate HMAC signature for OrderGroove API v2
 */
export function generateOGSignature(userId: string, timestamp: number): string {
  if (!ORDERGROOVE_CONFIG.hashKey) {
    throw new Error('OrderGroove hash key not configured')
  }

  const stringToSign = `${userId}|${timestamp}`
  const hmac = crypto.createHmac('sha256', ORDERGROOVE_CONFIG.hashKey)
  hmac.update(stringToSign)
  
  return hmac.digest('base64')
}

/**
 * Generate OrderGroove auth cookie value
 */
export function generateOGAuthCookie(userId: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = generateOGSignature(userId, timestamp)
  
  return `${userId}|${timestamp}|${signature}`
}

/**
 * Get OrderGroove portal URL for customer
 */
export function getOGPortalUrl(userId: string): string {
  if (!ORDERGROOVE_CONFIG.enabled) {
    throw new Error('OrderGroove is not enabled')
  }

  const userHash = generateOGHash(userId)
  
  return `${ORDERGROOVE_CONFIG.portalUrl}/static/js/${ORDERGROOVE_CONFIG.merchantId}/5/main.html?merchant_id=${ORDERGROOVE_CONFIG.merchantId}&merchant_user_id=${userId}&merchant_user_hash=${encodeURIComponent(userHash)}`
}

/**
 * Create subscription via OrderGroove API
 */
export async function createOGSubscription(
  subscription: OGSubscription
): Promise<any> {
  if (!ORDERGROOVE_CONFIG.enabled) {
    return { success: true, source: 'in-house' }
  }

  try {
    const response = await fetch(
      `${ORDERGROOVE_CONFIG.apiUrl}/subscriptions/iu/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ORDERGROOVE_CONFIG.apiKey
        },
        body: JSON.stringify(subscription)
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OrderGroove API error: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating OrderGroove subscription:', error)
    throw error
  }
}

/**
 * Add item to existing OrderGroove order (one-time)
 */
export async function addOGItem(item: OGItem): Promise<any> {
  if (!ORDERGROOVE_CONFIG.enabled) {
    return { success: true, source: 'in-house' }
  }

  try {
    const response = await fetch(
      `${ORDERGROOVE_CONFIG.apiUrl}/items/iu/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ORDERGROOVE_CONFIG.apiKey
        },
        body: JSON.stringify(item)
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OrderGroove API error: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error adding OrderGroove item:', error)
    throw error
  }
}

/**
 * Get customer's upcoming orders from OrderGroove
 */
export async function getOGOrders(customerId: string): Promise<OGOrder[]> {
  if (!ORDERGROOVE_CONFIG.enabled) {
    return []
  }

  try {
    const response = await fetch(
      `${ORDERGROOVE_CONFIG.apiUrl}/orders/?status=1&customer=${customerId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': ORDERGROOVE_CONFIG.apiKey
        }
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OrderGroove API error: ${error}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error getting OrderGroove orders:', error)
    throw error
  }
}

/**
 * Get customer's subscriptions from OrderGroove
 */
export async function getOGSubscriptions(
  customerId: string,
  shippingId?: string
): Promise<any[]> {
  if (!ORDERGROOVE_CONFIG.enabled) {
    return []
  }

  try {
    let url = `${ORDERGROOVE_CONFIG.apiUrl}/subscriptions/?customer=${customerId}`
    if (shippingId) {
      url += `&shipping_address=${shippingId}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': ORDERGROOVE_CONFIG.apiKey
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OrderGroove API error: ${error}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error getting OrderGroove subscriptions:', error)
    throw error
  }
}

/**
 * Update customer email in OrderGroove
 */
export async function updateOGCustomerEmail(
  userId: string,
  oldEmail: string,
  newEmail: string
): Promise<any> {
  if (!ORDERGROOVE_CONFIG.enabled) {
    return { success: true, source: 'in-house' }
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = generateOGSignature(userId, timestamp)

    const updateRequest = {
      merchant_id: ORDERGROOVE_CONFIG.merchantId,
      user: {
        user_id: userId,
        ts: timestamp,
        sig: signature,
        new_email: newEmail
      }
    }

    const response = await fetch(
      `${ORDERGROOVE_CONFIG.portalUrl}/customer/update_customer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `update_request=${encodeURIComponent(JSON.stringify(updateRequest))}`
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OrderGroove API error: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating OrderGroove customer email:', error)
    throw error
  }
}

/**
 * Calculate subscription discount based on product and item count
 */
export function calculateSubscriptionDiscount(
  itemCount: number,
  isPrivateLabel: boolean = false
): number {
  // Check for promotional discount (through Dec 5, 2025)
  const promoEndDate = new Date('2025-12-05T23:59:59')
  const isPromoActive = new Date() <= promoEndDate

  if (isPrivateLabel) {
    // FiltersFast branded products
    if (isPromoActive) {
      return 20 // Cyber Week promotion
    } else {
      return 10 // Standard subscription discount
    }
  } else {
    // Non-FiltersFast products
    return 5
  }
}

/**
 * Get subscription discount for display
 */
export function getSubscriptionDiscountPercentage(
  productId: string,
  isPrivateLabel: boolean = false
): number {
  return calculateSubscriptionDiscount(1, isPrivateLabel)
}

/**
 * Format OrderGroove product ID (includes variant if applicable)
 */
export function formatOGProductId(productId: string, variantId?: string): string {
  if (variantId) {
    return `${productId}-${variantId}`
  }
  return productId
}

/**
 * Parse OrderGroove product ID
 */
export function parseOGProductId(ogProductId: string): { 
  productId: string
  variantId?: string 
} {
  const parts = ogProductId.split('-')
  if (parts.length > 1) {
    return {
      productId: parts[0],
      variantId: parts.slice(1).join('-')
    }
  }
  return { productId: ogProductId }
}

/**
 * Check if OrderGroove integration is enabled
 */
export function isOrderGrooveEnabled(): boolean {
  return ORDERGROOVE_CONFIG.enabled
}

/**
 * Get OrderGroove configuration
 */
export function getOrderGrooveConfig() {
  return {
    enabled: ORDERGROOVE_CONFIG.enabled,
    merchantId: ORDERGROOVE_CONFIG.merchantId,
    apiUrl: ORDERGROOVE_CONFIG.apiUrl,
    portalUrl: ORDERGROOVE_CONFIG.portalUrl
  }
}

/**
 * Webhook payload types
 */
export interface OGWebhookPayload {
  event_type: string
  merchant_id: string
  timestamp: number
  data: any
}

/**
 * Verify OrderGroove webhook signature
 */
export function verifyOGWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!ORDERGROOVE_CONFIG.hashKey) {
    throw new Error('OrderGroove hash key not configured')
  }

  const hmac = crypto.createHmac('sha256', ORDERGROOVE_CONFIG.hashKey)
  hmac.update(payload)
  const calculatedSignature = hmac.digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  )
}

/**
 * Process OrderGroove webhook events
 */
export async function processOGWebhook(
  eventType: string,
  data: any
): Promise<void> {
  console.log(`Processing OrderGroove webhook: ${eventType}`, data)

  switch (eventType) {
    case 'subscription.created':
      // Handle subscription creation
      break
    case 'subscription.updated':
      // Handle subscription update
      break
    case 'subscription.cancelled':
      // Handle subscription cancellation
      break
    case 'order.placed':
      // Handle order placement
      break
    case 'order.failed':
      // Handle order failure
      break
    default:
      console.log(`Unknown OrderGroove webhook event: ${eventType}`)
  }
}



