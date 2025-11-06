/**
 * Order Credits Database Functions
 * SQLite operations for order credit management
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

// ==================== Types ====================

export interface OrderCredit {
  id: number
  order_id: string
  user_id: string | null
  customer_email: string
  customer_name: string
  amount: number
  currency: string
  method: 'paypal' | 'stripe' | 'manual' | 'store_credit' | 'refund'
  reason: string
  note: string | null
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  status_code: string | null
  response: string | null
  payment_id: string | null // PayPal transaction ID, Stripe refund ID, etc.
  created_by: string | null // Admin user ID
  created_by_name: string | null
  created_at: number
  updated_at: number
}

export interface CreateOrderCreditRequest {
  order_id: string
  user_id?: string | null
  customer_email: string
  customer_name: string
  amount: number
  currency?: string
  method: 'paypal' | 'stripe' | 'manual' | 'store_credit' | 'refund'
  reason: string
  note?: string | null
  payment_id?: string | null
  created_by?: string | null
  created_by_name?: string | null
}

export interface UpdateOrderCreditRequest {
  status?: 'pending' | 'success' | 'failed' | 'cancelled'
  status_code?: string | null
  response?: string | null
  note?: string | null
}

export interface OrderCreditFilters {
  order_id?: string
  user_id?: string
  customer_email?: string
  status?: string
  method?: string
  search?: string
  page?: number
  limit?: number
}

// ==================== Database Schema ====================

export function initOrderCreditsTable() {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS order_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      user_id TEXT,
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      method TEXT NOT NULL CHECK(method IN ('paypal', 'stripe', 'manual', 'store_credit', 'refund')),
      reason TEXT NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'cancelled')),
      status_code TEXT,
      response TEXT,
      payment_id TEXT,
      created_by TEXT,
      created_by_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `)
  stmt.run()

  // Create indexes
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_credits_order_id ON order_credits(order_id)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_credits_user_id ON order_credits(user_id)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_credits_status ON order_credits(status)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_credits_created_at ON order_credits(created_at DESC)`).run()
}

// ==================== CRUD Operations ====================

/**
 * Create a new order credit
 */
