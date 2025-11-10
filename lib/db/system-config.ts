/**
 * System Config/Mods Database Functions
 * SQLite operations for system configuration and module toggles
 * Based on legacy SA_mods.asp functionality
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

// ==================== Types ====================

export interface SystemConfig {
  modId: number
  titles: number // 0 = No, 1 = Yes
  insurance: number // 0 = No, 1 = Yes
  shipping: number // 0 = No, 1 = Yes
  discount: number // 0 = No, 1 = Yes
  related: number // 0 = No, 1 = Yes
  featuredcart: number // 0 = No, 1 = Yes
  featwording: string // Text for "Why not try" wording
  productshipping: number // 0 = No, 1 = Yes
  callLongWait: number // 0 = No, 1 = Yes, 2 = Down
  chatActive: number // 0 = No, 1 = Yes
  phoneNumActive: number // 0 = No, 1 = Yes
  txtChatEnabled: number // 0 = No, 1 = Yes
  updated_at: number
}

export interface UpdateSystemConfigRequest {
  titles?: number
  insurance?: number
  shipping?: number
  discount?: number
  related?: number
  featuredcart?: number
  featwording?: string
  productshipping?: number
  callLongWait?: number
  chatActive?: number
  phoneNumActive?: number
  txtChatEnabled?: number
}

// ==================== Database Schema ====================

export function initSystemConfigTable() {
  const stmt = db.prepare(`
    CREATE TABLE IF NOT EXISTS mods (
      ModID INTEGER PRIMARY KEY DEFAULT 1,
      Titles INTEGER NOT NULL DEFAULT 0 CHECK(Titles IN (0, 1)),
      Insurance INTEGER NOT NULL DEFAULT 0 CHECK(Insurance IN (0, 1)),
      Shipping INTEGER NOT NULL DEFAULT 0 CHECK(Shipping IN (0, 1)),
      Discount INTEGER NOT NULL DEFAULT 0 CHECK(Discount IN (0, 1)),
      related INTEGER NOT NULL DEFAULT 0 CHECK(related IN (0, 1)),
      featuredcart INTEGER NOT NULL DEFAULT 0 CHECK(featuredcart IN (0, 1)),
      featwording TEXT DEFAULT '',
      productshipping INTEGER NOT NULL DEFAULT 0 CHECK(productshipping IN (0, 1)),
      callLongWait INTEGER NOT NULL DEFAULT 0 CHECK(callLongWait IN (0, 1, 2)),
      chatActive INTEGER NOT NULL DEFAULT 0 CHECK(chatActive IN (0, 1)),
      phoneNumActive INTEGER NOT NULL DEFAULT 0 CHECK(phoneNumActive IN (0, 1)),
      txtChatEnabled INTEGER NOT NULL DEFAULT 0 CHECK(txtChatEnabled IN (0, 1)),
      updated_at INTEGER NOT NULL
    )
  `)
  stmt.run()

  // Ensure default record exists
  const existing = db.prepare(`SELECT ModID FROM mods WHERE ModID = 1`).get()
  if (!existing) {
    const now = Date.now()
    const insertStmt = db.prepare(`
      INSERT INTO mods (
        ModID, Titles, Insurance, Shipping, Discount, related, featuredcart,
        featwording, productshipping, callLongWait, chatActive, phoneNumActive,
        txtChatEnabled, updated_at
      ) VALUES (1, 0, 0, 0, 0, 0, 0, '', 0, 0, 0, 0, 0, ?)
    `)
    insertStmt.run(now)
  }
}

// Initialize table on import
initSystemConfigTable()

// ==================== CRUD Operations ====================

/**
 * Get system configuration
 */
export function getSystemConfig(): SystemConfig | null {
  try {
    initSystemConfigTable()
    
    const stmt = db.prepare(`
      SELECT 
        ModID as modId,
        Titles as titles,
        Insurance as insurance,
        Shipping as shipping,
        Discount as discount,
        related as related,
        featuredcart as featuredcart,
        featwording as featwording,
        productshipping as productshipping,
        callLongWait as callLongWait,
        chatActive as chatActive,
        phoneNumActive as phoneNumActive,
        txtChatEnabled as txtChatEnabled,
        updated_at as updated_at
      FROM mods 
      WHERE ModID = 1
    `)
    return stmt.get() as SystemConfig | null
  } catch (error: any) {
    console.error('Error in getSystemConfig:', error)
    throw new Error('Failed to fetch system configuration')
  }
}

