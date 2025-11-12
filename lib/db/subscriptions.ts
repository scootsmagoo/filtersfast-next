/**
 * Subscription Database Operations
 * Handles all subscription-related database queries for Subscribe & Save (Home Filter Club)
 */

import Database from 'better-sqlite3'
import { 
  Subscription, 
  SubscriptionItem, 
  SubscriptionHistory,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  AddSubscriptionItemRequest
} from '@/lib/types/subscription'

const db = new Database('filtersfast.db')
db.pragma('foreign_keys = ON')

/**
 * Initialize subscription tables
 */
export async function initSubscriptionTables() {
  try {
    // Subscriptions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'cancelled', 'expired')),
        frequency INTEGER NOT NULL CHECK(frequency BETWEEN 1 AND 12),
        next_delivery_date TEXT NOT NULL,
        last_order_date TEXT,
        last_order_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        paused_until TEXT,
        cancellation_reason TEXT,
        cancellation_date TEXT,
        discount_percentage REAL NOT NULL DEFAULT 5.0,
        og_subscription_id TEXT,
        og_order_id TEXT,
        og_merchant_id TEXT,
        og_customer_id TEXT,
        og_payment_id TEXT,
        og_shipping_id TEXT,
        og_offer_id TEXT,
        og_session_id TEXT,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Subscription items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_items (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        product_image TEXT,
        product_sku TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL,
        added_at TEXT NOT NULL,
        og_product_id TEXT,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
      )
    `)

    // Subscription history table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_history (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN (
          'created', 'paused', 'resumed', 'cancelled', 
          'item_added', 'item_removed', 'frequency_changed',
          'order_processed', 'updated', 'skipped'
        )),
        details TEXT,
        performed_at TEXT NOT NULL,
        performed_by TEXT,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
      )
    `)

    // Subscription logs table (for OrderGroove API interactions)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_logs (
        id TEXT PRIMARY KEY,
        subscription_id TEXT,
        customer_id TEXT,
        event_type TEXT NOT NULL,
        event_log TEXT,
        event_timestamp TEXT NOT NULL,
        og_response TEXT
      )
    `)

    // Create indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_customer 
        ON subscriptions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
        ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery 
        ON subscriptions(next_delivery_date);
      CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription 
        ON subscription_items(subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription 
        ON subscription_history(subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_logs_customer 
        ON subscription_logs(customer_id);
    `)

    console.log('Subscription tables initialized successfully')
  } catch (error) {
    console.error('Error initializing subscription tables:', error)
    throw error
  }
}

/**
 * Get all subscriptions for a customer
 */
export async function getCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
  try {
    const subscriptions = await db.prepare(`
      SELECT * FROM subscriptions 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `).all(customerId)

    return subscriptions.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      status: row.status as Subscription['status'],
      frequency: row.frequency,
      nextDeliveryDate: new Date(row.next_delivery_date),
      lastOrderDate: row.last_order_date ? new Date(row.last_order_date) : undefined,
      lastOrderId: row.last_order_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      pausedUntil: row.paused_until ? new Date(row.paused_until) : undefined,
      cancellationReason: row.cancellation_reason || undefined,
      cancellationDate: row.cancellation_date ? new Date(row.cancellation_date) : undefined,
      discountPercentage: row.discount_percentage
    }))
  } catch (error) {
    console.error('Error getting customer subscriptions:', error)
    throw error
  }
}

/**
 * Get a single subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Subscription | null> {
  try {
    const row = await db.prepare(`
      SELECT * FROM subscriptions WHERE id = ?
    `).get(subscriptionId)

    if (!row) return null

    return {
      id: row.id,
      customerId: row.customer_id,
      status: row.status as Subscription['status'],
      frequency: row.frequency,
      nextDeliveryDate: new Date(row.next_delivery_date),
      lastOrderDate: row.last_order_date ? new Date(row.last_order_date) : undefined,
      lastOrderId: row.last_order_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      pausedUntil: row.paused_until ? new Date(row.paused_until) : undefined,
      cancellationReason: row.cancellation_reason || undefined,
      cancellationDate: row.cancellation_date ? new Date(row.cancellation_date) : undefined,
      discountPercentage: row.discount_percentage
    }
  } catch (error) {
    console.error('Error getting subscription:', error)
    throw error
  }
}

/**
 * Get subscription items
 */
