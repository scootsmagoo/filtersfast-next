import Database from 'better-sqlite3'
import crypto from 'crypto'
import { join } from 'path'

import { getOrder } from '@/lib/db/orders'
import { hasActiveSubscriptionForProduct } from '@/lib/db/subscriptions'
import { logger } from '@/lib/logger'
import { constantTimeCompare } from '@/lib/security'
import type { Order } from '@/lib/types/order'

const filtersFastDbPath = join(process.cwd(), 'filtersfast.db')
const authDbPath = process.env.DATABASE_URL || 'auth.db'

const LEGACY_TOKEN_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000 // 1 year
const DEFAULT_FREQUENCY = 6
let activationTableEnsured = false

type ActivationErrorCode =
  | 'invalid-token'
  | 'signature-mismatch'
  | 'token-consumed'
  | 'expired'
  | 'order-not-found'
  | 'no-items'

export class ActivationError extends Error {
  constructor(
    message: string,
    public readonly code: ActivationErrorCode,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ActivationError'
  }
}

export type ActivationSecurityLevel = 'token' | 'signed' | 'legacy'

export interface ActivationTokenRecord {
  token: string
  customerId: string
  orderId: string
  walletId?: string | null
  paidAt?: number | null
  expiresAt: number
  createdAt: number
  consumedAt?: number | null
  consumedBy?: string | null
  legacyPayload?: string | null
  metadata?: string | null
}

export interface ActivationItem {
  orderItemId: string
  productId: string
  productName: string
  productSku?: string | null
  variantName?: string | null
  image?: string | null
  quantity: number
  unitPrice: number
  subscriptionDiscount: number
  defaultFrequency: number
}

interface ActivationPayload {
  customerId?: string | null
  orderId: string
  walletId?: string | null
  paidAt?: Date | null
  securityLevel: ActivationSecurityLevel
  signature?: string | null
}

export interface ActivationContext {
  accessKey: string
  order: Order
  items: ActivationItem[]
  securityLevel: ActivationSecurityLevel
  paidAt?: Date | null
  walletId?: string | null
  legacyCustomerId?: string | null
  tokenRecord?: ActivationTokenRecord
  customerName: string
  customerEmail: string
  userId: string | null
  warnings: string[]
}

export function getActivationSecret(): string | null {
  return (
    process.env.SUBSCRIPTION_ACTIVATION_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    null
  )
}

function getDb(path: string): Database.Database {
  const db = new Database(path)
  db.pragma('foreign_keys = ON')
  return db
}

