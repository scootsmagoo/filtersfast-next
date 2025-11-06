/**
 * Order Discounts Database Functions
 * SQLite operations for order discount management
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

// ==================== Types ====================

export interface OrderDiscount {
  id: number
  disc_code: string
  disc_perc: number | null
  disc_amt: number | null
  disc_from_amt: number
  disc_to_amt: number
  disc_status: 'A' | 'I' | 'U' // Active, Inactive, Used
  disc_once_only: 'Y' | 'N'
  disc_valid_from: string // YYYYMMDD format
  disc_valid_to: string // YYYYMMDD format
  created_at: number
  updated_at: number
}

export interface CreateOrderDiscountRequest {
  disc_code: string
  disc_perc?: number | null
  disc_amt?: number | null
  disc_from_amt: number
  disc_to_amt: number
  disc_status: 'A' | 'I' | 'U'
  disc_once_only: 'Y' | 'N'
  disc_valid_from: string // YYYYMMDD format
  disc_valid_to: string // YYYYMMDD format
}

export interface UpdateOrderDiscountRequest {
  disc_code?: string
  disc_perc?: number | null
  disc_amt?: number | null
  disc_from_amt?: number
  disc_to_amt?: number
  disc_status?: 'A' | 'I' | 'U'
  disc_once_only?: 'Y' | 'N'
  disc_valid_from?: string
  disc_valid_to?: string
}

export interface OrderDiscountFilters {
  disc_status?: 'A' | 'I' | 'U' | 'all'
  disc_once_only?: 'Y' | 'N' | 'all'
  search?: string
  sortField?: 'disc_code' | 'disc_valid_from'
  page?: number
  limit?: number
}

// ==================== Database Schema ====================

export function initOrderDiscountsTable() {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS order_discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disc_code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      disc_perc REAL,
      disc_amt REAL,
      disc_from_amt REAL NOT NULL,
      disc_to_amt REAL NOT NULL,
      disc_status TEXT NOT NULL CHECK(disc_status IN ('A', 'I', 'U')) DEFAULT 'A',
      disc_once_only TEXT NOT NULL CHECK(disc_once_only IN ('Y', 'N')) DEFAULT 'N',
      disc_valid_from TEXT NOT NULL,
      disc_valid_to TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  stmt.run()

  // Create indexes
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_discounts_code ON order_discounts(disc_code)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_discounts_status ON order_discounts(disc_status)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_discounts_valid_dates ON order_discounts(disc_valid_from, disc_valid_to)`).run()
}

// Initialize table on import
initOrderDiscountsTable()

// ==================== Helper Functions ====================

/**
 * Convert YYYYMMDD string to Date
 */
