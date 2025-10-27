/**
 * Mock Subscription Data (for testing without database)
 */

import { Subscription, SubscriptionItem, SubscriptionHistory } from '@/lib/types/subscription'

// Sample subscriptions for testing
export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    customerId: 'user-123',
    status: 'active',
    frequency: 6, // Every 6 months
    nextDeliveryDate: new Date('2025-12-15'),
    lastOrderDate: new Date('2025-06-15'),
    lastOrderId: 'order-456',
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2025-06-15'),
    discountPercentage: 5
  },
  {
    id: 'sub-2',
    customerId: 'user-123',
    status: 'paused',
    frequency: 3, // Every 3 months
    nextDeliveryDate: new Date('2025-11-01'),
    pausedUntil: new Date('2025-12-01'),
    lastOrderDate: new Date('2025-08-01'),
    lastOrderId: 'order-789',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-10-15'),
    discountPercentage: 5
  }
]

export const MOCK_SUBSCRIPTION_ITEMS: SubscriptionItem[] = [
  {
    id: 'item-1',
    subscriptionId: 'sub-1',
    productId: 'prod-1',
    productName: 'Nordic Pure 20x20x1 MERV 12 Air Filter',
    productImage: '/images/air-filter-1.jpg',
    quantity: 4,
    price: 12.99,
    addedAt: new Date('2024-12-15')
  },
  {
    id: 'item-2',
    subscriptionId: 'sub-1',
    productId: 'prod-2',
    productName: 'GE MWF Refrigerator Water Filter',
    productImage: '/products/ge-mwf.jpg',
    quantity: 1,
    price: 29.99,
    addedAt: new Date('2025-03-20')
  },
  {
    id: 'item-3',
    subscriptionId: 'sub-2',
    productId: 'prod-3',
    productName: 'Filtrete 16x25x1 MPR 1500 Air Filter',
    productImage: '/images/air-filter-2.jpg',
    quantity: 2,
    price: 15.99,
    addedAt: new Date('2025-02-01')
  }
]

/**
 * Get subscriptions by customer ID (mock)
 */
export function getCustomerSubscriptionsMock(customerId: string): Subscription[] {
  return MOCK_SUBSCRIPTIONS.filter(sub => sub.customerId === customerId)
}

/**
 * Get subscription by ID (mock)
 */
export function getSubscriptionMock(subscriptionId: string): Subscription | null {
  return MOCK_SUBSCRIPTIONS.find(sub => sub.id === subscriptionId) || null
}

/**
 * Get subscription items (mock)
 */
export function getSubscriptionItemsMock(subscriptionId: string): SubscriptionItem[] {
  return MOCK_SUBSCRIPTION_ITEMS.filter(item => item.subscriptionId === subscriptionId)
}

/**
 * Create subscription (mock)
 */
export function createSubscriptionMock(
  customerId: string,
  frequency: number,
  items: Omit<SubscriptionItem, 'id' | 'subscriptionId' | 'addedAt'>[]
): Subscription {
  const subscriptionId = `sub-${Date.now()}`
  const now = new Date()
  
  // Calculate next delivery date
  const nextDeliveryDate = new Date()
  nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + frequency)
  
  const subscription: Subscription = {
    id: subscriptionId,
    customerId,
    status: 'active',
    frequency,
    nextDeliveryDate,
    createdAt: now,
    updatedAt: now,
    discountPercentage: 5
  }
  
  MOCK_SUBSCRIPTIONS.push(subscription)
  
  // Add items
  items.forEach(item => {
    MOCK_SUBSCRIPTION_ITEMS.push({
      ...item,
      id: `item-${Date.now()}-${Math.random()}`,
      subscriptionId,
      addedAt: now
    })
  })
  
  return subscription
}

/**
 * Update subscription (mock)
 */
export function updateSubscriptionMock(
  subscriptionId: string,
  updates: Partial<Subscription>
): boolean {
  const index = MOCK_SUBSCRIPTIONS.findIndex(sub => sub.id === subscriptionId)
  if (index === -1) return false
  
  MOCK_SUBSCRIPTIONS[index] = {
    ...MOCK_SUBSCRIPTIONS[index],
    ...updates,
    updatedAt: new Date()
  }
  
  return true
}

/**
 * Pause subscription (mock)
 */
export function pauseSubscriptionMock(
  subscriptionId: string,
  pausedUntil?: Date
): boolean {
  return updateSubscriptionMock(subscriptionId, {
    status: 'paused',
    pausedUntil: pausedUntil || undefined
  })
}

/**
 * Resume subscription (mock)
 */
export function resumeSubscriptionMock(subscriptionId: string): boolean {
  return updateSubscriptionMock(subscriptionId, {
    status: 'active',
    pausedUntil: undefined
  })
}

/**
 * Cancel subscription (mock)
 */
export function cancelSubscriptionMock(
  subscriptionId: string,
  reason?: string
): boolean {
  return updateSubscriptionMock(subscriptionId, {
    status: 'cancelled',
    cancellationReason: reason,
    cancellationDate: new Date()
  })
}

/**
 * Add item to subscription (mock)
 */
export function addSubscriptionItemMock(
  subscriptionId: string,
  item: Omit<SubscriptionItem, 'id' | 'subscriptionId' | 'addedAt'>
): SubscriptionItem {
  const newItem: SubscriptionItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random()}`,
    subscriptionId,
    addedAt: new Date()
  }
  
  MOCK_SUBSCRIPTION_ITEMS.push(newItem)
  return newItem
}

/**
 * Remove item from subscription (mock)
 */
export function removeSubscriptionItemMock(itemId: string): boolean {
  const index = MOCK_SUBSCRIPTION_ITEMS.findIndex(item => item.id === itemId)
  if (index === -1) return false
  
  MOCK_SUBSCRIPTION_ITEMS.splice(index, 1)
  return true
}

/**
 * Get subscription summary (mock)
 */
export function getSubscriptionSummaryMock(subscriptionId: string) {
  const subscription = getSubscriptionMock(subscriptionId)
  if (!subscription) return null
  
  const items = getSubscriptionItemsMock(subscriptionId)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalWithDiscount = totalPrice * (1 - subscription.discountPercentage / 100)
  
  return {
    subscription,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice,
    totalWithDiscount,
    nextDelivery: subscription.nextDeliveryDate.toLocaleDateString(),
    canPause: subscription.status === 'active',
    canResume: subscription.status === 'paused',
    canCancel: subscription.status !== 'cancelled'
  }
}