export async function getSubscriptionItems(subscriptionId: string): Promise<SubscriptionItem[]> {
  try {
    const items = await db.prepare(`
      SELECT * FROM subscription_items 
      WHERE subscription_id = ? 
      ORDER BY added_at ASC
    `).all(subscriptionId)

    return items.map(row => ({
      id: row.id,
      subscriptionId: row.subscription_id,
      productId: row.product_id,
      productName: row.product_name,
      productImage: row.product_image || undefined,
      quantity: row.quantity,
      price: row.price,
      addedAt: new Date(row.added_at)
    }))
  } catch (error) {
    console.error('Error getting subscription items:', error)
    throw error
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
  try {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    // Calculate next delivery date
    const nextDelivery = new Date()
    nextDelivery.setMonth(nextDelivery.getMonth() + request.frequency)
    
    // Determine discount percentage (5% default, 10% for 3+ items)
    const discountPercentage = request.items.length >= 3 ? 10 : 5

    // Insert subscription
    await db.prepare(`
      INSERT INTO subscriptions (
        id, customer_id, status, frequency, next_delivery_date,
        created_at, updated_at, discount_percentage
      ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?)
    `).run(
      subscriptionId,
      request.customerId,
      request.frequency,
      nextDelivery.toISOString(),
      now,
      now,
      discountPercentage
    )

    // Insert subscription items
    for (const item of request.items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await db.prepare(`
        INSERT INTO subscription_items (
          id, subscription_id, product_id, product_name, 
          product_image, quantity, price, added_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        subscriptionId,
        item.productId,
        item.productName,
        item.productImage || null,
        item.quantity,
        item.price,
        now
      )
    }

    // Log subscription creation
    await logSubscriptionEvent(subscriptionId, request.customerId, 'created', 
      `Subscription created with ${request.items.length} items, frequency: ${request.frequency} months`)

    const subscription = await getSubscription(subscriptionId)
    if (!subscription) {
      throw new Error('Failed to retrieve created subscription')
    }

    return subscription
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string, 
  updates: UpdateSubscriptionRequest
): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    const setClauses: string[] = ['updated_at = ?']
    const values: any[] = [now]

    if (updates.frequency !== undefined) {
      setClauses.push('frequency = ?')
      values.push(updates.frequency)
      
      // Recalculate next delivery date
      const nextDelivery = new Date()
      nextDelivery.setMonth(nextDelivery.getMonth() + updates.frequency)
      setClauses.push('next_delivery_date = ?')
      values.push(nextDelivery.toISOString())
    }

    if (updates.status !== undefined) {
      setClauses.push('status = ?')
      values.push(updates.status)
    }

    if (updates.pausedUntil !== undefined) {
      setClauses.push('paused_until = ?')
      values.push(updates.pausedUntil.toISOString())
    }

    if (updates.cancellationReason !== undefined) {
      setClauses.push('cancellation_reason = ?')
      values.push(updates.cancellationReason)
      
      if (updates.status === 'cancelled') {
        setClauses.push('cancellation_date = ?')
        values.push(now)
      }
    }

    values.push(subscriptionId)

    await db.prepare(`
      UPDATE subscriptions 
      SET ${setClauses.join(', ')} 
      WHERE id = ?
    `).run(...values)

    // Log the update
    const subscription = await getSubscription(subscriptionId)
    if (subscription) {
      await logSubscriptionEvent(
        subscriptionId, 
        subscription.customerId, 
        'updated',
        JSON.stringify(updates)
      )
    }

    return true
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(
  subscriptionId: string, 
  pausedUntil?: Date
): Promise<boolean> {
  try {
    await updateSubscription(subscriptionId, {
      status: 'paused',
      pausedUntil
    })

    const subscription = await getSubscription(subscriptionId)
    if (subscription) {
      await logSubscriptionEvent(
        subscriptionId,
        subscription.customerId,
        'paused',
        pausedUntil ? `Paused until ${pausedUntil.toISOString()}` : 'Paused indefinitely'
      )
    }

    return true
  } catch (error) {
    console.error('Error pausing subscription:', error)
    throw error
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    
    await db.prepare(`
      UPDATE subscriptions 
      SET status = 'active', paused_until = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, subscriptionId)

    const subscription = await getSubscription(subscriptionId)
    if (subscription) {
      await logSubscriptionEvent(
        subscriptionId,
        subscription.customerId,
        'resumed',
        'Subscription resumed'
      )
    }

    return true
  } catch (error) {
    console.error('Error resuming subscription:', error)
    throw error
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string, 
  reason?: string
): Promise<boolean> {
  try {
    await updateSubscription(subscriptionId, {
      status: 'cancelled',
      cancellationReason: reason
    })

    const subscription = await getSubscription(subscriptionId)
    if (subscription) {
      await logSubscriptionEvent(
        subscriptionId,
        subscription.customerId,
        'cancelled',
        reason || 'Cancelled by customer'
      )
    }

    return true
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

/**
 * Add item to subscription
 */
export async function addSubscriptionItem(
  subscriptionId: string,
  item: Omit<SubscriptionItem, 'id' | 'subscriptionId' | 'addedAt'>
): Promise<SubscriptionItem> {
  try {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    await db.prepare(`
      INSERT INTO subscription_items (
        id, subscription_id, product_id, product_name,
        product_image, quantity, price, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      itemId,
      subscriptionId,
      item.productId,
      item.productName,
      item.productImage || null,
      item.quantity,
      item.price,
      now
    )

    const subscription = await getSubscription(subscriptionId)
    if (subscription) {
      await logSubscriptionEvent(
        subscriptionId,
        subscription.customerId,
        'item_added',
        `Added ${item.productName} (qty: ${item.quantity})`
      )
    }

    return {
      id: itemId,
      subscriptionId,
      ...item,
      addedAt: new Date(now)
    }
  } catch (error) {
    console.error('Error adding subscription item:', error)
    throw error
  }
}

/**
 * Remove item from subscription
 */
export async function removeSubscriptionItem(itemId: string): Promise<boolean> {
  try {
    // Get item details before deleting
    const item = await db.prepare(`
      SELECT si.*, s.customer_id 
      FROM subscription_items si
      JOIN subscriptions s ON si.subscription_id = s.id
      WHERE si.id = ?
    `).get(itemId)

    if (!item) return false

    await db.prepare(`
      DELETE FROM subscription_items WHERE id = ?
    `).run(itemId)

    await logSubscriptionEvent(
      item.subscription_id,
      item.customer_id,
      'item_removed',
      `Removed ${item.product_name} (qty: ${item.quantity})`
    )

    return true
  } catch (error) {
    console.error('Error removing subscription item:', error)
    throw error
  }
}

/**
 * Get subscriptions due for processing
 */
export async function getSubscriptionsDueForProcessing(): Promise<Subscription[]> {
  try {
    const now = new Date().toISOString()
    
    const subscriptions = await db.prepare(`
      SELECT * FROM subscriptions 
      WHERE status = 'active' 
      AND next_delivery_date <= ? 
      ORDER BY next_delivery_date ASC
    `).all(now)

    return subscriptions.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      status: row.status as Subscription['status'],
      frequency: row.frequency,
      nextDeliveryDate: new Date(row.next_delivery_date),
      lastOrderDate: row.last_order_date ? new Date(row.last_order_date) : undefined,
      lastOrderId: row.last_order_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      pausedUntil: row.paused_until ? new Date(row.paused_until) : undefined,
      cancellationReason: row.cancellation_reason || undefined,
      cancellationDate: row.cancellation_date ? new Date(row.cancellation_date) : undefined,
      discountPercentage: row.discount_percentage
    }))
  } catch (error) {
    console.error('Error getting subscriptions due for processing:', error)
    throw error
  }
}

/**
 * Mark subscription as processed
 */
export async function markSubscriptionProcessed(
  subscriptionId: string,
  orderId: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    const subscription = await getSubscription(subscriptionId)
    
    if (!subscription) return false

    // Calculate next delivery date
    const nextDelivery = new Date()
    nextDelivery.setMonth(nextDelivery.getMonth() + subscription.frequency)

    await db.prepare(`
      UPDATE subscriptions 
      SET last_order_date = ?,
          last_order_id = ?,
          next_delivery_date = ?,
          updated_at = ?
      WHERE id = ?
    `).run(now, orderId, nextDelivery.toISOString(), now, subscriptionId)

    await logSubscriptionEvent(
      subscriptionId,
      subscription.customerId,
      'order_processed',
      `Order ${orderId} processed, next delivery: ${nextDelivery.toISOString()}`
    )

    return true
  } catch (error) {
    console.error('Error marking subscription as processed:', error)
    throw error
  }
}

/**
 * Check if customer already has subscription for a product
 */
export async function hasActiveSubscriptionForProduct(
  customerId: string,
  productId: string,
): Promise<boolean> {
  try {
    const row = await db
      .prepare(`
        SELECT COUNT(*) AS count
        FROM subscription_items si
        INNER JOIN subscriptions s ON si.subscription_id = s.id
        WHERE s.customer_id = ?
          AND si.product_id = ?
          AND s.status IN ('active', 'paused')
      `)
      .get(customerId, productId) as { count: number } | undefined

    return (row?.count ?? 0) > 0
  } catch (error) {
    console.error('Error checking subscription duplicates:', error)
    throw error
  }
}

/**
 * Log subscription event
 */
export async function logSubscriptionEvent(
  subscriptionId: string,
  customerId: string,
  eventType: string,
  details?: string,
  ogResponse?: string
): Promise<void> {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    await db.prepare(`
      INSERT INTO subscription_logs (
        id, subscription_id, customer_id, event_type,
        event_log, event_timestamp, og_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      subscriptionId,
      customerId,
      eventType,
      details || null,
      now,
      ogResponse || null
    )
  } catch (error) {
    console.error('Error logging subscription event:', error)
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Get subscription history
 */
export async function getSubscriptionHistory(
  subscriptionId: string
): Promise<SubscriptionHistory[]> {
  try {
    const history = await db.prepare(`
      SELECT * FROM subscription_history 
      WHERE subscription_id = ? 
      ORDER BY performed_at DESC
    `).all(subscriptionId)

    return history.map(row => ({
      id: row.id,
      subscriptionId: row.subscription_id,
      action: row.action as SubscriptionHistory['action'],
      details: row.details || undefined,
      performedAt: new Date(row.performed_at),
      performedBy: row.performed_by || undefined
    }))
  } catch (error) {
    console.error('Error getting subscription history:', error)
    throw error
  }
}

/**
 * Check if customer has active subscription
 */
export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM subscriptions 
      WHERE customer_id = ? AND status = 'active'
    `).get(customerId)

    return result.count > 0
  } catch (error) {
    console.error('Error checking active subscription:', error)
    return false
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(customerId?: string) {
  try {
    let query = `
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(*) as total_count
      FROM subscriptions
    `
    
    if (customerId) {
      query += ' WHERE customer_id = ?'
      return await db.prepare(query).get(customerId)
    } else {
      return await db.prepare(query).get()
    }
  } catch (error) {
    console.error('Error getting subscription stats:', error)
    throw error
  }
}

