/**
 * Order Database Functions
 * SQLite operations for order management
 */

import Database from 'better-sqlite3'
import type {
  Order,
  OrderItem,
  OrderNote,
  OrderHistory,
  OrderRefund,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters,
  OrderStats,
  ShippingAddress,
} from '@/lib/types/order'

const db = new Database('filtersfast.db')

// ==================== Order CRUD ====================

export function createOrder(data: CreateOrderRequest): Order {
  const order_id = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const order_number = generateOrderNumber()
  const now = Date.now()

  const stmt = db.prepare(`
    INSERT INTO orders (
      id, order_number, user_id, customer_email, customer_name, is_guest,
      status, payment_status, shipping_status,
      subtotal, discount_amount, shipping_cost, tax_amount, total,
      shipping_address, billing_address,
      payment_method, payment_intent_id, transaction_id,
      promo_code, promo_discount,
      donation_amount, donation_charity_id,
      is_subscription, subscription_id,
      is_b2b, b2b_account_id, purchase_order_number,
      customer_notes, ip_address, user_agent, referrer, source,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      'pending', 'pending', 'not-shipped',
      ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `)

  stmt.run(
    order_id,
    order_number,
    data.user_id || null,
    data.customer_email,
    data.customer_name,
    data.is_guest ? 1 : 0,
    data.subtotal,
    data.discount_amount || 0,
    data.shipping_cost,
    data.tax_amount,
    data.total,
    JSON.stringify(data.shipping_address),
    data.billing_address ? JSON.stringify(data.billing_address) : null,
    data.payment_method,
    data.payment_intent_id || null,
    null, // transaction_id set later
    data.promo_code || null,
    data.promo_discount || 0,
    data.donation_amount || 0,
    data.donation_charity_id || null,
    data.is_subscription ? 1 : 0,
    data.subscription_id || null,
    data.is_b2b ? 1 : 0,
    data.b2b_account_id || null,
    data.purchase_order_number || null,
    data.customer_notes || null,
    data.ip_address || null,
    data.user_agent || null,
    data.referrer || null,
    data.source || 'web',
    now,
    now
  )

  // Create order items
  const itemStmt = db.prepare(`
    INSERT INTO order_items (
      id, order_id, product_id, product_name, product_sku, product_image,
      variant_id, variant_name, quantity, unit_price, total_price, discount,
      is_shipped, shipped_quantity, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
  `)

  for (const item of data.items) {
    const item_id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const total_price = item.quantity * item.unit_price

    itemStmt.run(
      item_id,
      order_id,
      item.product_id,
      item.product_name,
      item.product_sku,
      item.product_image || null,
      item.variant_id || null,
      item.variant_name || null,
      item.quantity,
      item.unit_price,
      total_price,
      0, // discount calculated separately
      now
    )
  }

  // Create history entry
  addOrderHistory(order_id, {
    action: 'order_created',
    description: 'Order created',
    performed_by_name: data.is_guest ? 'Guest' : data.customer_name,
  })

  const order = getOrder(order_id)
  if (!order) {
    throw new Error('Failed to create order')
  }

  return order
}

export function getOrder(order_id: string): Order | null {
  const stmt = db.prepare('SELECT * FROM orders WHERE id = ?')
  const row = stmt.get(order_id) as any

  if (!row) return null

  return formatOrderRow(row)
}

export function getOrderByNumber(order_number: string): Order | null {
  const stmt = db.prepare('SELECT * FROM orders WHERE order_number = ?')
  const row = stmt.get(order_number) as any

  if (!row) return null

  return formatOrderRow(row)
}

