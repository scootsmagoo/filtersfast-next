/**
 * Subscription Order Processing Utilities
 * Helper functions for processing subscription orders
 */

import { Subscription, SubscriptionItem } from './types/subscription'
import { sendEmail } from './email'
import { 
  generateUpcomingOrderEmail, 
  generateOrderProcessedEmail 
} from './email-templates/subscription-emails'

/**
 * Process a single subscription order
 */
export async function processSubscriptionOrder(
  subscription: Subscription,
  items: SubscriptionItem[],
  customerEmail: string,
  customerName: string
): Promise<{ orderId: string; orderNumber: string }> {
  
  // Validation
  if (items.length === 0) {
    throw new Error('Cannot process subscription with no items')
  }

  if (subscription.status !== 'active') {
    throw new Error('Cannot process non-active subscription')
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = subtotal * (subscription.discountPercentage / 100)
  const total = subtotal - discountAmount

  // Here you would:
  // 1. Create order in database
  // 2. Process payment using saved payment method
  // 3. Create shipping label
  // 4. Send confirmation email
  // 5. Update subscription next delivery date

  console.log(`Processing subscription ${subscription.id}:`, {
    items: items.length,
    subtotal: subtotal.toFixed(2),
    discount: discountAmount.toFixed(2),
    total: total.toFixed(2)
  })

  // Mock order creation (replace with actual implementation)
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const orderNumber = `FF${Date.now().toString().slice(-8)}`

  return { orderId, orderNumber }
}

/**
 * Send upcoming order reminder
 */
export async function sendSubscriptionReminder(
  subscription: Subscription,
  items: SubscriptionItem[],
  customerEmail: string,
  customerName: string,
  daysUntil: number = 3
): Promise<void> {
  const emailData = generateUpcomingOrderEmail(
    customerName,
    subscription,
    items,
    daysUntil
  )

  await sendEmail({
    to: customerEmail,
    subject: emailData.subject,
    html: emailData.html
  })

  console.log(`📧 Sent ${daysUntil}-day reminder to ${customerEmail}`)
}

/**
 * Calculate subscription next delivery date
 */
export function calculateNextDeliveryDate(
  currentDate: Date,
  frequency: number
): Date {
  const nextDate = new Date(currentDate)
  nextDate.setMonth(nextDate.getMonth() + frequency)
  return nextDate
}

/**
 * Check if subscription should be processed
 */
export function shouldProcessSubscription(subscription: Subscription): boolean {
  if (subscription.status !== 'active') {
    return false
  }

  const now = new Date()
  const nextDelivery = new Date(subscription.nextDeliveryDate)

  return nextDelivery <= now
}

/**
 * Check if subscription reminder should be sent
 */
export function shouldSendReminder(
  subscription: Subscription,
  daysBeforeDelivery: number = 3
): boolean {
  if (subscription.status !== 'active') {
    return false
  }

  const now = new Date()
  const nextDelivery = new Date(subscription.nextDeliveryDate)
  const reminderDate = new Date(nextDelivery)
  reminderDate.setDate(reminderDate.getDate() - daysBeforeDelivery)

  return now >= reminderDate && now < nextDelivery
}

/**
 * Validate subscription items before processing
 */
export function validateSubscriptionItems(items: SubscriptionItem[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (items.length === 0) {
    errors.push('Subscription has no items')
    return { valid: false, errors }
  }

  items.forEach((item, index) => {
    if (!item.productId || !item.productName) {
      errors.push(`Item ${index + 1}: Missing product information`)
    }
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`)
    }
    if (item.price <= 0) {
      errors.push(`Item ${index + 1}: Invalid price`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get subscription statistics for reporting
 */
export function calculateSubscriptionMetrics(subscriptions: Subscription[]) {
  const active = subscriptions.filter(s => s.status === 'active').length
  const paused = subscriptions.filter(s => s.status === 'paused').length
  const cancelled = subscriptions.filter(s => s.status === 'cancelled').length

  const churnRate = subscriptions.length > 0 
    ? (cancelled / subscriptions.length) * 100 
    : 0

  return {
    total: subscriptions.length,
    active,
    paused,
    cancelled,
    churnRate: parseFloat(churnRate.toFixed(2))
  }
}



