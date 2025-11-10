/**
 * Gift Card Database Utilities
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

export type GiftCardStatus =
  | 'pending'
  | 'active'
  | 'partially_redeemed'
  | 'redeemed'
  | 'void'

export type GiftCardTransactionType =
  | 'issue'
  | 'redeem'
  | 'adjust'
  | 'void'
  | 'reactivate'

export interface GiftCard {
  id: string
  code: string
  initial_value: number
  balance: number
  currency: string
  status: GiftCardStatus
  order_id: string | null
  order_item_id: string | null
  purchaser_name: string | null
  purchaser_email: string | null
  recipient_name: string | null
  recipient_email: string | null
  message: string | null
  send_at: number | null
  delivered_at: number | null
  issued_at: number | null
  last_redeemed_at: number | null
  external_reference: string | null
  metadata: Record<string, unknown> | null
  created_at: number
  updated_at: number
}

export interface GiftCardTransaction {
  id: string
  gift_card_id: string
  type: GiftCardTransactionType
  amount: number
  balance_after: number
  order_id: string | null
  order_number: string | null
  note: string | null
  performed_by_id: string | null
  performed_by_name: string | null
  created_at: number
}

export interface IssueGiftCardInput {
  amount: number
  currency?: string
  orderId?: string | null
  orderItemId?: string | null
  purchaserName?: string | null
  purchaserEmail?: string | null
  recipientName?: string | null
  recipientEmail?: string | null
  message?: string | null
  sendAt?: number | null
  externalReference?: string | null
  metadata?: Record<string, unknown> | null
}

export interface RedeemGiftCardInput {
  code: string
  amount: number
  orderId?: string | null
  orderNumber?: string | null
  note?: string | null
  performedById?: string | null
  performedByName?: string | null
}

export interface GiftCardFilters {
  search?: string
  status?: GiftCardStatus | GiftCardStatus[]
  email?: string
  minBalance?: number
  maxBalance?: number
  dateFrom?: number
  dateTo?: number
  limit?: number
  offset?: number
}

export interface GiftCardListResult {
  giftCards: GiftCard[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export function initGiftCardTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      initial_value REAL NOT NULL,
      balance REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'partially_redeemed', 'redeemed', 'void')),
      order_id TEXT,
      order_item_id TEXT,
      purchaser_name TEXT,
      purchaser_email TEXT,
      recipient_name TEXT,
      recipient_email TEXT,
      message TEXT,
      send_at INTEGER,
      delivered_at INTEGER,
      issued_at INTEGER,
      last_redeemed_at INTEGER,
      external_reference TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_card_transactions (
      id TEXT PRIMARY KEY,
      gift_card_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('issue', 'redeem', 'adjust', 'void', 'reactivate')),
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      order_id TEXT,
      order_number TEXT,
      note TEXT,
      performed_by_id TEXT,
      performed_by_name TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `)

  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_email ON gift_cards(recipient_email)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_order ON gift_cards(order_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_type ON gift_card_transactions(type)`)
}

initGiftCardTables()

export function generateGiftCardCode(length = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * charset.length)
    code += charset[index]
  }
  return code.replace(/(.{4})/g, '$1-').replace(/-$/, '')
}

function rowToGiftCard(row: any): GiftCard {
  return {
    id: row.id,
    code: row.code,
    initial_value: row.initial_value,
    balance: row.balance,
    currency: row.currency,
    status: row.status,
    order_id: row.order_id,
    order_item_id: row.order_item_id,
    purchaser_name: row.purchaser_name,
    purchaser_email: row.purchaser_email,
    recipient_name: row.recipient_name,
    recipient_email: row.recipient_email,
    message: row.message,
    send_at: row.send_at,
    delivered_at: row.delivered_at,
    issued_at: row.issued_at,
    last_redeemed_at: row.last_redeemed_at,
    external_reference: row.external_reference,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function issueGiftCard(input: IssueGiftCardInput): GiftCard {
  const now = Date.now()
  const currency = input.currency || 'USD'
  let code = generateGiftCardCode()

  // Ensure unique code
  while (db.prepare('SELECT code FROM gift_cards WHERE code = ?').get(code)) {
    code = generateGiftCardCode()
  }

  const giftCardId = `gift_${now}_${Math.random().toString(36).slice(2, 10)}`

  const stmt = db.prepare(`
    INSERT INTO gift_cards (
      id, code, initial_value, balance, currency, status,
      order_id, order_item_id,
      purchaser_name, purchaser_email,
      recipient_name, recipient_email,
      message, send_at, delivered_at, issued_at, last_redeemed_at,
      external_reference, metadata,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    giftCardId,
    code,
    input.amount,
    input.amount,
    currency,
    input.sendAt && input.sendAt > now ? 'pending' : 'active',
    input.orderId || null,
    input.orderItemId || null,
    input.purchaserName || null,
    input.purchaserEmail || null,
    input.recipientName || null,
    input.recipientEmail || null,
    input.message || null,
    input.sendAt || null,
    null,
    input.sendAt && input.sendAt > now ? null : now,
    null,
    input.externalReference || null,
    input.metadata ? JSON.stringify(input.metadata) : null,
    now,
    now
  )

  createGiftCardTransaction({
    gift_card_id: giftCardId,
    type: 'issue',
    amount: input.amount,
    balance_after: input.amount,
    order_id: input.orderId || null,
    order_number: null,
    note: null,
    performed_by_id: null,
    performed_by_name: input.purchaserName || 'System',
  })

  const inserted = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(giftCardId)
  return rowToGiftCard(inserted)
}

function createGiftCardTransaction(transaction: Omit<GiftCardTransaction, 'id' | 'created_at'>): GiftCardTransaction {
  const now = Date.now()
  const id = `gctx_${now}_${Math.random().toString(36).slice(2, 10)}`

  db.prepare(`
    INSERT INTO gift_card_transactions (
      id, gift_card_id, type, amount, balance_after,
      order_id, order_number, note,
      performed_by_id, performed_by_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    transaction.gift_card_id,
    transaction.type,
    transaction.amount,
    transaction.balance_after,
    transaction.order_id || null,
    transaction.order_number || null,
    transaction.note || null,
    transaction.performed_by_id || null,
    transaction.performed_by_name || null,
    now
  )

  return {
    id,
    created_at: now,
    ...transaction,
  }
}

export function getGiftCardByCode(code: string): GiftCard | null {
  const row = db.prepare('SELECT * FROM gift_cards WHERE LOWER(code) = LOWER(?)').get(code)
  return row ? rowToGiftCard(row) : null
}

export function getGiftCardById(id: string): GiftCard | null {
  const row = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(id)
  return row ? rowToGiftCard(row) : null
}

export function listGiftCards(filters: GiftCardFilters = {}): GiftCardListResult {
  const clauses: string[] = []
  const params: any[] = []

  if (filters.search) {
    clauses.push('(code LIKE ? OR recipient_email LIKE ? OR purchaser_email LIKE ?)')
    const like = `%${filters.search}%`
    params.push(like, like, like)
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      clauses.push(`status IN (${filters.status.map(() => '?').join(',')})`)
      params.push(...filters.status)
    } else {
      clauses.push('status = ?')
      params.push(filters.status)
    }
  }

  if (filters.email) {
    clauses.push('(recipient_email = ? OR purchaser_email = ?)')
    params.push(filters.email, filters.email)
  }

  if (filters.minBalance !== undefined) {
    clauses.push('balance >= ?')
    params.push(filters.minBalance)
  }

  if (filters.maxBalance !== undefined) {
    clauses.push('balance <= ?')
    params.push(filters.maxBalance)
  }

  if (filters.dateFrom) {
    clauses.push('created_at >= ?')
    params.push(filters.dateFrom)
  }

  if (filters.dateTo) {
    clauses.push('created_at <= ?')
    params.push(filters.dateTo)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const limit = Math.max(1, Math.min(filters.limit ?? 50, 200))
  const offset = Math.max(filters.offset ?? 0, 0)

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM gift_cards ${where}`).get(...params) as { count: number }
  const rows = db.prepare(`
    SELECT * FROM gift_cards
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  return {
    giftCards: rows.map(rowToGiftCard),
    total: totalRow.count,
    limit,
    offset,
    hasMore: offset + rows.length < totalRow.count,
  }
}

export function redeemGiftCard(input: RedeemGiftCardInput): GiftCard {
  const giftCard = getGiftCardByCode(input.code)
  if (!giftCard) {
    throw new Error('Gift card not found')
  }

  if (giftCard.status === 'void') {
    throw new Error('Gift card is void')
  }

  if (giftCard.status === 'pending') {
    throw new Error('Gift card is not yet active')
  }

  if (giftCard.balance <= 0) {
    throw new Error('Gift card has no remaining balance')
  }

  if (input.amount <= 0) {
    throw new Error('Redemption amount must be positive')
  }

  if (input.amount > giftCard.balance) {
    throw new Error('Redemption amount exceeds available balance')
  }

  const newBalance = giftCard.balance - input.amount
  const status: GiftCardStatus = newBalance === 0 ? 'redeemed' : 'partially_redeemed'
  const now = Date.now()

  db.prepare(`
    UPDATE gift_cards
    SET balance = ?, status = ?, last_redeemed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(newBalance, status, now, now, giftCard.id)

  createGiftCardTransaction({
    gift_card_id: giftCard.id,
    type: 'redeem',
    amount: input.amount,
    balance_after: newBalance,
    order_id: input.orderId || null,
    order_number: input.orderNumber || null,
    note: input.note || null,
    performed_by_id: input.performedById || null,
    performed_by_name: input.performedByName || 'System',
  })

  const updatedRow = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(giftCard.id)
  return rowToGiftCard(updatedRow)
}

export function adjustGiftCardBalance(
  giftCardId: string,
  amount: number,
  note: string,
  performedBy: { id?: string | null; name: string }
): GiftCard {
  const giftCard = getGiftCardById(giftCardId)
  if (!giftCard) {
    throw new Error('Gift card not found')
  }

  const newBalance = Math.max(0, giftCard.balance + amount)
  const status: GiftCardStatus =
    giftCard.status === 'void'
      ? 'void'
      : newBalance === 0
        ? 'redeemed'
        : 'active'
  const now = Date.now()

  db.prepare(`
    UPDATE gift_cards
    SET balance = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newBalance, status, now, giftCardId)

  createGiftCardTransaction({
    gift_card_id: giftCardId,
    type: 'adjust',
    amount,
    balance_after: newBalance,
    order_id: null,
    order_number: null,
    note,
    performed_by_id: performedBy.id || null,
    performed_by_name: performedBy.name,
  })

  const updatedRow = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(giftCardId)
  return rowToGiftCard(updatedRow)
}

export function voidGiftCard(giftCardId: string, performedBy?: { id?: string | null; name: string }) {
  const giftCard = getGiftCardById(giftCardId)
  if (!giftCard) {
    throw new Error('Gift card not found')
  }

  if (giftCard.status === 'void') {
    return giftCard
  }

  const now = Date.now()

  db.prepare(`
    UPDATE gift_cards
    SET status = 'void', updated_at = ?, balance = 0
    WHERE id = ?
  `).run(now, giftCardId)

  createGiftCardTransaction({
    gift_card_id: giftCardId,
    type: 'void',
    amount: giftCard.balance,
    balance_after: 0,
    order_id: null,
    order_number: null,
    note: 'Gift card voided',
    performed_by_id: performedBy?.id || null,
    performed_by_name: performedBy?.name || 'System',
  })

  const updatedRow = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(giftCardId)
  return rowToGiftCard(updatedRow)
}

export function reactivateGiftCard(
  giftCardId: string,
  startingBalance: number,
  performedBy?: { id?: string | null; name: string }
): GiftCard {
  const giftCard = getGiftCardById(giftCardId)
  if (!giftCard) {
    throw new Error('Gift card not found')
  }

  const now = Date.now()

  db.prepare(`
    UPDATE gift_cards
    SET status = 'active', balance = ?, updated_at = ?
    WHERE id = ?
  `).run(startingBalance, now, giftCardId)

  createGiftCardTransaction({
    gift_card_id: giftCardId,
    type: 'reactivate',
    amount: startingBalance,
    balance_after: startingBalance,
    order_id: null,
    order_number: null,
    note: 'Gift card reactivated',
    performed_by_id: performedBy?.id || null,
    performed_by_name: performedBy?.name || 'System',
  })

  const updatedRow = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(giftCardId)
  return rowToGiftCard(updatedRow)
}

export function markGiftCardDelivered(giftCardId: string) {
  const now = Date.now()
  db.prepare(`
    UPDATE gift_cards
    SET delivered_at = ?, status = CASE WHEN balance = 0 THEN 'redeemed' ELSE 'active' END, updated_at = ?
    WHERE id = ?
  `).run(now, now, giftCardId)
}

export function getGiftCardTransactions(giftCardId: string): GiftCardTransaction[] {
  const rows = db.prepare(`
    SELECT * FROM gift_card_transactions
    WHERE gift_card_id = ?
    ORDER BY created_at DESC
  `).all(giftCardId)

  return rows.map(row => ({
    id: row.id,
    gift_card_id: row.gift_card_id,
    type: row.type,
    amount: row.amount,
    balance_after: row.balance_after,
    order_id: row.order_id,
    order_number: row.order_number,
    note: row.note,
    performed_by_id: row.performed_by_id,
    performed_by_name: row.performed_by_name,
    created_at: row.created_at,
  }))
}

export function getGiftCardBalance(code: string) {
  const giftCard = getGiftCardByCode(code)
  if (!giftCard) {
    return null
  }

  return {
    code: giftCard.code,
    balance: giftCard.balance,
    currency: giftCard.currency,
    status: giftCard.status,
    recipient_email: giftCard.recipient_email,
    recipient_name: giftCard.recipient_name,
    issued_at: giftCard.issued_at,
    last_redeemed_at: giftCard.last_redeemed_at,
  }
}