/**
 * Update system configuration
 */
export function updateSystemConfig(data: UpdateSystemConfigRequest): SystemConfig {
  const existing = getSystemConfig()
  if (!existing) {
    throw new Error('System configuration not found')
  }

  // Validate values
  if (data.titles !== undefined && data.titles !== 0 && data.titles !== 1) {
    throw new Error('Invalid value for titles. Must be 0 or 1')
  }
  if (data.insurance !== undefined && data.insurance !== 0 && data.insurance !== 1) {
    throw new Error('Invalid value for insurance. Must be 0 or 1')
  }
  if (data.shipping !== undefined && data.shipping !== 0 && data.shipping !== 1) {
    throw new Error('Invalid value for shipping. Must be 0 or 1')
  }
  if (data.discount !== undefined && data.discount !== 0 && data.discount !== 1) {
    throw new Error('Invalid value for discount. Must be 0 or 1')
  }
  if (data.related !== undefined && data.related !== 0 && data.related !== 1) {
    throw new Error('Invalid value for related. Must be 0 or 1')
  }
  if (data.featuredcart !== undefined && data.featuredcart !== 0 && data.featuredcart !== 1) {
    throw new Error('Invalid value for featuredcart. Must be 0 or 1')
  }
  if (data.productshipping !== undefined && data.productshipping !== 0 && data.productshipping !== 1) {
    throw new Error('Invalid value for productshipping. Must be 0 or 1')
  }
  if (data.callLongWait !== undefined && data.callLongWait !== 0 && data.callLongWait !== 1 && data.callLongWait !== 2) {
    throw new Error('Invalid value for callLongWait. Must be 0, 1, or 2')
  }
  if (data.chatActive !== undefined && data.chatActive !== 0 && data.chatActive !== 1) {
    throw new Error('Invalid value for chatActive. Must be 0 or 1')
  }
  if (data.phoneNumActive !== undefined && data.phoneNumActive !== 0 && data.phoneNumActive !== 1) {
    throw new Error('Invalid value for phoneNumActive. Must be 0 or 1')
  }
  if (data.txtChatEnabled !== undefined && data.txtChatEnabled !== 0 && data.txtChatEnabled !== 1) {
    throw new Error('Invalid value for txtChatEnabled. Must be 0 or 1')
  }

  const updates: string[] = []
  const values: any[] = []

  if (data.titles !== undefined) {
    updates.push('Titles = ?')
    values.push(data.titles)
  }
  if (data.insurance !== undefined) {
    updates.push('Insurance = ?')
    values.push(data.insurance)
  }
  if (data.shipping !== undefined) {
    updates.push('Shipping = ?')
    values.push(data.shipping)
  }
  if (data.discount !== undefined) {
    updates.push('Discount = ?')
    values.push(data.discount)
  }
  if (data.related !== undefined) {
    updates.push('related = ?')
    values.push(data.related)
  }
  if (data.featuredcart !== undefined) {
    updates.push('featuredcart = ?')
    values.push(data.featuredcart)
  }
  if (data.featwording !== undefined) {
    updates.push('featwording = ?')
    values.push(data.featwording || '')
  }
  if (data.productshipping !== undefined) {
    updates.push('productshipping = ?')
    values.push(data.productshipping)
  }
  if (data.callLongWait !== undefined) {
    updates.push('callLongWait = ?')
    values.push(data.callLongWait)
  }
  if (data.chatActive !== undefined) {
    updates.push('chatActive = ?')
    values.push(data.chatActive)
  }
  if (data.phoneNumActive !== undefined) {
    updates.push('phoneNumActive = ?')
    values.push(data.phoneNumActive)
  }
  if (data.txtChatEnabled !== undefined) {
    updates.push('txtChatEnabled = ?')
    values.push(data.txtChatEnabled)
  }

  if (updates.length === 0) {
    return existing
  }

  updates.push('updated_at = ?')
  values.push(Date.now())
  values.push(1) // ModID = 1

  const stmt = db.prepare(`
    UPDATE mods 
    SET ${updates.join(', ')} 
    WHERE ModID = ?
  `)

  stmt.run(...values)
  return getSystemConfig()!
}