export function updateOrder(order_id: string, data: UpdateOrderRequest, admin_id?: string, admin_name?: string): Order {
  const updates: string[] = []
  const values: any[] = []

  if (data.status) {
    updates.push('status = ?')
    values.push(data.status)
    addOrderHistory(order_id, {
      action: 'status_changed',
      old_value: getOrder(order_id)?.status || null,
      new_value: data.status,
      description: `Order status changed to ${data.status}`,
      performed_by_id: admin_id,
      performed_by_name: admin_name || 'System',
    })
  }

  if (data.payment_status) {
    updates.push('payment_status = ?')
    values.push(data.payment_status)
    addOrderHistory(order_id, {
      action: 'payment_status_changed',
      old_value: getOrder(order_id)?.payment_status || null,
      new_value: data.payment_status,
      description: `Payment status changed to ${data.payment_status}`,
      performed_by_id: admin_id,
      performed_by_name: admin_name || 'System',
    })
  }

  if (data.shipping_status) {
    updates.push('shipping_status = ?')
    values.push(data.shipping_status)
    addOrderHistory(order_id, {
      action: 'shipping_status_changed',
      old_value: getOrder(order_id)?.shipping_status || null,
      new_value: data.shipping_status,
      description: `Shipping status changed to ${data.shipping_status}`,
      performed_by_id: admin_id,
      performed_by_name: admin_name || 'System',
    })
  }

  if (data.shipping_method) {
    updates.push('shipping_method = ?')
    values.push(data.shipping_method)
  }

  if (data.tracking_number) {
    updates.push('tracking_number = ?')
    values.push(data.tracking_number)
    addOrderHistory(order_id, {
      action: 'tracking_added',
      new_value: data.tracking_number,
      description: `Tracking number added: ${data.tracking_number}`,
      performed_by_id: admin_id,
      performed_by_name: admin_name || 'System',
    })
  }

  if (data.shipped_at) {
    updates.push('shipped_at = ?')
    values.push(data.shipped_at)
  }

  if (data.delivered_at) {
    updates.push('delivered_at = ?')
    values.push(data.delivered_at)
  }

  if (data.internal_notes !== undefined) {
    updates.push('internal_notes = ?')
    values.push(data.internal_notes)
  }

  if (data.shipping_address) {
    updates.push('shipping_address = ?')
    values.push(JSON.stringify(data.shipping_address))
  }

  if (data.billing_address) {
    updates.push('billing_address = ?')
    values.push(JSON.stringify(data.billing_address))
  }

  if (updates.length === 0) {
    throw new Error('No fields to update')
  }

  updates.push('updated_at = ?')
  values.push(Date.now())
  values.push(order_id)

  const stmt = db.prepare(`
    UPDATE orders SET ${updates.join(', ')} WHERE id = ?
  `)

  stmt.run(...values)

  const order = getOrder(order_id)
  if (!order) {
    throw new Error('Order not found after update')
  }

  return order
}

export function listOrders(filters: OrderFilters = {}): { orders: Order[]; total: number } {
  const conditions: string[] = []
  const values: any[] = []

  if (filters.status && filters.status.length > 0) {
    conditions.push(`status IN (${filters.status.map(() => '?').join(', ')})`)
    values.push(...filters.status)
  }

  if (filters.payment_status && filters.payment_status.length > 0) {
    conditions.push(`payment_status IN (${filters.payment_status.map(() => '?').join(', ')})`)
    values.push(...filters.payment_status)
  }

  if (filters.shipping_status && filters.shipping_status.length > 0) {
    conditions.push(`shipping_status IN (${filters.shipping_status.map(() => '?').join(', ')})`)
    values.push(...filters.shipping_status)
  }

  if (filters.user_id) {
    conditions.push('user_id = ?')
    values.push(filters.user_id)
  }

  if (filters.is_b2b !== undefined) {
    conditions.push('is_b2b = ?')
    values.push(filters.is_b2b ? 1 : 0)
  }

  if (filters.is_subscription !== undefined) {
    conditions.push('is_subscription = ?')
    values.push(filters.is_subscription ? 1 : 0)
  }

  if (filters.date_from) {
    conditions.push('created_at >= ?')
    values.push(new Date(filters.date_from).getTime())
  }

  if (filters.date_to) {
    conditions.push('created_at <= ?')
    values.push(new Date(filters.date_to).getTime() + 86400000) // Add 1 day
  }

  if (filters.search) {
    conditions.push('(order_number LIKE ? OR customer_email LIKE ? OR customer_name LIKE ?)')
    const searchTerm = `%${filters.search}%`
    values.push(searchTerm, searchTerm, searchTerm)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM orders ${whereClause}`)
  const { total } = countStmt.get(...values) as { total: number }

  // Get paginated results
  const limit = filters.limit || 20
  const offset = filters.offset || 0

  const stmt = db.prepare(`
    SELECT * FROM orders ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)

  const rows = stmt.all(...values, limit, offset) as any[]
  const orders = rows.map(formatOrderRow)

  return { orders, total }
}