function ensureActivationTable(): void {
  if (activationTableEnsured) {
    return
  }

  const db = getDb(filtersFastDbPath)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_activation_tokens (
        token TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        wallet_id TEXT,
        paid_at INTEGER,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        consumed_at INTEGER,
        consumed_by TEXT,
        legacy_payload TEXT,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_activation_tokens_order
        ON subscription_activation_tokens(order_id);

      CREATE INDEX IF NOT EXISTS idx_activation_tokens_customer
        ON subscription_activation_tokens(customer_id);
    `)
  } finally {
    db.close()
  }

  activationTableEnsured = true
}

function getTokenRecord(accessKey: string): ActivationTokenRecord | null {
  ensureActivationTable()

  const db = getDb(filtersFastDbPath)
  try {
    const row = db
      .prepare(`
        SELECT
          token,
          customer_id as customerId,
          order_id as orderId,
          wallet_id as walletId,
          paid_at as paidAt,
          expires_at as expiresAt,
          created_at as createdAt,
          consumed_at as consumedAt,
          consumed_by as consumedBy,
          legacy_payload as legacyPayload,
          metadata
        FROM subscription_activation_tokens
        WHERE token = ?
      `)
      .get(accessKey) as ActivationTokenRecord | undefined

    return row || null
  } finally {
    db.close()
  }
}

export function markActivationTokenConsumed(
  token: string,
  metadata?: Record<string, unknown>,
  consumedBy?: string,
): void {
  ensureActivationTable()

  const db = getDb(filtersFastDbPath)
  try {
    db.prepare(`
      UPDATE subscription_activation_tokens
      SET consumed_at = ?, consumed_by = ?, metadata = ?
      WHERE token = ?
    `).run(
      Date.now(),
      consumedBy || null,
      metadata ? JSON.stringify(metadata) : null,
      token,
    )
  } finally {
    db.close()
  }
}

function decodeAccessKey(accessKey: string): string {
  const sanitized = accessKey.replace(/\s+/g, '')
  const base64 = sanitized.replace(/-/g, '+').replace(/_/g, '/')
  const paddingNeeded = base64.length % 4
  const padded =
    paddingNeeded === 0 ? base64 : base64 + '='.repeat(4 - paddingNeeded)

  try {
    return Buffer.from(padded, 'base64').toString('utf8')
  } catch (error) {
    logger.warn('Failed to decode activation access key', {
      error,
    })
    throw new ActivationError(
      'We could not validate this activation link.',
      'invalid-token',
      400,
    )
  }
}

function parseLegacyPayload(decoded: string): ActivationPayload {
  if (!decoded) {
    throw new ActivationError(
      'Activation link payload was empty.',
      'invalid-token',
      400,
    )
  }

  if (decoded.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(decoded)
      return parseJsonPayload(parsed)
    } catch (error) {
      logger.warn('Failed to parse JSON activation payload', { error })
      throw new ActivationError(
        'We could not read this activation link.',
        'invalid-token',
        400,
      )
    }
  }

  const parts = decoded.split('|')
  if (parts.length < 4) {
    throw new ActivationError(
      'Activation link was missing required information.',
      'invalid-token',
      400,
    )
  }

  const [customerIdRaw, orderIdRaw, walletIdRaw, paidAtRaw, signature] = parts
  const customerId = normalizeStringValue(customerIdRaw)
  const orderId = normalizeStringValue(orderIdRaw)
  const walletId = normalizeStringValue(walletIdRaw)
  const paidAt = parsePaidDate(paidAtRaw)
  const baseString =
    `${customerIdRaw}|${orderIdRaw}|${walletIdRaw}|${paidAtRaw}`.trim()
  const secret = getActivationSecret()
  let securityLevel: ActivationSecurityLevel = 'legacy'

  if (signature) {
    if (!secret) {
      logger.warn(
        'Activation payload included signature but server secret is missing.',
      )
    } else {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(baseString)
        .digest('hex')

      if (!constantTimeCompare(signature, expected)) {
        logger.security('Activation signature mismatch detected', {
          customerId,
          orderId,
        })
        throw new ActivationError(
          'Activation link signature did not match.',
          'signature-mismatch',
          401,
        )
      }

      securityLevel = 'signed'
    }
  }

  if (!orderId) {
    throw new ActivationError(
      'Activation link did not include an order reference.',
      'invalid-token',
      400,
    )
  }

  return {
    customerId,
    orderId,
    walletId,
    paidAt,
    securityLevel,
    signature: signature || null,
  }
}

function parseJsonPayload(payload: Record<string, unknown>): ActivationPayload {
  const customerId = normalizeStringValue(payload.customerId as string)
  const orderId = normalizeStringValue(payload.orderId as string)
  const walletId = normalizeStringValue(payload.walletId as string)
  const paidAt = parsePaidDate(payload.paidAt as string | number | null)
  const signature = normalizeStringValue(payload.signature as string)
  const securityLevel: ActivationSecurityLevel = signature ? 'signed' : 'legacy'

  if (!orderId) {
    throw new ActivationError(
      'Activation link did not include an order reference.',
      'invalid-token',
      400,
    )
  }

  if (signature) {
    const secret = getActivationSecret()
    if (!secret) {
      logger.warn(
        'JSON activation payload included signature but server secret is missing.',
      )
    } else {
      const base = `${customerId ?? ''}|${orderId}|${walletId ?? ''}|${
        paidAt ? paidAt.getTime() : ''
      }`
      const expected = crypto
        .createHmac('sha256', secret)
        .update(base)
        .digest('hex')

      if (!constantTimeCompare(signature, expected)) {
        logger.security('JSON activation signature mismatch detected', {
          customerId,
          orderId,
        })
        throw new ActivationError(
          'Activation link signature did not match.',
          'signature-mismatch',
          401,
        )
      }
    }
  }

  return {
    customerId,
    orderId,
    walletId,
    paidAt,
    securityLevel,
    signature,
  }
}

function normalizeStringValue(value?: string | null): string | null {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  if (!trimmed || trimmed.toLowerCase() === 'null') return null
  return trimmed
}

function parsePaidDate(
  input?: string | number | null,
): Date | null {
  if (input === undefined || input === null) {
    return null
  }

  if (typeof input === 'number' && Number.isFinite(input)) {
    return new Date(input)
  }

  const value = String(input).trim()
  if (!value) {
    return null
  }

  if (/^\d{13}$/.test(value)) {
    return new Date(Number(value))
  }

  if (/^\d{10}$/.test(value)) {
    return new Date(Number(value) * 1000)
  }

  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4))
    const month = Number(value.slice(4, 6)) - 1
    const day = Number(value.slice(6, 8))
    return new Date(year, month, day)
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

function findAuthUserIdByEmail(email: string): string | null {
  if (!email) return null

  const db = getDb(authDbPath)
  try {
    const row = db
      .prepare(
        'SELECT id FROM user WHERE LOWER(email) = LOWER(?) LIMIT 1',
      )
      .get(email) as { id: string } | undefined

    return row?.id ?? null
  } catch (error) {
    logger.warn('Failed to lookup auth user by email', { email, error })
    return null
  } finally {
    db.close()
  }
}

function resolveUserId(order: Order): string | null {
  if (order.user_id) {
    return order.user_id
  }

  return findAuthUserIdByEmail(order.customer_email)
}

function fetchEligibleItems(orderId: string): ActivationItem[] {
  const db = getDb(filtersFastDbPath)
  try {
    const rows = db
      .prepare(`
        SELECT
          oi.id AS orderItemId,
          oi.product_id AS productId,
          oi.product_name AS productName,
          oi.product_sku AS productSku,
          oi.product_image AS orderProductImage,
          oi.variant_name AS variantName,
          oi.quantity,
          oi.unit_price AS unitPrice,
          p.subscription_eligible AS subscriptionEligible,
          p.subscription_discount AS subscriptionDiscount,
          p.primary_image AS primaryImage,
          p.images AS productImages
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.created_at ASC
      `)
      .all(orderId) as Array<{
        orderItemId: string
        productId: string | null
        productName: string
        productSku: string | null
        orderProductImage: string | null
        variantName: string | null
        quantity: number
        unitPrice: number
        subscriptionEligible: number | null
        subscriptionDiscount: number | null
        primaryImage: string | null
        productImages: string | null
      }>

    return rows
      .filter(row => Boolean(row.subscriptionEligible))
      .map(row => {
        const images = safeJsonParse(row.productImages)
        const fallbackImage = Array.isArray(images)
          ? extractFirstImage(images)
          : null
        const image =
          row.orderProductImage ||
          row.primaryImage ||
          fallbackImage ||
          null

        return {
          orderItemId: String(row.orderItemId),
          productId: row.productId ?? '',
          productName: row.productName,
          productSku: row.productSku,
          variantName: row.variantName,
          image,
          quantity: Number(row.quantity) || 1,
          unitPrice: Number(row.unitPrice) || 0,
          subscriptionDiscount:
            row.subscriptionDiscount !== null
              ? Number(row.subscriptionDiscount)
              : 5,
          defaultFrequency: DEFAULT_FREQUENCY,
        }
      })
      .filter(item => Boolean(item.productId))
  } finally {
    db.close()
  }
}

function safeJsonParse(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractFirstImage(images: unknown[]): string | null {
  for (const image of images) {
    if (typeof image === 'string') {
      return image
    }

    if (
      image &&
      typeof image === 'object' &&
      'url' in image &&
      typeof (image as { url?: unknown }).url === 'string'
    ) {
      return (image as { url: string }).url
    }
  }

  return null
}

export async function getActivationContext(
  accessKey: string,
): Promise<ActivationContext> {
  const trimmedKey = accessKey?.trim()
  if (!trimmedKey) {
    throw new ActivationError(
      'Activation link is missing.',
      'invalid-token',
      400,
    )
  }

  if (trimmedKey.length > 2048) {
    throw new ActivationError(
      'Activation key is invalid or malformed.',
      'invalid-token',
      400,
    )
  }

  const warnings: string[] = []
  let tokenRecord = getTokenRecord(trimmedKey)
  let payload: ActivationPayload

  if (tokenRecord) {
    const now = Date.now()

    if (tokenRecord.consumedAt) {
      throw new ActivationError(
        'This activation link has already been used.',
        'token-consumed',
        409,
      )
    }

    if (now > tokenRecord.expiresAt) {
      throw new ActivationError(
        'This activation link has expired. Please request a new one.',
        'expired',
        410,
      )
    }

    payload = {
      customerId: tokenRecord.customerId,
      orderId: tokenRecord.orderId,
      walletId: tokenRecord.walletId ?? null,
      paidAt: tokenRecord.paidAt ? new Date(tokenRecord.paidAt) : null,
      securityLevel: 'token',
    }
  } else {
    const decoded = decodeAccessKey(trimmedKey)
    payload = parseLegacyPayload(decoded)

    if (payload.securityLevel === 'legacy') {
      warnings.push('legacy-token')
    }
  }

  const order = getOrder(payload.orderId)
  if (!order) {
    throw new ActivationError(
      'We could not find an order associated with this activation link.',
      'order-not-found',
      404,
    )
  }

  const paidAt =
    payload.paidAt ??
    (order.updated_at ? new Date(order.updated_at) : new Date(order.created_at))

  if (
    payload.securityLevel !== 'token' &&
    paidAt &&
    Date.now() - paidAt.getTime() > LEGACY_TOKEN_MAX_AGE_MS
  ) {
    throw new ActivationError(
      'This activation link has expired. Please contact support to request a fresh link.',
      'expired',
      410,
    )
  }

  const items = fetchEligibleItems(order.id)
  if (!items.length) {
    throw new ActivationError(
      'None of the items in this order are eligible for Home Filter Club subscriptions.',
      'no-items',
      409,
    )
  }

  const userId = resolveUserId(order)
  if (!userId) {
    warnings.push('missing-user')
  }

  return {
    accessKey: trimmedKey,
    order,
    items,
    securityLevel: payload.securityLevel,
    paidAt,
    walletId: payload.walletId ?? null,
    legacyCustomerId: payload.customerId ?? null,
    tokenRecord: tokenRecord ?? undefined,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    userId,
    warnings,
  }
}

export async function checkExistingSubscription(
  customerId: string,
  productId: string,
): Promise<boolean> {
  return hasActiveSubscriptionForProduct(customerId, productId)
}