export function createOrderCredit(data: CreateOrderCreditRequest): OrderCredit {
  const now = Date.now()
  const currency = data.currency || 'USD'

  const stmt = db.prepare(`
    INSERT INTO order_credits (
      order_id, user_id, customer_email, customer_name,
      amount, currency, method, reason, note,
      status, payment_id, created_by, created_by_name,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    data.order_id,
    data.user_id || null,
    data.customer_email,
    data.customer_name,
    data.amount,
    currency,
    data.method,
    data.reason,
    data.note || null,
    data.payment_id || null,
    data.created_by || null,
    data.created_by_name || null,
    now,
    now
  )

  return getOrderCreditById(result.lastInsertRowid as number)!
}

/**
 * Get order credit by ID
 */
export function getOrderCreditById(id: number): OrderCredit | null {
  const stmt = db.prepare(`SELECT * FROM order_credits WHERE id = ?`)
  return stmt.get(id) as OrderCredit | null
}

/**
 * Get order credits by order ID
 */
export function getOrderCreditsByOrderId(order_id: string): OrderCredit[] {
  const stmt = db.prepare(`
    SELECT * FROM order_credits 
    WHERE order_id = ? 
    ORDER BY created_at DESC
  `)
  return stmt.all(order_id) as OrderCredit[]
}

/**
 * Get order credits by user ID
 */
export function getOrderCreditsByUserId(user_id: string): OrderCredit[] {
  const stmt = db.prepare(`
    SELECT * FROM order_credits 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `)
  return stmt.all(user_id) as OrderCredit[]
}

/**
 * Update order credit
 */
export function updateOrderCredit(id: number, data: UpdateOrderCreditRequest): OrderCredit | null {
  const updates: string[] = []
  const values: any[] = []

  if (data.status !== undefined) {
    updates.push('status = ?')
    values.push(data.status)
  }
  if (data.status_code !== undefined) {
    updates.push('status_code = ?')
    values.push(data.status_code)
  }
  if (data.response !== undefined) {
    updates.push('response = ?')
    values.push(data.response)
  }
  if (data.note !== undefined) {
    updates.push('note = ?')
    values.push(data.note)
  }

  if (updates.length === 0) {
    return getOrderCreditById(id)
  }

  updates.push('updated_at = ?')
  values.push(Date.now())
  values.push(id)

  const stmt = db.prepare(`
    UPDATE order_credits 
    SET ${updates.join(', ')} 
    WHERE id = ?
  `)

  stmt.run(...values)
  return getOrderCreditById(id)
}

/**
 * Get order credits with filters
 */
export function getOrderCredits(filters: OrderCreditFilters = {}): {
  credits: OrderCredit[]
  total: number
  page: number
  limit: number
  totalPages: number
} {
  const page = filters.page || 1
  const limit = filters.limit || 25
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const values: any[] = []

  if (filters.order_id) {
    conditions.push('order_id = ?')
    values.push(filters.order_id)
  }
  if (filters.user_id) {
    conditions.push('user_id = ?')
    values.push(filters.user_id)
  }
  if (filters.customer_email) {
    conditions.push('customer_email LIKE ?')
    values.push(`%${filters.customer_email}%`)
  }
  if (filters.status) {
    conditions.push('status = ?')
    values.push(filters.status)
  }
  if (filters.method) {
    conditions.push('method = ?')
    values.push(filters.method)
  }
  if (filters.search) {
    conditions.push('(order_id LIKE ? OR customer_email LIKE ? OR customer_name LIKE ? OR reason LIKE ?)')
    const searchTerm = `%${filters.search}%`
    values.push(searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM order_credits ${whereClause}`)
  const total = (countStmt.get(...values) as { total: number }).total

  // Get paginated results
  const stmt = db.prepare(`
    SELECT * FROM order_credits 
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `)
  const credits = stmt.all(...values, limit, offset) as OrderCredit[]

  return {
    credits,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Get order credit statistics
 */
export function getOrderCreditStats(): {
  total: number
  totalAmount: number
  byStatus: Record<string, number>
  byMethod: Record<string, number>
  recentCount: number
} {
  const totalStmt = db.prepare(`SELECT COUNT(*) as total FROM order_credits`)
  const total = (totalStmt.get() as { total: number }).total

  const amountStmt = db.prepare(`SELECT SUM(amount) as total FROM order_credits WHERE status = 'success'`)
  const totalAmount = (amountStmt.get() as { total: number | null }).total || 0

  const statusStmt = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM order_credits 
    GROUP BY status
  `)
  const statusRows = statusStmt.all() as { status: string; count: number }[]
  const byStatus: Record<string, number> = {}
  statusRows.forEach(row => {
    byStatus[row.status] = row.count
  })

  const methodStmt = db.prepare(`
    SELECT method, COUNT(*) as count 
    FROM order_credits 
    GROUP BY method
  `)
  const methodRows = methodStmt.all() as { method: string; count: number }[]
  const byMethod: Record<string, number> = {}
  methodRows.forEach(row => {
    byMethod[row.method] = row.count
  })

  const recentStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM order_credits 
    WHERE created_at > ?
  `)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  const recentCount = (recentStmt.get(sevenDaysAgo) as { count: number }).count

  return {
    total,
    totalAmount,
    byStatus,
    byMethod,
    recentCount
  }
}

/**
 * Delete order credit (soft delete by setting status to cancelled)
 */
export function deleteOrderCredit(id: number): boolean {
  const stmt = db.prepare(`
    UPDATE order_credits 
    SET status = 'cancelled', updated_at = ? 
    WHERE id = ?
  `)
  const result = stmt.run(Date.now(), id)
  return result.changes > 0
}