// ==================== Order Items ====================

export function getOrderItems(order_id: string): OrderItem[] {
  const stmt = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC')
  const rows = stmt.all(order_id) as any[]

  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    product_id: row.product_id,
    product_name: row.product_name,
    product_sku: row.product_sku,
    product_image: row.product_image,
    variant_id: row.variant_id,
    variant_name: row.variant_name,
    quantity: row.quantity,
    unit_price: row.unit_price,
    total_price: row.total_price,
    discount: row.discount,
    is_shipped: Boolean(row.is_shipped),
    shipped_quantity: row.shipped_quantity,
    created_at: row.created_at,
  }))
}

// ==================== Order Notes ====================

export function addOrderNote(order_id: string, note: string, note_type: 'customer' | 'internal' | 'system', author?: { id?: string; name: string; email?: string }): OrderNote {
  const note_id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = Date.now()

  const stmt = db.prepare(`
    INSERT INTO order_notes (
      id, order_id, note, note_type, author_id, author_name, author_email, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    note_id,
    order_id,
    note,
    note_type,
    author?.id || null,
    author?.name || 'System',
    author?.email || null,
    now
  )

  return {
    id: note_id,
    order_id,
    note,
    note_type,
    author_id: author?.id || null,
    author_name: author?.name || 'System',
    author_email: author?.email || null,
    created_at: now,
  }
}

export function getOrderNotes(order_id: string): OrderNote[] {
  const stmt = db.prepare('SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at DESC')
  const rows = stmt.all(order_id) as any[]

  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    note: row.note,
    note_type: row.note_type,
    author_id: row.author_id,
    author_name: row.author_name,
    author_email: row.author_email,
    created_at: row.created_at,
  }))
}

// ==================== Order History ====================

export function addOrderHistory(
  order_id: string,
  data: {
    action: string
    old_value?: string | null
    new_value?: string | null
    description: string
    performed_by_id?: string | null
    performed_by_name?: string
  }
): void {
  const history_id = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = Date.now()

  const stmt = db.prepare(`
    INSERT INTO order_history (
      id, order_id, action, old_value, new_value, description,
      performed_by_id, performed_by_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    history_id,
    order_id,
    data.action,
    data.old_value || null,
    data.new_value || null,
    data.description,
    data.performed_by_id || null,
    data.performed_by_name || 'System',
    now
  )
}

export function getOrderHistory(order_id: string): OrderHistory[] {
  const stmt = db.prepare('SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC')
  const rows = stmt.all(order_id) as any[]

  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    action: row.action,
    old_value: row.old_value,
    new_value: row.new_value,
    description: row.description,
    performed_by_id: row.performed_by_id,
    performed_by_name: row.performed_by_name,
    created_at: row.created_at,
  }))
}

// ==================== Order Refunds ====================

