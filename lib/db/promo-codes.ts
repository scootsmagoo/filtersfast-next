/**
 * Promo Code Database Functions
 */

import Database from 'better-sqlite3'
import { PromoCode, PromoCodeUsage } from '@/lib/types/promo'

const db = new Database('auth.db')

// Initialize promo code tables
export function initPromoTables() {
  // Promo codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL COLLATE NOCASE,
      description TEXT NOT NULL,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed', 'free_shipping')),
      discount_value REAL NOT NULL,
      min_order_amount REAL,
      max_discount REAL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      per_customer_limit INTEGER DEFAULT 1,
      applicable_products TEXT,
      applicable_categories TEXT,
      first_time_only INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_promo_code ON promo_codes(code);
    CREATE INDEX IF NOT EXISTS idx_promo_active ON promo_codes(active, start_date, end_date);
  `)

  // Promo code usage table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_code_usage (
      id TEXT PRIMARY KEY,
      promo_code_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      discount_amount REAL NOT NULL,
      used_at INTEGER NOT NULL,
      FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_usage_customer ON promo_code_usage(customer_id, promo_code_id);
    CREATE INDEX IF NOT EXISTS idx_usage_order ON promo_code_usage(order_id);
  `)
}

// Initialize tables on import
initPromoTables()

/**
 * Get promo code by code
 */
export function getPromoCode(code: string): PromoCode | null {
  const stmt = db.prepare(`
    SELECT * FROM promo_codes 
    WHERE LOWER(code) = LOWER(?) AND active = 1
  `)
  
  const row = stmt.get(code) as any
  
  if (!row) return null
  
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minOrderAmount: row.min_order_amount,
    maxDiscount: row.max_discount,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    usageLimit: row.usage_limit,
    usageCount: row.usage_count,
    perCustomerLimit: row.per_customer_limit,
    applicableProducts: row.applicable_products ? JSON.parse(row.applicable_products) : undefined,
    applicableCategories: row.applicable_categories ? JSON.parse(row.applicable_categories) : undefined,
    firstTimeOnly: row.first_time_only === 1,
    active: row.active === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

/**
 * Get customer usage count for promo code
 */
export function getCustomerUsageCount(promoCodeId: string, customerId: string): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM promo_code_usage 
    WHERE promo_code_id = ? AND customer_id = ?
  `)
  
  const result = stmt.get(promoCodeId, customerId) as { count: number }
  return result.count
}

/**
 * Check if customer is first-time
 */
export function isFirstTimeCustomer(customerId: string): boolean {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM orders 
    WHERE customer_id = ? AND status = 'completed'
  `)
  
  const result = stmt.get(customerId) as { count: number }
  return result.count === 0
}

/**
 * Record promo code usage
 */
export function recordPromoUsage(
  promoCodeId: string,
  customerId: string,
  orderId: string,
  discountAmount: number
): PromoCodeUsage {
  const id = crypto.randomUUID()
  const now = Date.now()
  
  const stmt = db.prepare(`
    INSERT INTO promo_code_usage (
      id, promo_code_id, customer_id, order_id, discount_amount, used_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(id, promoCodeId, customerId, orderId, discountAmount, now)
  
  // Increment usage count
  const updateStmt = db.prepare(`
    UPDATE promo_codes 
    SET usage_count = usage_count + 1,
        updated_at = ?
    WHERE id = ?
  `)
  
  updateStmt.run(now, promoCodeId)
  
  return {
    id,
    promoCodeId,
    customerId,
    orderId,
    discountAmount,
    usedAt: new Date(now)
  }
}

/**
 * Create a new promo code
 */
export function createPromoCode(promo: Omit<PromoCode, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): PromoCode {
  const id = crypto.randomUUID()
  const now = Date.now()
  
  const stmt = db.prepare(`
    INSERT INTO promo_codes (
      id, code, description, discount_type, discount_value,
      min_order_amount, max_discount, start_date, end_date,
      usage_limit, usage_count, per_customer_limit,
      applicable_products, applicable_categories,
      first_time_only, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    id,
    promo.code.toUpperCase(),
    promo.description,
    promo.discountType,
    promo.discountValue,
    promo.minOrderAmount ?? null,
    promo.maxDiscount ?? null,
    promo.startDate.getTime(),
    promo.endDate.getTime(),
    promo.usageLimit ?? null,
    promo.perCustomerLimit ?? 1,
    promo.applicableProducts ? JSON.stringify(promo.applicableProducts) : null,
    promo.applicableCategories ? JSON.stringify(promo.applicableCategories) : null,
    promo.firstTimeOnly ? 1 : 0,
    promo.active ? 1 : 0,
    now,
    now
  )
  
  return {
    ...promo,
    id,
    usageCount: 0,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  }
}

/**
 * Get all active promo codes
 */
export function getAllActivePromoCodes(): PromoCode[] {
  const stmt = db.prepare(`
    SELECT * FROM promo_codes 
    WHERE active = 1 AND end_date >= ?
    ORDER BY created_at DESC
  `)
  
  const rows = stmt.all(Date.now()) as any[]
  
  return rows.map(row => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minOrderAmount: row.min_order_amount,
    maxDiscount: row.max_discount,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    usageLimit: row.usage_limit,
    usageCount: row.usage_count,
    perCustomerLimit: row.per_customer_limit,
    applicableProducts: row.applicable_products ? JSON.parse(row.applicable_products) : undefined,
    applicableCategories: row.applicable_categories ? JSON.parse(row.applicable_categories) : undefined,
    firstTimeOnly: row.first_time_only === 1,
    active: row.active === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }))
}

/**
 * Delete a promo code
 */
export function deletePromoCode(id: string): boolean {
  const stmt = db.prepare('DELETE FROM promo_codes WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

/**
 * Update promo code
 */
export function updatePromoCode(id: string, updates: Partial<PromoCode>): boolean {
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.description) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.discountValue !== undefined) {
    fields.push('discount_value = ?')
    values.push(updates.discountValue)
  }
  if (updates.minOrderAmount !== undefined) {
    fields.push('min_order_amount = ?')
    values.push(updates.minOrderAmount)
  }
  if (updates.maxDiscount !== undefined) {
    fields.push('max_discount = ?')
    values.push(updates.maxDiscount)
  }
  if (updates.startDate) {
    fields.push('start_date = ?')
    values.push(updates.startDate.getTime())
  }
  if (updates.endDate) {
    fields.push('end_date = ?')
    values.push(updates.endDate.getTime())
  }
  if (updates.usageLimit !== undefined) {
    fields.push('usage_limit = ?')
    values.push(updates.usageLimit)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }
  
  if (fields.length === 0) return false
  
  fields.push('updated_at = ?')
  values.push(Date.now())
  values.push(id)
  
  const stmt = db.prepare(`
    UPDATE promo_codes 
    SET ${fields.join(', ')}
    WHERE id = ?
  `)
  
  const result = stmt.run(...values)
  return result.changes > 0
}

