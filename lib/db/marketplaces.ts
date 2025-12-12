/**
 * Marketplace Channel & Order Database Helpers
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import {
  MarketplaceChannel,
  MarketplaceChannelStatus,
  MarketplaceCredentials,
  MarketplaceOrder,
  MarketplaceOrderFilters,
  MarketplaceOrderInput,
  MarketplaceOrderItem,
  MarketplaceOrderListResult,
  MarketplaceSummaryMetrics,
  MarketplaceSyncOptions,
  MarketplaceSyncResult,
  MarketplaceSyncRun,
  MarketplaceTaxState,
  MarketplaceTrendPoint,
  MarketplaceSyncStatus,
  MarketplacePlatform,
} from '@/lib/types/marketplace'

const dbPath = join(process.cwd(), 'filtersfast.db')

let schemaInitialized = false

function getDb() {
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  ensureSchema(db)
  return db
}

function ensureSchema(db: Database.Database) {
  if (schemaInitialized) return

  db.exec(`
    CREATE TABLE IF NOT EXISTS marketplace_channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'inactive',
      sync_enabled INTEGER NOT NULL DEFAULT 1 CHECK(sync_enabled IN (0, 1)),
      sync_frequency_minutes INTEGER,
      last_synced_at INTEGER,
      last_successful_sync_at INTEGER,
      last_sync_status TEXT,
      last_sync_message TEXT,
      credentials TEXT,
      settings TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS marketplace_orders (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      external_id TEXT NOT NULL,
      external_number TEXT,
      status TEXT NOT NULL,
      financial_status TEXT NOT NULL,
      fulfillment_status TEXT NOT NULL,
      purchase_date INTEGER NOT NULL,
      imported_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      acknowledged_at INTEGER,
      customer_name TEXT,
      customer_email TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      subtotal REAL NOT NULL DEFAULT 0,
      shipping REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      marketplace_fees REAL NOT NULL DEFAULT 0,
      promo_codes TEXT,
      shipping_address TEXT,
      data TEXT,
      FOREIGN KEY(channel_id) REFERENCES marketplace_channels(id) ON DELETE CASCADE,
      UNIQUE(channel_id, external_id)
    );

    CREATE TABLE IF NOT EXISTS marketplace_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      title TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      marketplace_fee REAL NOT NULL DEFAULT 0,
      data TEXT,
      FOREIGN KEY(order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS marketplace_order_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_time INTEGER NOT NULL,
      message TEXT,
      data TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS marketplace_sync_runs (
      id TEXT PRIMARY KEY,
      channel_id TEXT,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      imported_count INTEGER NOT NULL DEFAULT 0,
      updated_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      message TEXT,
      metadata TEXT,
      FOREIGN KEY(channel_id) REFERENCES marketplace_channels(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS marketplace_tax_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      state_code TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      UNIQUE(channel_id, state_code),
      FOREIGN KEY(channel_id) REFERENCES marketplace_channels(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_marketplace_orders_channel_purchase
      ON marketplace_orders(channel_id, purchase_date DESC);

    CREATE INDEX IF NOT EXISTS idx_marketplace_orders_external
      ON marketplace_orders(channel_id, external_id);

    CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order
      ON marketplace_order_items(order_id);

    CREATE INDEX IF NOT EXISTS idx_marketplace_sync_runs_started
      ON marketplace_sync_runs(started_at DESC);

    CREATE INDEX IF NOT EXISTS idx_marketplace_tax_states_channel
      ON marketplace_tax_states(channel_id);
  `)

  schemaInitialized = true
}

function toISO(value: number | null | undefined): string | null {
  if (!value || Number.isNaN(value)) return null
  return new Date(Number(value)).toISOString()
}

function parseJSON<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.warn('Failed to parse JSON column', error)
    return null
  }
}

function stringifyJSON(value: unknown): string | null {
  if (value === null || value === undefined) return null
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

function mapChannelRow(row: any): MarketplaceChannel {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    platform: row.platform as MarketplacePlatform,
    status: row.status as MarketplaceChannelStatus,
    syncEnabled: Boolean(row.sync_enabled),
    syncFrequencyMinutes: row.sync_frequency_minutes ?? null,
    lastSyncedAt: toISO(row.last_synced_at),
    lastSuccessfulSyncAt: toISO(row.last_successful_sync_at),
    lastSyncStatus: row.last_sync_status as MarketplaceSyncStatus | null,
    lastSyncMessage: row.last_sync_message ?? null,
    credentials: parseJSON<MarketplaceCredentials>(row.credentials),
    settings: parseJSON<Record<string, unknown>>(row.settings),
    createdAt: toISO(row.created_at)!,
    updatedAt: toISO(row.updated_at)!,
  }
}

function mapOrderRow(row: any): Omit<MarketplaceOrder, 'items'> {
  return {
    id: row.id,
    channelId: row.channel_id,
    channelName: row.channel_name ?? row.channel_id,
    platform: row.platform as MarketplacePlatform,
    externalId: row.external_id,
    externalNumber: row.external_number ?? null,
    status: row.status,
    financialStatus: row.financial_status,
    fulfillmentStatus: row.fulfillment_status,
    purchaseDate: toISO(row.purchase_date)!,
    importedAt: toISO(row.imported_at)!,
    updatedAt: toISO(row.updated_at)!,
    acknowledgedAt: toISO(row.acknowledged_at),
    customerName: row.customer_name ?? null,
    customerEmail: row.customer_email ?? null,
    currency: row.currency ?? 'USD',
    subtotal: row.subtotal ?? 0,
    shipping: row.shipping ?? 0,
    tax: row.tax ?? 0,
    total: row.total ?? 0,
    marketplaceFees: row.marketplace_fees ?? 0,
    promocodes: parseJSON<string[]>(row.promo_codes),
    shippingAddress: parseJSON(row.shipping_address),
    data: parseJSON<Record<string, unknown>>(row.data),
  }
}

function mapItemRow(row: any): MarketplaceOrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    sku: row.sku,
    title: row.title,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    marketplaceFee: row.marketplace_fee ?? 0,
    data: parseJSON<Record<string, unknown>>(row.data),
  }
}

function mapSyncRow(row: any): MarketplaceSyncRun {
  return {
    id: row.id,
    channelId: row.channel_id ?? null,
    channelName: row.channel_name ?? null,
    platform: (row.platform ?? null) as MarketplacePlatform | null,
    status: row.status as MarketplaceSyncStatus,
    source: row.source,
    startedAt: toISO(row.started_at)!,
    completedAt: toISO(row.completed_at),
    importedCount: row.imported_count ?? 0,
    updatedCount: row.updated_count ?? 0,
    skippedCount: row.skipped_count ?? 0,
    errorCount: row.error_count ?? 0,
    message: row.message ?? null,
    metadata: parseJSON<Record<string, unknown>>(row.metadata),
  }
}

function toUnixTimestamp(value?: string | null): number | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date value')
  }
  return parsed.getTime()
}

// -----------------------------------------------------------------------------
// Channel helpers
// -----------------------------------------------------------------------------

export interface CreateMarketplaceChannelInput {
  id: string
  name: string
  slug: string
  platform: MarketplacePlatform
  status?: MarketplaceChannelStatus
  syncEnabled?: boolean
  syncFrequencyMinutes?: number | null
  credentials?: MarketplaceCredentials | null
  settings?: Record<string, unknown> | null
}

export interface UpdateMarketplaceChannelInput {
  name?: string
  status?: MarketplaceChannelStatus
  syncEnabled?: boolean
  syncFrequencyMinutes?: number | null
  lastSyncStatus?: MarketplaceSyncStatus | null
  lastSyncMessage?: string | null
  lastSyncedAt?: string | null
  lastSuccessfulSyncAt?: string | null
  credentials?: MarketplaceCredentials | null
  settings?: Record<string, unknown> | null
}

export function getMarketplaceChannels(): MarketplaceChannel[] {
  const db = getDb()
  try {
    const stmt = db.prepare(`
      SELECT *
      FROM marketplace_channels
      ORDER BY name ASC
    `)
    const rows = stmt.all()
    return rows.map(mapChannelRow)
  } finally {
    db.close()
  }
}

export function getMarketplaceChannel(id: string): MarketplaceChannel | null {
  const db = getDb()
  try {
    const stmt = db.prepare(`SELECT * FROM marketplace_channels WHERE id = ?`)
    const row = stmt.get(id)
    return row ? mapChannelRow(row) : null
  } finally {
    db.close()
  }
}

export function getMarketplaceChannelBySlug(slug: string): MarketplaceChannel | null {
  const db = getDb()
  try {
    const stmt = db.prepare(`SELECT * FROM marketplace_channels WHERE slug = ?`)
    const row = stmt.get(slug)
    return row ? mapChannelRow(row) : null
  } finally {
    db.close()
  }
}

export function createMarketplaceChannel(input: CreateMarketplaceChannelInput): MarketplaceChannel {
  const db = getDb()
  try {
    const now = Date.now()
    db.prepare(
      `
      INSERT INTO marketplace_channels (
        id, name, slug, platform, status, sync_enabled,
        sync_frequency_minutes, credentials, settings,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      input.id,
      input.name,
      input.slug,
      input.platform,
      input.status ?? 'inactive',
      input.syncEnabled === false ? 0 : 1,
      input.syncFrequencyMinutes ?? null,
      stringifyJSON(input.credentials),
      stringifyJSON(input.settings),
      now,
      now
    )

    return getMarketplaceChannel(input.id)!
  } finally {
    db.close()
  }
}

export function updateMarketplaceChannel(id: string, input: UpdateMarketplaceChannelInput): MarketplaceChannel {
  const db = getDb()
  try {
    const existing = getMarketplaceChannel(id)
    if (!existing) {
      throw new Error(`Marketplace channel ${id} not found`)
    }

    const updates: string[] = []
    const values: any[] = []

    if (input.name !== undefined) {
      updates.push('name = ?')
      values.push(input.name)
    }
    if (input.status !== undefined) {
      updates.push('status = ?')
      values.push(input.status)
    }
    if (input.syncEnabled !== undefined) {
      updates.push('sync_enabled = ?')
      values.push(input.syncEnabled ? 1 : 0)
    }
    if (input.syncFrequencyMinutes !== undefined) {
      updates.push('sync_frequency_minutes = ?')
      values.push(input.syncFrequencyMinutes ?? null)
    }
    if (input.lastSyncedAt !== undefined) {
      updates.push('last_synced_at = ?')
      values.push(input.lastSyncedAt ? new Date(input.lastSyncedAt).getTime() : null)
    }
    if (input.lastSuccessfulSyncAt !== undefined) {
      updates.push('last_successful_sync_at = ?')
      values.push(input.lastSuccessfulSyncAt ? new Date(input.lastSuccessfulSyncAt).getTime() : null)
    }
    if (input.lastSyncStatus !== undefined) {
      updates.push('last_sync_status = ?')
      values.push(input.lastSyncStatus ?? null)
    }
    if (input.lastSyncMessage !== undefined) {
      updates.push('last_sync_message = ?')
      values.push(input.lastSyncMessage ?? null)
    }
    if (input.credentials !== undefined) {
      updates.push('credentials = ?')
      values.push(stringifyJSON(input.credentials))
    }
    if (input.settings !== undefined) {
      updates.push('settings = ?')
      values.push(stringifyJSON(input.settings))
    }

    if (updates.length === 0) {
      return existing
    }

    updates.push('updated_at = ?')
    values.push(Date.now())

    values.push(id)

    db.prepare(
      `
      UPDATE marketplace_channels
      SET ${updates.join(', ')}
      WHERE id = ?
    `
    ).run(...values)

    return getMarketplaceChannel(id)!
  } finally {
    db.close()
  }
}

// -----------------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------------

function generateOrderId(channelId: string, externalId: string) {
  return `mp_${channelId}_${externalId}`
}

function generateItemId(orderId: string, sku: string, index: number) {
  return `mpi_${orderId}_${sku}_${index}`
}

export interface RecordMarketplaceOrderResult {
  created: boolean
  updated: boolean
  order: MarketplaceOrder
}

export function recordMarketplaceOrder(
  channelId: string,
  input: MarketplaceOrderInput,
  importedAt: string = new Date().toISOString()
): RecordMarketplaceOrderResult {
  const db = getDb()
  const now = Date.now()

  try {
    const orderId = generateOrderId(channelId, input.externalId)
    const orderRow = db
      .prepare(
        `
        SELECT mo.*, mc.name as channel_name, mc.platform
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        WHERE mo.id = ?
      `
      )
      .get(orderId)

    const purchaseDate = new Date(input.purchaseDate).getTime()
    const importedTimestamp = importedAt ? new Date(importedAt).getTime() : now
    const acknowledgedTimestamp = input.acknowledgedAt ? new Date(input.acknowledgedAt).getTime() : null

    if (!orderRow) {
      db.prepare(
        `
        INSERT INTO marketplace_orders (
          id, channel_id, external_id, external_number,
          status, financial_status, fulfillment_status,
          purchase_date, imported_at, updated_at, acknowledged_at,
          customer_name, customer_email, currency,
          subtotal, shipping, tax, total,
          marketplace_fees, promo_codes, shipping_address, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        orderId,
        channelId,
        input.externalId,
        input.externalNumber ?? null,
        input.status,
        input.financialStatus,
        input.fulfillmentStatus,
        purchaseDate,
        importedTimestamp,
        importedTimestamp,
        acknowledgedTimestamp,
        input.customerName ?? null,
        input.customerEmail ?? null,
        input.currency ?? 'USD',
        input.subtotal ?? 0,
        input.shipping ?? 0,
        input.tax ?? 0,
        input.total,
        input.marketplaceFees ?? 0,
        stringifyJSON(input.promocodes ?? null),
        stringifyJSON(input.shippingAddress ?? null),
        stringifyJSON(input.data ?? null)
      )

      // Insert items
      const itemStmt = db.prepare(
        `
        INSERT INTO marketplace_order_items (
          id, order_id, sku, title, quantity,
          unit_price, total_price, marketplace_fee, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )

      input.items.forEach((item, index) => {
        const itemId = generateItemId(orderId, item.sku || `item${index}`, index)
        itemStmt.run(
          itemId,
          orderId,
          item.sku,
          item.title,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.marketplaceFee ?? 0,
          stringifyJSON(item.data ?? null)
        )
      })
    } else {
      db.prepare(
        `
        UPDATE marketplace_orders
        SET status = ?,
            financial_status = ?,
            fulfillment_status = ?,
            purchase_date = ?,
            external_number = ?,
            acknowledged_at = ?,
            customer_name = ?,
            customer_email = ?,
            currency = ?,
            subtotal = ?,
            shipping = ?,
            tax = ?,
            total = ?,
            marketplace_fees = ?,
            promo_codes = ?,
            shipping_address = ?,
            data = ?,
            updated_at = ? 
        WHERE id = ?
      `
      ).run(
        input.status,
        input.financialStatus,
        input.fulfillmentStatus,
        purchaseDate,
        input.externalNumber ?? null,
        acknowledgedTimestamp,
        input.customerName ?? null,
        input.customerEmail ?? null,
        input.currency ?? 'USD',
        input.subtotal ?? 0,
        input.shipping ?? 0,
        input.tax ?? 0,
        input.total,
        input.marketplaceFees ?? 0,
        stringifyJSON(input.promocodes ?? null),
        stringifyJSON(input.shippingAddress ?? null),
        stringifyJSON(input.data ?? null),
        now,
        orderId
      )

      // Replace items
      db.prepare(`DELETE FROM marketplace_order_items WHERE order_id = ?`).run(orderId)
      const itemStmt = db.prepare(
        `
        INSERT INTO marketplace_order_items (
          id, order_id, sku, title, quantity,
          unit_price, total_price, marketplace_fee, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      input.items.forEach((item, index) => {
        const itemId = generateItemId(orderId, item.sku || `item${index}`, index)
        itemStmt.run(
          itemId,
          orderId,
          item.sku,
          item.title,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.marketplaceFee ?? 0,
          stringifyJSON(item.data ?? null)
        )
      })
    }

    const order = getMarketplaceOrder(orderId)!
    return {
      created: !orderRow,
      updated: Boolean(orderRow),
      order,
    }
  } finally {
    db.close()
  }
}

export function getMarketplaceOrder(id: string): MarketplaceOrder | null {
  const db = getDb()
  try {
    const orderRow = db
      .prepare(
        `
        SELECT mo.*, mc.name as channel_name, mc.platform
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        WHERE mo.id = ?
      `
      )
      .get(id)

    if (!orderRow) return null

    const items = db
      .prepare(`SELECT * FROM marketplace_order_items WHERE order_id = ? ORDER BY title ASC`)
      .all(id)
      .map(mapItemRow)

    return {
      ...mapOrderRow(orderRow),
      items,
    }
  } finally {
    db.close()
  }
}

export function getMarketplaceOrders(filters: MarketplaceOrderFilters = {}): MarketplaceOrderListResult {
  const db = getDb()
  try {
    const conditions: string[] = []
    const params: any[] = []

    if (filters.channelId) {
      conditions.push('mo.channel_id = ?')
      params.push(filters.channelId)
    }
    if (filters.platform) {
      conditions.push('mc.platform = ?')
      params.push(filters.platform)
    }
    if (filters.status && filters.status !== 'any') {
      conditions.push('mo.status = ?')
      params.push(filters.status)
    }
    const fromTimestamp = toUnixTimestamp(filters.from ?? null)
    if (fromTimestamp !== undefined) {
      conditions.push('mo.purchase_date >= ?')
      params.push(fromTimestamp)
    }
    const toTimestamp = toUnixTimestamp(filters.to ?? null)
    if (toTimestamp !== undefined) {
      conditions.push('mo.purchase_date <= ?')
      params.push(toTimestamp)
    }
    if (filters.search) {
      const like = `%${filters.search.toLowerCase()}%`
      conditions.push(
        `(LOWER(mo.external_id) LIKE ? OR LOWER(mo.external_number) LIKE ? OR LOWER(mo.customer_email) LIKE ? OR LOWER(mo.customer_name) LIKE ?)`
      )
      params.push(like, like, like, like)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = filters.limit ?? 25
    const offset = filters.offset ?? 0

    const rows = db
      .prepare(
        `
        SELECT mo.*, mc.name as channel_name, mc.platform
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        ${whereClause}
        ORDER BY mo.purchase_date DESC
        LIMIT ? OFFSET ?
      `
      )
      .all(...params, limit, offset)

    const orderIds = rows.map((row: any) => row.id)

    let itemsByOrder: Record<string, MarketplaceOrderItem[]> = {}
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(', ')
      const itemRows = db
        .prepare(
          `
          SELECT *
          FROM marketplace_order_items
          WHERE order_id IN (${placeholders})
          ORDER BY order_id, title
        `
        )
        .all(...orderIds)

      itemsByOrder = itemRows.reduce((acc: Record<string, MarketplaceOrderItem[]>, row: any) => {
        const orderId = row.order_id
        if (!acc[orderId]) acc[orderId] = []
        acc[orderId].push(mapItemRow(row))
        return acc
      }, {})
    }

    const orders = rows.map((row: any) => ({
      ...mapOrderRow(row),
      items: itemsByOrder[row.id] ?? [],
    }))

    const total = db
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        ${whereClause}
      `
      )
      .get(...params) as { total: number }

    return {
      orders,
      total: total?.total ?? 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    }
  } finally {
    db.close()
  }
}

// -----------------------------------------------------------------------------
// Sync Runs
// -----------------------------------------------------------------------------

export function startMarketplaceSyncRun(
  options: MarketplaceSyncOptions & { channelId?: string; source?: 'manual' | 'scheduled' | 'webhook' }
): MarketplaceSyncRun {
  const db = getDb()
  try {
    const id = `mpsync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const channel = options.channelId ? getMarketplaceChannel(options.channelId) : null

    db.prepare(
      `
      INSERT INTO marketplace_sync_runs (
        id, channel_id, status, source,
        started_at, message, metadata
      ) VALUES (?, ?, 'running', ?, ?, NULL, ?)
    `
    ).run(
      id,
      options.channelId ?? null,
      options.source ?? 'manual',
      Date.now(),
      stringifyJSON({
        since: options.since ?? null,
        until: options.until ?? null,
        limit: options.limit ?? null,
      })
    )

    return {
      id,
      channelId: channel?.id ?? null,
      channelName: channel?.name ?? null,
      platform: channel?.platform ?? null,
      status: 'running',
      source: options.source ?? 'manual',
      startedAt: new Date().toISOString(),
      completedAt: null,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      message: null,
      metadata: {
        since: options.since ?? null,
        until: options.until ?? null,
        limit: options.limit ?? null,
      },
    }
  } finally {
    db.close()
  }
}

export function completeMarketplaceSyncRun(
  runId: string,
  status: MarketplaceSyncStatus,
  counts: { imported?: number; updated?: number; skipped?: number; errors?: number },
  message?: string,
  metadata?: Record<string, unknown>
): MarketplaceSyncRun | null {
  const db = getDb()
  try {
    const stmt = db.prepare(
      `
      UPDATE marketplace_sync_runs
      SET status = ?,
          completed_at = ?,
          imported_count = COALESCE(imported_count, 0) + ?,
          updated_count = COALESCE(updated_count, 0) + ?,
          skipped_count = COALESCE(skipped_count, 0) + ?,
          error_count = COALESCE(error_count, 0) + ?,
          message = ?,
          metadata = ?
      WHERE id = ?
    `
    )

    stmt.run(
      status,
      Date.now(),
      counts.imported ?? 0,
      counts.updated ?? 0,
      counts.skipped ?? 0,
      counts.errors ?? 0,
      message ?? null,
      metadata ? stringifyJSON(metadata) : null,
      runId
    )

    const row = db
      .prepare(
        `
        SELECT sr.*, mc.name as channel_name, mc.platform
        FROM marketplace_sync_runs sr
        LEFT JOIN marketplace_channels mc ON mc.id = sr.channel_id
        WHERE sr.id = ?
      `
      )
      .get(runId)

    return row ? mapSyncRow(row) : null
  } finally {
    db.close()
  }
}

export function appendMarketplaceSyncRunCounts(runId: string, delta: { imported?: number; updated?: number; skipped?: number; errors?: number }) {
  const db = getDb()
  try {
    db.prepare(
      `
      UPDATE marketplace_sync_runs
      SET imported_count = COALESCE(imported_count, 0) + ?,
          updated_count = COALESCE(updated_count, 0) + ?,
          skipped_count = COALESCE(skipped_count, 0) + ?,
          error_count = COALESCE(error_count, 0) + ?
      WHERE id = ?
    `
    ).run(
      delta.imported ?? 0,
      delta.updated ?? 0,
      delta.skipped ?? 0,
      delta.errors ?? 0,
      runId
    )
  } finally {
    db.close()
  }
}

export function getMarketplaceSyncHistory(limit = 20): MarketplaceSyncRun[] {
  const db = getDb()
  try {
    const rows = db
      .prepare(
        `
        SELECT sr.*, mc.name as channel_name, mc.platform
        FROM marketplace_sync_runs sr
        LEFT JOIN marketplace_channels mc ON mc.id = sr.channel_id
        ORDER BY sr.started_at DESC
        LIMIT ?
      `
      )
      .all(limit)

    return rows.map(mapSyncRow)
  } finally {
    db.close()
  }
}

// -----------------------------------------------------------------------------
// Tax States
// -----------------------------------------------------------------------------

export function getMarketplaceTaxStates(channelId?: string): MarketplaceTaxState[] {
  const db = getDb()
  try {
    const rows = db
      .prepare(
        `
        SELECT mts.*, mc.platform
        FROM marketplace_tax_states mts
        INNER JOIN marketplace_channels mc ON mc.id = mts.channel_id
        ${channelId ? 'WHERE mts.channel_id = ?' : ''}
        ORDER BY mts.state_code ASC
      `
      )
      .all(channelId ? [channelId] : [])

    return rows.map((row: any) => ({
      id: row.id,
      channelId: row.channel_id,
      platform: row.platform,
      stateCode: row.state_code,
      addedAt: toISO(row.added_at)!,
    }))
  } finally {
    db.close()
  }
}

export function addMarketplaceTaxState(channelId: string, stateCode: string): MarketplaceTaxState {
  const db = getDb()
  try {
    const channel = getMarketplaceChannel(channelId)
    if (!channel) {
      throw new Error('Marketplace channel not found')
    }

    db.prepare(
      `
      INSERT OR IGNORE INTO marketplace_tax_states (
        channel_id, platform, state_code, added_at
      ) VALUES (?, ?, ?, ?)
    `
    ).run(channelId, channel.platform, stateCode.toUpperCase(), Date.now())

    const row = db
      .prepare(
        `
        SELECT *
        FROM marketplace_tax_states
        WHERE channel_id = ? AND state_code = ?
      `
      )
      .get(channelId, stateCode.toUpperCase())

    return {
      id: row.id,
      channelId: row.channel_id,
      platform: row.platform,
      stateCode: row.state_code,
      addedAt: toISO(row.added_at)!,
    }
  } finally {
    db.close()
  }
}

export function removeMarketplaceTaxState(entryId: number): void {
  const db = getDb()
  try {
    db.prepare(`DELETE FROM marketplace_tax_states WHERE id = ?`).run(entryId)
  } finally {
    db.close()
  }
}

// -----------------------------------------------------------------------------
// Summary & Reporting
// -----------------------------------------------------------------------------

export interface MarketplaceSummaryFilters {
  from?: string
  to?: string
}

export function getMarketplaceSummary(filters: MarketplaceSummaryFilters = {}): MarketplaceSummaryMetrics {
  const db = getDb()
  try {
    const conditions: string[] = []
    const params: any[] = []

    const fromTimestamp = toUnixTimestamp(filters.from ?? null)
    if (fromTimestamp !== undefined) {
      conditions.push('mo.purchase_date >= ?')
      params.push(fromTimestamp)
    }
    const toTimestamp = toUnixTimestamp(filters.to ?? null)
    if (toTimestamp !== undefined) {
      conditions.push('mo.purchase_date <= ?')
      params.push(toTimestamp)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const totalsRow = db
      .prepare(
        `
        SELECT 
          COUNT(*) as total_orders,
          SUM(mo.total) as total_revenue,
          SUM(mo.marketplace_fees) as total_fees,
          MAX(mc.last_synced_at) as last_synced_at
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        ${whereClause}
      `
      )
      .get(...params)

    const ordersByPlatform = db
      .prepare(
        `
        SELECT 
          mc.platform,
          COUNT(*) as order_count,
          SUM(mo.total) as revenue,
          SUM(mo.marketplace_fees) as fees
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        ${whereClause}
        GROUP BY mc.platform
      `
      )
      .all(...params)
      .map((row: any) => ({
        platform: row.platform as MarketplacePlatform,
        platformLabel: row.platform.toUpperCase(),
        orderCount: row.order_count ?? 0,
        revenue: row.revenue ?? 0,
        fees: row.fees ?? 0,
      }))

    const ordersByChannel = db
      .prepare(
        `
        SELECT 
          mc.id as channel_id,
          mc.name,
          COUNT(*) as order_count,
          SUM(mo.total) as revenue,
          SUM(mo.marketplace_fees) as fees,
          mc.last_synced_at
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        ${whereClause}
        GROUP BY mc.id, mc.name, mc.last_synced_at
        ORDER BY revenue DESC
      `
      )
      .all(...params)
      .map((row: any) => ({
        channelId: row.channel_id,
        name: row.name,
        orderCount: row.order_count ?? 0,
        revenue: row.revenue ?? 0,
        fees: row.fees ?? 0,
        lastSyncedAt: toISO(row.last_synced_at),
      }))

    const recentOrdersRows = db
      .prepare(
        `
        SELECT mo.*, mc.name as channel_name, mc.platform
        FROM marketplace_orders mo
        INNER JOIN marketplace_channels mc ON mc.id = mo.channel_id
        ${whereClause}
        ORDER BY mo.purchase_date DESC
        LIMIT 10
      `
      )
      .all(...params)

    const recentOrderIds = recentOrdersRows.map((row: any) => row.id)
    let itemsByOrder: Record<string, MarketplaceOrderItem[]> = {}
    if (recentOrderIds.length) {
      const placeholders = recentOrderIds.map(() => '?').join(', ')
      const itemRows = db
        .prepare(
          `
          SELECT *
          FROM marketplace_order_items
          WHERE order_id IN (${placeholders})
        `
        )
        .all(...recentOrderIds)
      itemsByOrder = itemRows.reduce((acc: Record<string, MarketplaceOrderItem[]>, row: any) => {
        const orderId = row.order_id
        if (!acc[orderId]) acc[orderId] = []
        acc[orderId].push(mapItemRow(row))
        return acc
      }, {})
    }

    const recentOrders = recentOrdersRows.map((row: any) => ({
      ...mapOrderRow(row),
      items: itemsByOrder[row.id] ?? [],
    }))

    return {
      totalOrders: totalsRow?.total_orders ?? 0,
      totalRevenue: totalsRow?.total_revenue ?? 0,
      totalFees: totalsRow?.total_fees ?? 0,
      lastSyncAt: toISO(totalsRow?.last_synced_at ?? null),
      ordersByPlatform,
      ordersByChannel,
      recentOrders,
    }
  } finally {
    db.close()
  }
}

export interface MarketplaceTrendFilters extends MarketplaceSummaryFilters {
  groupBy?: 'day' | 'week' | 'month'
}

export function getMarketplaceTrends(filters: MarketplaceTrendFilters = {}): MarketplaceTrendPoint[] {
  const db = getDb()
  try {
    const conditions: string[] = []
    const params: any[] = []

    const fromTimestamp = toUnixTimestamp(filters.from ?? null)
    if (fromTimestamp !== undefined) {
      conditions.push('purchase_date >= ?')
      params.push(fromTimestamp)
    }
    const toTimestamp = toUnixTimestamp(filters.to ?? null)
    if (toTimestamp !== undefined) {
      conditions.push('purchase_date <= ?')
      params.push(toTimestamp)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const grouping = filters.groupBy ?? 'day'

    let dateExpression = "strftime('%Y-%m-%d', purchase_date / 1000, 'unixepoch')"
    if (grouping === 'week') {
      dateExpression = "strftime('%Y-W%W', purchase_date / 1000, 'unixepoch')"
    } else if (grouping === 'month') {
      dateExpression = "strftime('%Y-%m', purchase_date / 1000, 'unixepoch')"
    }

    const rows = db
      .prepare(
        `
        SELECT 
          ${dateExpression} as period,
          COUNT(*) as order_count,
          SUM(total) as revenue,
          SUM(marketplace_fees) as fees
        FROM marketplace_orders
        ${whereClause}
        GROUP BY period
        ORDER BY period ASC
      `
      )
      .all(...params)

    return rows.map((row: any) => ({
      period: row.period,
      orderCount: row.order_count ?? 0,
      revenue: row.revenue ?? 0,
      fees: row.fees ?? 0,
    }))
  } finally {
    db.close()
  }
}

// -----------------------------------------------------------------------------
// Convenience
// -----------------------------------------------------------------------------

export function summarizeMarketplaceSync(runs: MarketplaceSyncRun[]): MarketplaceSyncResult {
  const totals = runs.reduce(
    (acc, run) => {
      acc.imported += run.importedCount
      acc.updated += run.updatedCount
      acc.skipped += run.skippedCount
      acc.errors += run.errorCount
      return acc
    },
    { imported: 0, updated: 0, skipped: 0, errors: 0 }
  )

  const success = runs.every((run) => run.status !== 'error')

  return {
    success,
    runs,
    totals,
    message: success ? 'Marketplace sync completed successfully.' : 'Marketplace sync completed with errors.',
  }
}