export function createRefund(
  order_id: string,
  data: {
    amount: number
    reason: string
    refund_type: 'full' | 'partial'
    payment_intent_id: string
    refund_id: string
    refunded_items?: string[]
    processed_by?: { id?: string; name: string }
  }
): OrderRefund {
  const refund_id_internal = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = Date.now()

  const stmt = db.prepare(`
    INSERT INTO order_refunds (
      id, order_id, amount, reason, refund_type,
      payment_intent_id, refund_id, status,
      refunded_items, processed_by_id, processed_by_name,
      created_at, processed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'succeeded', ?, ?, ?, ?, ?)
  `)

  stmt.run(
    refund_id_internal,
    order_id,
    data.amount,
    data.reason,
    data.refund_type,
    data.payment_intent_id,
    data.refund_id,
    data.refunded_items ? JSON.stringify(data.refunded_items) : null,
    data.processed_by?.id || null,
    data.processed_by?.name || 'System',
    now,
    now
  )

  // Update order payment status
  const order = getOrder(order_id)
  if (order) {
    const new_status = data.refund_type === 'full' ? 'refunded' : 'partially-refunded'
    updateOrder(order_id, { payment_status: new_status }, data.processed_by?.id, data.processed_by?.name)
  }

  addOrderHistory(order_id, {
    action: 'refund_issued',
    new_value: `$${data.amount.toFixed(2)}`,
    description: `${data.refund_type === 'full' ? 'Full' : 'Partial'} refund issued: $${data.amount.toFixed(2)}`,
    performed_by_id: data.processed_by?.id,
    performed_by_name: data.processed_by?.name || 'System',
  })

  return {
    id: refund_id_internal,
    order_id,
    amount: data.amount,
    reason: data.reason,
    refund_type: data.refund_type,
    payment_intent_id: data.payment_intent_id,
    refund_id: data.refund_id,
    status: 'succeeded',
    refunded_items: data.refunded_items || null,
    processed_by_id: data.processed_by?.id || null,
    processed_by_name: data.processed_by?.name || 'System',
    created_at: now,
    processed_at: now,
  }
}

export function getOrderRefunds(order_id: string): OrderRefund[] {
  const stmt = db.prepare('SELECT * FROM order_refunds WHERE order_id = ? ORDER BY created_at DESC')
  const rows = stmt.all(order_id) as any[]

  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    amount: row.amount,
    reason: row.reason,
    refund_type: row.refund_type,
    payment_intent_id: row.payment_intent_id,
    refund_id: row.refund_id,
    status: row.status,
    refunded_items: row.refunded_items ? JSON.parse(row.refunded_items) : null,
    processed_by_id: row.processed_by_id,
    processed_by_name: row.processed_by_name,
    created_at: row.created_at,
    processed_at: row.processed_at,
  }))
}

// ==================== Statistics ====================

export interface LargeOrder {
  id: string
  order_number: string
  user_id: string | null
  customer_name: string
  customer_email: string
  phone: string | null
  status: string
  payment_status: string
  payment_method: string
  total: number
  created_at: number
  paid_at: number | null
}

export interface LargeOrdersFilters {
  min_total?: number
  date_from?: number
  date_to?: number
}

/**
 * Get large orders (orders above a minimum total threshold)
 * Filters by payment status (paid), order status (processing/shipped/delivered), and payment method (stripe/paypal)
 */
export function getLargeOrders(filters: LargeOrdersFilters = {}): LargeOrder[] {
  const minTotal = filters.min_total || 600
  const dateFrom = filters.date_from || (Date.now() - 7 * 24 * 60 * 60 * 1000) // Default: last 7 days
  const dateTo = filters.date_to || Date.now()

  // Get orders that:
  // 1. Have total >= minTotal
  // 2. Are paid (payment_status = 'paid')
  // 3. Are in active status (processing, shipped, delivered)
  // 4. Were paid via Stripe or PayPal
  // 5. Were created/paid within date range
  const stmt = db.prepare(`
    SELECT 
      id,
      order_number,
      user_id,
      customer_name,
      customer_email,
      CASE 
        WHEN shipping_address IS NOT NULL 
        THEN json_extract(shipping_address, '$.phone')
        ELSE NULL
      END as phone,
      status,
      payment_status,
      payment_method,
      total,
      created_at,
      COALESCE(updated_at, created_at) as paid_at
    FROM orders
    WHERE total >= ?
      AND payment_status = 'paid'
      AND status IN ('processing', 'shipped', 'delivered')
      AND payment_method IN ('stripe', 'paypal')
      AND COALESCE(updated_at, created_at) >= ?
      AND COALESCE(updated_at, created_at) <= ?
    ORDER BY paid_at DESC
  `)

  const orders = stmt.all(minTotal, dateFrom, dateTo) as any[]

  return orders.map((row) => ({
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    phone: row.phone || null,
    status: row.status,
    payment_status: row.payment_status,
    payment_method: row.payment_method,
    total: row.total,
    created_at: row.created_at,
    paid_at: row.paid_at || row.created_at,
  }))
}