function dateStringToDate(dateStr: string): Date {
  if (dateStr.length !== 8) {
    throw new Error('Invalid date format. Expected YYYYMMDD')
  }
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

/**
 * Convert Date to YYYYMMDD string
 */
function dateToDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// Note: formatDateString is now exported from @/lib/utils/order-discounts
// This keeps database functions separate from client-safe utilities

// ==================== CRUD Operations ====================

/**
 * Create a new order discount
 */
export function createOrderDiscount(data: CreateOrderDiscountRequest): OrderDiscount {
  const now = Date.now()

  // Validate that either disc_perc or disc_amt is provided, but not both
  if ((data.disc_perc === null || data.disc_perc === undefined) && 
      (data.disc_amt === null || data.disc_amt === undefined)) {
    throw new Error('Either discount percentage or discount amount must be provided')
  }
  if (data.disc_perc !== null && data.disc_perc !== undefined && 
      data.disc_amt !== null && data.disc_amt !== undefined) {
    throw new Error('Cannot provide both discount percentage and discount amount')
  }

  // Validate percentage range
  if (data.disc_perc !== null && data.disc_perc !== undefined) {
    if (data.disc_perc <= 0 || data.disc_perc > 100) {
      throw new Error('Discount percentage must be between 0 and 100')
    }
  }

  // Validate amount range
  if (data.disc_amt !== null && data.disc_amt !== undefined) {
    if (data.disc_amt <= 0) {
      throw new Error('Discount amount must be greater than 0')
    }
    if (data.disc_amt > data.disc_to_amt) {
      throw new Error('Discount amount cannot be greater than maximum order amount')
    }
  }

  // Validate order amount range
  if (data.disc_to_amt < data.disc_from_amt) {
    throw new Error('Maximum order amount must be greater than or equal to minimum order amount')
  }

  // Validate date range
  if (data.disc_valid_to < data.disc_valid_from) {
    throw new Error('Valid to date must be greater than or equal to valid from date')
  }

  // Check for duplicate code
  const existing = db.prepare(`SELECT id FROM order_discounts WHERE LOWER(disc_code) = LOWER(?)`).get(data.disc_code)
  if (existing) {
    throw new Error('Discount code already exists')
  }

  const stmt = db.prepare(`
    INSERT INTO order_discounts (
      disc_code, disc_perc, disc_amt, disc_from_amt, disc_to_amt,
      disc_status, disc_once_only, disc_valid_from, disc_valid_to,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    data.disc_code.toUpperCase(),
    data.disc_perc ?? null,
    data.disc_amt ?? null,
    data.disc_from_amt,
    data.disc_to_amt,
    data.disc_status,
    data.disc_once_only,
    data.disc_valid_from,
    data.disc_valid_to,
    now,
    now
  )

  return getOrderDiscountById(result.lastInsertRowid as number)!
}

/**
 * Get order discount by ID
 */
export function getOrderDiscountById(id: number): OrderDiscount | null {
  try {
    // Ensure table exists
    initOrderDiscountsTable()
    
    // Verify table exists by checking if we can query it
    try {
      const testStmt = db.prepare(`SELECT COUNT(*) as count FROM order_discounts`)
      testStmt.get()
    } catch (tableError: any) {
      console.error('Table verification failed, reinitializing:', tableError)
      initOrderDiscountsTable()
    }
    
    const stmt = db.prepare(`SELECT * FROM order_discounts WHERE id = ?`)
    const result = stmt.get(id) as OrderDiscount | null
    
    // Logging removed for security - avoid logging sensitive data
    
    return result
  } catch (error: any) {
    // Log error without exposing sensitive details
    console.error('Error in getOrderDiscountById')
    // Re-throw with generic message to prevent information leakage
    throw new Error('Failed to fetch order discount')
  }
}

/**
 * Get order discount by code
 */
export function getOrderDiscountByCode(code: string): OrderDiscount | null {
  const stmt = db.prepare(`SELECT * FROM order_discounts WHERE LOWER(disc_code) = LOWER(?)`)
  return stmt.get(code) as OrderDiscount | null
}

/**
 * Update order discount
 */
export function updateOrderDiscount(id: number, data: UpdateOrderDiscountRequest): OrderDiscount | null {
  const existing = getOrderDiscountById(id)
  if (!existing) {
    return null
  }

  const updates: string[] = []
  const values: any[] = []

  if (data.disc_code !== undefined) {
    // Check for duplicate code (excluding current record)
    const duplicate = db.prepare(`SELECT id FROM order_discounts WHERE LOWER(disc_code) = LOWER(?) AND id != ?`).get(data.disc_code, id)
    if (duplicate) {
      throw new Error('Discount code already exists')
    }
    updates.push('disc_code = ?')
    values.push(data.disc_code.toUpperCase())
  }

  // Handle disc_perc and disc_amt - ensure only one is set
  if (data.disc_perc !== undefined || data.disc_amt !== undefined) {
    const newPerc = data.disc_perc !== undefined ? data.disc_perc : existing.disc_perc
    const newAmt = data.disc_amt !== undefined ? data.disc_amt : existing.disc_amt

    if ((newPerc === null || newPerc === undefined) && (newAmt === null || newAmt === undefined)) {
      throw new Error('Either discount percentage or discount amount must be provided')
    }
    if (newPerc !== null && newPerc !== undefined && newAmt !== null && newAmt !== undefined) {
      throw new Error('Cannot provide both discount percentage and discount amount')
    }

    if (data.disc_perc !== undefined) {
      if (data.disc_perc !== null && (data.disc_perc <= 0 || data.disc_perc > 100)) {
        throw new Error('Discount percentage must be between 0 and 100')
      }
      updates.push('disc_perc = ?')
      values.push(data.disc_perc)
      // Clear disc_amt if setting percentage
      if (data.disc_perc !== null) {
        updates.push('disc_amt = ?')
        values.push(null)
      }
    }

    if (data.disc_amt !== undefined) {
      if (data.disc_amt !== null && data.disc_amt <= 0) {
        throw new Error('Discount amount must be greater than 0')
      }
      updates.push('disc_amt = ?')
      values.push(data.disc_amt)
      // Clear disc_perc if setting amount
      if (data.disc_amt !== null) {
        updates.push('disc_perc = ?')
        values.push(null)
      }
    }
  }

  if (data.disc_from_amt !== undefined) {
    updates.push('disc_from_amt = ?')
    values.push(data.disc_from_amt)
  }

  if (data.disc_to_amt !== undefined) {
    updates.push('disc_to_amt = ?')
    values.push(data.disc_to_amt)
  }

  if (data.disc_status !== undefined) {
    updates.push('disc_status = ?')
    values.push(data.disc_status)
  }

  if (data.disc_once_only !== undefined) {
    updates.push('disc_once_only = ?')
    values.push(data.disc_once_only)
  }

  if (data.disc_valid_from !== undefined) {
    updates.push('disc_valid_from = ?')
    values.push(data.disc_valid_from)
  }

  if (data.disc_valid_to !== undefined) {
    updates.push('disc_valid_to = ?')
    values.push(data.disc_valid_to)
  }

  // Validate order amount range if both are being updated
  const finalFromAmt = data.disc_from_amt !== undefined ? data.disc_from_amt : existing.disc_from_amt
  const finalToAmt = data.disc_to_amt !== undefined ? data.disc_to_amt : existing.disc_to_amt
  if (finalToAmt < finalFromAmt) {
    throw new Error('Maximum order amount must be greater than or equal to minimum order amount')
  }

  // Validate date range if both are being updated
  const finalFromDate = data.disc_valid_from !== undefined ? data.disc_valid_from : existing.disc_valid_from
  const finalToDate = data.disc_valid_to !== undefined ? data.disc_valid_to : existing.disc_valid_to
  if (finalToDate < finalFromDate) {
    throw new Error('Valid to date must be greater than or equal to valid from date')
  }

  // Validate discount amount against order amount
  const finalDiscAmt = data.disc_amt !== undefined ? data.disc_amt : existing.disc_amt
  if (finalDiscAmt !== null && finalDiscAmt > finalToAmt) {
    throw new Error('Discount amount cannot be greater than maximum order amount')
  }

  if (updates.length === 0) {
    return existing
  }

  updates.push('updated_at = ?')
  values.push(Date.now())
  values.push(id)

  const stmt = db.prepare(`
    UPDATE order_discounts 
    SET ${updates.join(', ')} 
    WHERE id = ?
  `)

  stmt.run(...values)
  return getOrderDiscountById(id)
}

/**
 * Get order discounts with filters
 */
export function getOrderDiscounts(filters: OrderDiscountFilters = {}): {
  discounts: OrderDiscount[]
  total: number
  page: number
  limit: number
  totalPages: number
} {
  const page = filters.page || 1
  const limit = filters.limit || 25
  const offset = (page - 1) * limit
  const sortField = filters.sortField || 'disc_code'

  const conditions: string[] = []
  const values: any[] = []

  if (filters.disc_status && filters.disc_status !== 'all') {
    conditions.push('disc_status = ?')
    values.push(filters.disc_status)
  }

  if (filters.disc_once_only && filters.disc_once_only !== 'all') {
    conditions.push('disc_once_only = ?')
    values.push(filters.disc_once_only)
  }

  if (filters.search) {
    conditions.push('disc_code LIKE ?')
    values.push(`%${filters.search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM order_discounts ${whereClause}`)
  const total = (countStmt.get(...values) as { total: number }).total

  // Get paginated results
  const stmt = db.prepare(`
    SELECT * FROM order_discounts 
    ${whereClause}
    ORDER BY ${sortField} ASC
    LIMIT ? OFFSET ?
  `)
  const discounts = stmt.all(...values, limit, offset) as OrderDiscount[]

  return {
    discounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Delete order discount(s)
 */
export function deleteOrderDiscounts(ids: number[]): number {
  if (ids.length === 0) return 0

  const placeholders = ids.map(() => '?').join(',')
  const stmt = db.prepare(`DELETE FROM order_discounts WHERE id IN (${placeholders})`)
  const result = stmt.run(...ids)
  return result.changes
}

/**
 * Get order discount statistics
 */
export function getOrderDiscountStats(): {
  total: number
  active: number
  inactive: number
  used: number
  onceOnly: number
  reusable: number
} {
  const totalStmt = db.prepare(`SELECT COUNT(*) as total FROM order_discounts`)
  const total = (totalStmt.get() as { total: number }).total

  const activeStmt = db.prepare(`SELECT COUNT(*) as count FROM order_discounts WHERE disc_status = 'A'`)
  const active = (activeStmt.get() as { count: number }).count

  const inactiveStmt = db.prepare(`SELECT COUNT(*) as count FROM order_discounts WHERE disc_status = 'I'`)
  const inactive = (inactiveStmt.get() as { count: number }).count

  const usedStmt = db.prepare(`SELECT COUNT(*) as count FROM order_discounts WHERE disc_status = 'U'`)
  const used = (usedStmt.get() as { count: number }).count

  const onceOnlyStmt = db.prepare(`SELECT COUNT(*) as count FROM order_discounts WHERE disc_once_only = 'Y'`)
  const onceOnly = (onceOnlyStmt.get() as { count: number }).count

  const reusableStmt = db.prepare(`SELECT COUNT(*) as count FROM order_discounts WHERE disc_once_only = 'N'`)
  const reusable = (reusableStmt.get() as { count: number }).count

  return {
    total,
    active,
    inactive,
    used,
    onceOnly,
    reusable
  }
}

