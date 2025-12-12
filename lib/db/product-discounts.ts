/**
 * Product Discounts Database Functions
 * SQLite operations for product-level discount management
 * 
 * Product discounts are different from order discounts:
 * - Order discounts: Applied to entire order (promo codes)
 * - Product discounts: Applied to specific products/categories
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

// ==================== Types ====================

export interface ProductDiscount {
  id: number
  disc_code: string
  disc_type: 'percentage' | 'amount' // Percentage or dollar amount
  disc_perc: number | null // Percentage (0-100)
  disc_amt: number | null // Dollar amount
  target_type: 'global' | 'product' | 'category' | 'product_type' // What the discount applies to
  target_id: number | null // Product ID, Category ID, or product type code
  target_product_type?: string | null // For product_type: 'fridge', 'water', 'air', 'humidifier', 'pool'
  disc_from_amt: number // Minimum cart subtotal
  disc_to_amt: number // Maximum cart subtotal
  disc_status: 'A' | 'I' // Active, Inactive
  disc_valid_from: string // YYYYMMDD format
  disc_valid_to: string // YYYYMMDD format
  disc_free_shipping: boolean
  disc_multi_by_qty: boolean // Multiply discount by quantity
  disc_once_only: boolean // Allow once per customer
  disc_compoundable: boolean // Can be combined with other discounts
  disc_allow_on_forms: boolean // Allow on promo code form
  disc_notes: string | null
  created_at: number
  updated_at: number
  created_by: string | null
}

export interface CreateProductDiscountRequest {
  disc_code: string
  disc_type: 'percentage' | 'amount'
  disc_perc?: number | null
  disc_amt?: number | null
  target_type: 'global' | 'product' | 'category' | 'product_type'
  target_id?: number | null
  target_product_type?: string | null
  disc_from_amt: number
  disc_to_amt: number
  disc_status: 'A' | 'I'
  disc_valid_from: string // YYYYMMDD format
  disc_valid_to: string // YYYYMMDD format
  disc_free_shipping?: boolean
  disc_multi_by_qty?: boolean
  disc_once_only?: boolean
  disc_compoundable?: boolean
  disc_allow_on_forms?: boolean
  disc_notes?: string | null
}

export interface UpdateProductDiscountRequest {
  disc_code?: string
  disc_type?: 'percentage' | 'amount'
  disc_perc?: number | null
  disc_amt?: number | null
  target_type?: 'global' | 'product' | 'category' | 'product_type'
  target_id?: number | null
  target_product_type?: string | null
  disc_from_amt?: number
  disc_to_amt?: number
  disc_status?: 'A' | 'I'
  disc_valid_from?: string
  disc_valid_to?: string
  disc_free_shipping?: boolean
  disc_multi_by_qty?: boolean
  disc_once_only?: boolean
  disc_compoundable?: boolean
  disc_allow_on_forms?: boolean
  disc_notes?: string | null
}

export interface ProductDiscountFilters {
  disc_status?: 'A' | 'I' | 'all'
  target_type?: 'global' | 'product' | 'category' | 'product_type' | 'all'
  search?: string
  sortField?: 'disc_code' | 'disc_valid_from' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ProductDiscountStats {
  total: number
  active: number
  inactive: number
  global: number
  product: number
  category: number
  product_type: number
  percentage: number
  amount: number
}

// ==================== Database Schema ====================

export function initProductDiscountsTable() {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS product_discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disc_code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      disc_type TEXT NOT NULL CHECK(disc_type IN ('percentage', 'amount')),
      disc_perc REAL CHECK(disc_perc IS NULL OR (disc_perc >= 0 AND disc_perc <= 100)),
      disc_amt REAL CHECK(disc_amt IS NULL OR disc_amt >= 0),
      target_type TEXT NOT NULL CHECK(target_type IN ('global', 'product', 'category', 'product_type')),
      target_id INTEGER,
      target_product_type TEXT,
      disc_from_amt REAL NOT NULL DEFAULT 0,
      disc_to_amt REAL NOT NULL DEFAULT 9999.99,
      disc_status TEXT NOT NULL CHECK(disc_status IN ('A', 'I')) DEFAULT 'A',
      disc_valid_from TEXT NOT NULL,
      disc_valid_to TEXT NOT NULL,
      disc_free_shipping INTEGER NOT NULL DEFAULT 0,
      disc_multi_by_qty INTEGER NOT NULL DEFAULT 0,
      disc_once_only INTEGER NOT NULL DEFAULT 0,
      disc_compoundable INTEGER NOT NULL DEFAULT 0,
      disc_allow_on_forms INTEGER NOT NULL DEFAULT 1,
      disc_notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT
    )
  `)
  stmt.run()

  // Create indexes
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_discounts_code ON product_discounts(disc_code)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_discounts_status ON product_discounts(disc_status)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_discounts_target ON product_discounts(target_type, target_id)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_discounts_valid_dates ON product_discounts(disc_valid_from, disc_valid_to)`).run()
}

// Initialize table on import
initProductDiscountsTable()

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

/**
 * Convert database row to ProductDiscount object
 */