export function getOrderStats(): OrderStats {
  // Total orders and revenue
  const totalsStmt = db.prepare(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_revenue
    FROM orders
  `)
  const totals = totalsStmt.get() as { total_orders: number; total_revenue: number }

  // Orders by status
  const byStatusStmt = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
    FROM orders
  `)
  const byStatus = byStatusStmt.get() as any

  // Orders by payment status
  const byPaymentStmt = db.prepare(`
    SELECT
      SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
      SUM(CASE WHEN payment_status IN ('pending', 'authorized') THEN 1 ELSE 0 END) as unpaid_orders,
      SUM(CASE WHEN payment_status IN ('refunded', 'partially-refunded') THEN 1 ELSE 0 END) as refunded_orders
    FROM orders
  `)
  const byPayment = byPaymentStmt.get() as any

  // Today's stats
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStmt = db.prepare(`
    SELECT COUNT(*) as orders_today, COALESCE(SUM(total), 0) as revenue_today
    FROM orders
    WHERE created_at >= ?
  `)
  const today = todayStmt.get(todayStart.getTime()) as { orders_today: number; revenue_today: number }

  // This month's stats
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthStmt = db.prepare(`
    SELECT COUNT(*) as orders_this_month, COALESCE(SUM(total), 0) as revenue_this_month
    FROM orders
    WHERE created_at >= ?
  `)
  const month = monthStmt.get(monthStart.getTime()) as { orders_this_month: number; revenue_this_month: number }

  // Average order value
  const avgStmt = db.prepare(`
    SELECT COALESCE(AVG(total), 0) as average_order_value
    FROM orders
    WHERE status != 'cancelled'
  `)
  const avg = avgStmt.get() as { average_order_value: number }

  return {
    total_orders: totals.total_orders,
    total_revenue: totals.total_revenue,
    pending_orders: byStatus.pending_orders,
    processing_orders: byStatus.processing_orders,
    shipped_orders: byStatus.shipped_orders,
    delivered_orders: byStatus.delivered_orders,
    cancelled_orders: byStatus.cancelled_orders,
    paid_orders: byPayment.paid_orders,
    unpaid_orders: byPayment.unpaid_orders,
    refunded_orders: byPayment.refunded_orders,
    orders_today: today.orders_today,
    revenue_today: today.revenue_today,
    orders_this_month: month.orders_this_month,
    revenue_this_month: month.revenue_this_month,
    average_order_value: avg.average_order_value,
  }
}

// ==================== Helper Functions ====================

function formatOrderRow(row: any): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id,
    customer_email: row.customer_email,
    customer_name: row.customer_name,
    is_guest: Boolean(row.is_guest),
    status: row.status,
    payment_status: row.payment_status,
    shipping_status: row.shipping_status,
    subtotal: row.subtotal,
    discount_amount: row.discount_amount,
    shipping_cost: row.shipping_cost,
    tax_amount: row.tax_amount,
    total: row.total,
    shipping_address: JSON.parse(row.shipping_address),
    billing_address: row.billing_address ? JSON.parse(row.billing_address) : null,
    payment_method: row.payment_method,
    payment_intent_id: row.payment_intent_id,
    transaction_id: row.transaction_id,
    shipping_method: row.shipping_method,
    tracking_number: row.tracking_number,
    shipped_at: row.shipped_at,
    delivered_at: row.delivered_at,
    promo_code: row.promo_code,
    promo_discount: row.promo_discount,
    donation_amount: row.donation_amount,
    donation_charity_id: row.donation_charity_id,
    is_subscription: Boolean(row.is_subscription),
    subscription_id: row.subscription_id,
    is_b2b: Boolean(row.is_b2b),
    b2b_account_id: row.b2b_account_id,
    purchase_order_number: row.purchase_order_number,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    referrer: row.referrer,
    source: row.source,
    customer_notes: row.customer_notes,
    internal_notes: row.internal_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    cancelled_at: row.cancelled_at,
    refunded_at: row.refunded_at,
  }
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `FF-${year}-${timestamp}${random}`
}