function rowToProductDiscount(row: any): ProductDiscount {
  return {
    id: row.id,
    disc_code: row.disc_code,
    disc_type: row.disc_type,
    disc_perc: row.disc_perc,
    disc_amt: row.disc_amt,
    target_type: row.target_type,
    target_id: row.target_id,
    target_product_type: row.target_product_type,
    disc_from_amt: row.disc_from_amt,
    disc_to_amt: row.disc_to_amt,
    disc_status: row.disc_status,
    disc_valid_from: row.disc_valid_from,
    disc_valid_to: row.disc_valid_to,
    disc_free_shipping: Boolean(row.disc_free_shipping),
    disc_multi_by_qty: Boolean(row.disc_multi_by_qty),
    disc_once_only: Boolean(row.disc_once_only),
    disc_compoundable: Boolean(row.disc_compoundable),
    disc_allow_on_forms: Boolean(row.disc_allow_on_forms),
    disc_notes: row.disc_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
  }
}

// ==================== CRUD Operations ====================

/**
 * Create a new product discount
 */
export function createProductDiscount(
  data: CreateProductDiscountRequest,
  createdBy?: string
): ProductDiscount {
  // Validate discount type and amount
  if (data.disc_type === 'percentage') {
    if (!data.disc_perc || data.disc_perc < 0 || data.disc_perc > 100) {
      throw new Error('Percentage must be between 0 and 100')
    }
    if (data.disc_amt !== null && data.disc_amt !== undefined) {
      throw new Error('Cannot set both percentage and amount')
    }
  } else {
    if (!data.disc_amt || data.disc_amt < 0) {
      throw new Error('Amount must be greater than 0')
    }
    if (data.disc_perc !== null && data.disc_perc !== undefined) {
      throw new Error('Cannot set both percentage and amount')
    }
  }

  // Validate target
  if (data.target_type === 'product' || data.target_type === 'category') {
    if (!data.target_id || data.target_id <= 0) {
      throw new Error('Target ID is required for product/category discounts')
    }
  }
  if (data.target_type === 'product_type') {
    if (!data.target_product_type) {
      throw new Error('Product type is required for product_type discounts')
    }
  }

  // Check for duplicate code
  const existing = db
    .prepare(`SELECT id FROM product_discounts WHERE LOWER(disc_code) = LOWER(?)`)
    .get(data.disc_code)
  if (existing) {
    throw new Error(`Discount code "${data.disc_code}" already exists`)
  }

  const now = Date.now()

  const stmt = db.prepare(`
    INSERT INTO product_discounts (
      disc_code, disc_type, disc_perc, disc_amt,
      target_type, target_id, target_product_type,
      disc_from_amt, disc_to_amt, disc_status,
      disc_valid_from, disc_valid_to,
      disc_free_shipping, disc_multi_by_qty, disc_once_only,
      disc_compoundable, disc_allow_on_forms, disc_notes,
      created_at, updated_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    data.disc_code,
    data.disc_type,
    data.disc_type === 'percentage' ? data.disc_perc : null,
    data.disc_type === 'amount' ? data.disc_amt : null,
    data.target_type,
    data.target_id || null,
    data.target_product_type || null,
    data.disc_from_amt,
    data.disc_to_amt,
    data.disc_status,
    data.disc_valid_from,
    data.disc_valid_to,
    data.disc_free_shipping ? 1 : 0,
    data.disc_multi_by_qty ? 1 : 0,
    data.disc_once_only ? 1 : 0,
    data.disc_compoundable ? 1 : 0,
    data.disc_allow_on_forms !== false ? 1 : 0,
    data.disc_notes || null,
    now,
    now,
    createdBy || null
  )

  return getProductDiscountById(result.lastInsertRowid as number)
}

/**
 * Get product discount by ID
 */
export function getProductDiscountById(id: number): ProductDiscount {
  const stmt = db.prepare(`SELECT * FROM product_discounts WHERE id = ?`)
  const row = stmt.get(id) as any

  if (!row) {
    throw new Error(`Product discount with ID ${id} not found`)
  }

  return rowToProductDiscount(row)
}

/**
 * Get product discount by code
 */
export function getProductDiscountByCode(discCode: string): ProductDiscount | null {
  const stmt = db.prepare(`SELECT * FROM product_discounts WHERE LOWER(disc_code) = LOWER(?)`)
  const row = stmt.get(discCode) as any

  if (!row) {
    return null
  }

  return rowToProductDiscount(row)
}

/**
 * Update product discount
 */
export function updateProductDiscount(
  id: number,
  data: UpdateProductDiscountRequest,
  updatedBy?: string
): ProductDiscount {
  const existing = getProductDiscountById(id)

  // Validate discount type and amount if changing
  if (data.disc_type !== undefined || data.disc_perc !== undefined || data.disc_amt !== undefined) {
    const discType = data.disc_type ?? existing.disc_type
    const discPerc = data.disc_perc !== undefined ? data.disc_perc : existing.disc_perc
    const discAmt = data.disc_amt !== undefined ? data.disc_amt : existing.disc_amt

    if (discType === 'percentage') {
      if (discPerc === null || discPerc < 0 || discPerc > 100) {
        throw new Error('Percentage must be between 0 and 100')
      }
      if (discAmt !== null && discAmt !== undefined) {
        throw new Error('Cannot set both percentage and amount')
      }
    } else {
      if (discAmt === null || discAmt === undefined || discAmt < 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (discPerc !== null && discPerc !== undefined) {
        throw new Error('Cannot set both percentage and amount')
      }
    }
  }

  // Check for duplicate code if changing
  if (data.disc_code && data.disc_code.toLowerCase() !== existing.disc_code.toLowerCase()) {
    const duplicate = db
      .prepare(`SELECT id FROM product_discounts WHERE LOWER(disc_code) = LOWER(?) AND id != ?`)
      .get(data.disc_code, id)
    if (duplicate) {
      throw new Error(`Discount code "${data.disc_code}" already exists`)
    }
  }

  const updates: string[] = []
  const values: any[] = []

  if (data.disc_code !== undefined) {
    updates.push('disc_code = ?')
    values.push(data.disc_code)
  }
  if (data.disc_type !== undefined) {
    updates.push('disc_type = ?')
    values.push(data.disc_type)
  }
  if (data.disc_perc !== undefined) {
    updates.push('disc_perc = ?')
    values.push(data.disc_type === 'percentage' ? data.disc_perc : null)
  }
  if (data.disc_amt !== undefined) {
    updates.push('disc_amt = ?')
    values.push(data.disc_type === 'amount' ? data.disc_amt : null)
  }
  if (data.target_type !== undefined) {
    updates.push('target_type = ?')
    values.push(data.target_type)
  }
  if (data.target_id !== undefined) {
    updates.push('target_id = ?')
    values.push(data.target_id || null)
  }
  if (data.target_product_type !== undefined) {
    updates.push('target_product_type = ?')
    values.push(data.target_product_type || null)
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
  if (data.disc_valid_from !== undefined) {
    updates.push('disc_valid_from = ?')
    values.push(data.disc_valid_from)
  }
  if (data.disc_valid_to !== undefined) {
    updates.push('disc_valid_to = ?')
    values.push(data.disc_valid_to)
  }
  if (data.disc_free_shipping !== undefined) {
    updates.push('disc_free_shipping = ?')
    values.push(data.disc_free_shipping ? 1 : 0)
  }
  if (data.disc_multi_by_qty !== undefined) {
    updates.push('disc_multi_by_qty = ?')
    values.push(data.disc_multi_by_qty ? 1 : 0)
  }
  if (data.disc_once_only !== undefined) {
    updates.push('disc_once_only = ?')
    values.push(data.disc_once_only ? 1 : 0)
  }
  if (data.disc_compoundable !== undefined) {
    updates.push('disc_compoundable = ?')
    values.push(data.disc_compoundable ? 1 : 0)
  }
  if (data.disc_allow_on_forms !== undefined) {
    updates.push('disc_allow_on_forms = ?')
    values.push(data.disc_allow_on_forms ? 1 : 0)
  }
  if (data.disc_notes !== undefined) {
    updates.push('disc_notes = ?')
    values.push(data.disc_notes || null)
  }

  updates.push('updated_at = ?')
  values.push(Date.now())

  if (updates.length === 1) {
    // Only updated_at changed, return existing
    return existing
  }

  values.push(id)

  const stmt = db.prepare(
    `UPDATE product_discounts SET ${updates.join(', ')} WHERE id = ?`
  )
  stmt.run(...values)

  return getProductDiscountById(id)
}

/**
 * Get product discounts with filters
 */
export function getProductDiscounts(filters: ProductDiscountFilters = {}): {
  discounts: ProductDiscount[]
  total: number
  page: number
  limit: number
  totalPages: number
} {
  const page = filters.page || 1
  const limit = filters.limit || 25
  const offset = (page - 1) * limit
  const sortField = filters.sortField || 'disc_valid_from'
  const sortOrder = filters.sortOrder || 'desc'

  const conditions: string[] = []
  const params: any[] = []

  if (filters.disc_status && filters.disc_status !== 'all') {
    conditions.push('disc_status = ?')
    params.push(filters.disc_status)
  }

  if (filters.target_type && filters.target_type !== 'all') {
    conditions.push('target_type = ?')
    params.push(filters.target_type)
  }

  if (filters.search) {
    conditions.push('(disc_code LIKE ? OR disc_notes LIKE ?)')
    const searchTerm = `%${filters.search}%`
    params.push(searchTerm, searchTerm)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM product_discounts ${whereClause}`)
  const countResult = countStmt.get(...params) as { total: number }
  const total = countResult.total

  // Get paginated results
  const stmt = db.prepare(`
    SELECT * FROM product_discounts 
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT ? OFFSET ?
  `)

  const rows = stmt.all(...params, limit, offset) as any[]
  const discounts = rows.map(rowToProductDiscount)

  return {
    discounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Delete product discounts
 */
export function deleteProductDiscounts(ids: number[]): number {
  if (ids.length === 0) return 0

  const placeholders = ids.map(() => '?').join(',')
  const stmt = db.prepare(
    `DELETE FROM product_discounts WHERE id IN (${placeholders})`
  )
  const result = stmt.run(...ids)
  return result.changes
}

/**
 * Get product discount statistics
 */
export function getProductDiscountStats(): ProductDiscountStats {
  const totalStmt = db.prepare(`SELECT COUNT(*) as total FROM product_discounts`)
  const totalResult = totalStmt.get() as { total: number }

  const activeStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE disc_status = 'A'`
  )
  const activeResult = activeStmt.get() as { count: number }

  const inactiveStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE disc_status = 'I'`
  )
  const inactiveResult = inactiveStmt.get() as { count: number }

  const globalStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE target_type = 'global'`
  )
  const globalResult = globalStmt.get() as { count: number }

  const productStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE target_type = 'product'`
  )
  const productResult = productStmt.get() as { count: number }

  const categoryStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE target_type = 'category'`
  )
  const categoryResult = categoryStmt.get() as { count: number }

  const productTypeStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE target_type = 'product_type'`
  )
  const productTypeResult = productTypeStmt.get() as { count: number }

  const percentageStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE disc_type = 'percentage'`
  )
  const percentageResult = percentageStmt.get() as { count: number }

  const amountStmt = db.prepare(
    `SELECT COUNT(*) as count FROM product_discounts WHERE disc_type = 'amount'`
  )
  const amountResult = amountStmt.get() as { count: number }

  return {
    total: totalResult.total,
    active: activeResult.count,
    inactive: inactiveResult.count,
    global: globalResult.count,
    product: productResult.count,
    category: categoryResult.count,
    product_type: productTypeResult.count,
    percentage: percentageResult.count,
    amount: amountResult.count,
  }
}

/**
 * Get active product discounts for a specific product
 * Used at checkout/cart to apply discounts
 */
export function getActiveProductDiscountsForProduct(
  productId: number,
  categoryIds: number[],
  productType: string,
  cartSubtotal: number,
  currentDate: string = dateToDateString(new Date())
): ProductDiscount[] {
  const conditions: string[] = []
  const params: any[] = []

  conditions.push('disc_status = ?')
  params.push('A')

  conditions.push('disc_valid_from <= ?')
  params.push(currentDate)

  conditions.push('disc_valid_to >= ?')
  params.push(currentDate)

  conditions.push('disc_from_amt <= ?')
  params.push(cartSubtotal)

  conditions.push('disc_to_amt >= ?')
  params.push(cartSubtotal)

  // Match product discounts - build conditions and params separately
  const productConditions: string[] = ["target_type = 'global'"]
  const productParams: any[] = []

  // Product-specific discount
  productConditions.push("(target_type = 'product' AND target_id = ?)")
  productParams.push(productId)

  // Category-specific discount
  if (categoryIds.length > 0) {
    const categoryPlaceholders = categoryIds.map(() => '?').join(',')
    productConditions.push(`(target_type = 'category' AND target_id IN (${categoryPlaceholders}))`)
    productParams.push(...categoryIds)
  }

  // Product type-specific discount
  productConditions.push("(target_type = 'product_type' AND target_product_type = ?)")
  productParams.push(productType)

  conditions.push(`(${productConditions.join(' OR ')})`)
  params.push(...productParams)

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const stmt = db.prepare(`
    SELECT * FROM product_discounts 
    ${whereClause}
    ORDER BY disc_perc DESC, disc_amt DESC
  `)

  const rows = stmt.all(...params) as any[]
  return rows.map(rowToProductDiscount)
}

