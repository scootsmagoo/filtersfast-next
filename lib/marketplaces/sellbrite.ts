/**
 * Sellbrite Marketplace Provider Helpers
 */

import {
  MarketplaceChannel,
  MarketplaceOrderInput,
  MarketplaceOrderStatus,
  MarketplaceFinancialStatus,
  MarketplaceFulfillmentStatus,
  MarketplaceSyncOptions,
  MarketplaceOrderInputItem,
  MarketplaceAddress,
} from '@/lib/types/marketplace'
import { logger } from '@/lib/logger'

const SELLBRITE_BASE_URL = process.env.SELLBRITE_API_BASE_URL ?? 'https://api.sellbrite.com'
const DEFAULT_PAGE_LIMIT = 50

interface SellbriteOrderItem {
  sku?: string
  sku_code?: string
  product_name?: string
  title?: string
  quantity?: number
  unit_price?: number
  price?: number
  total?: number
  channel_fee?: number
  data?: Record<string, unknown>
  [key: string]: any
}

interface SellbriteOrder {
  order_id?: string
  id?: string
  identifier?: string
  external_id?: string
  order_number?: string
  order_status?: string
  status?: string
  financial_status?: string
  payment_status?: string
  fulfillment_status?: string
  shipping_status?: string
  order_date?: string
  placed_at?: string
  acknowledged_at?: string | null
  customer_email?: string
  email?: string
  currency?: string
  subtotal?: number
  shipping?: number
  tax?: number
  total?: number
  marketplace_fee?: number
  totals?: {
    subtotal?: number
    shipping?: number
    tax?: number
    total?: number
    channel_fees?: number
  }
  discount_codes?: Array<{ code?: string } | string>
  shipping_address?: Record<string, any>
  billing_address?: Record<string, any>
  items?: SellbriteOrderItem[]
  [key: string]: any
}

interface SellbriteListResponse {
  orders: SellbriteOrder[]
  warnings?: string[]
  meta?: Record<string, unknown>
}

function resolveSellbriteCredentials(channel: MarketplaceChannel) {
  const creds = channel.credentials ?? {}
  const apiKey =
    (typeof creds.apiKey === 'string' && creds.apiKey.length > 0 ? creds.apiKey : null) ??
    process.env.SELLBRITE_API_KEY ??
    null
  const apiSecret =
    (typeof creds.apiSecret === 'string' && creds.apiSecret.length > 0 ? creds.apiSecret : null) ??
    process.env.SELLBRITE_API_SECRET ??
    null

  if (!apiKey || !apiSecret) {
    throw new Error(
      `Sellbrite credentials are not configured for channel "${channel.name}". Please provide apiKey and apiSecret in channel settings or SELLBRITE_API_KEY/SELLBRITE_API_SECRET environment variables.`
    )
  }

  return { apiKey, apiSecret }
}

async function sellbriteRequest<T>(
  channel: MarketplaceChannel,
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const { apiKey, apiSecret } = resolveSellbriteCredentials(channel)

  const url = new URL(path, SELLBRITE_BASE_URL)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }

  const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  logger.debug(`Sellbrite request: ${url.toString()}`, {
    channel: channel.slug,
    platform: channel.platform,
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authHeader}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sellbrite API error (${response.status}): ${text}`)
  }

  return (await response.json()) as T
}

function mapStatus(value?: string | null): MarketplaceOrderStatus {
  const normalized = (value ?? '').toLowerCase()
  if (!normalized) return 'pending'

  if (['pending', 'open', 'awaiting_shipment', 'awaiting', 'unacknowledged'].includes(normalized)) {
    return 'pending'
  }
  if (['acknowledged', 'accepted'].includes(normalized)) {
    return 'acknowledged'
  }
  if (['processing', 'inprocess', 'in_progress'].includes(normalized)) {
    return 'processing'
  }
  if (['shipped', 'fulfilled', 'complete', 'completed'].includes(normalized)) {
    return 'shipped'
  }
  if (['cancelled', 'canceled', 'void'].includes(normalized)) {
    return 'cancelled'
  }
  if (['closed', 'archived'].includes(normalized)) {
    return 'closed'
  }
  return 'pending'
}

function mapFinancialStatus(value?: string | null): MarketplaceFinancialStatus {
  const normalized = (value ?? '').toLowerCase()
  if (!normalized) return 'pending'

  if (['paid', 'captured', 'settled'].includes(normalized)) return 'paid'
  if (['pending', 'awaiting_payment'].includes(normalized)) return 'pending'
  if (['authorized', 'pending_capture'].includes(normalized)) return 'authorized'
  if (['refunded', 'partially_refunded'].includes(normalized)) return 'refunded'
  if (['void', 'voided', 'canceled'].includes(normalized)) return 'voided'
  return 'pending'
}

function mapFulfillmentStatus(value?: string | null): MarketplaceFulfillmentStatus {
  const normalized = (value ?? '').toLowerCase()
  if (!normalized) return 'unfulfilled'

  if (['fulfilled', 'shipped', 'complete', 'completed'].includes(normalized)) return 'fulfilled'
  if (['partial', 'partially_fulfilled'].includes(normalized)) return 'partial'
  return 'unfulfilled'
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return fallback
}

function mapSellbriteAddress(address?: Record<string, any>): MarketplaceAddress | null {
  if (!address) return null

  return {
    name: (address.name ?? address.full_name ?? null) as string | null,
    company: (address.company ?? null) as string | null,
    address1: (address.address1 ?? address.address ?? null) as string | null,
    address2: (address.address2 ?? null) as string | null,
    city: (address.city ?? null) as string | null,
    state: (address.state ?? address.region ?? address.province ?? null) as string | null,
    postalCode: (address.postal_code ?? address.zip ?? null) as string | null,
    country: (address.country ?? address.country_code ?? null) as string | null,
    phone: (address.phone ?? null) as string | null,
  }
}

function mapSellbriteItem(orderId: string, item: SellbriteOrderItem, index: number): MarketplaceOrderInputItem {
  const quantity = toNumber(item.quantity, 1)
  const unitPrice = toNumber(item.unit_price ?? item.price, 0)
  const totalPrice = toNumber(item.total, unitPrice * quantity)

  return {
    sku: item.sku ?? item.sku_code ?? `item-${index}`,
    title: item.product_name ?? item.title ?? `Item ${index + 1}`,
    quantity,
    unitPrice,
    totalPrice,
    marketplaceFee: toNumber(item.channel_fee, 0),
    data: item,
  }
}

export function transformSellbriteOrder(channel: MarketplaceChannel, order: SellbriteOrder): MarketplaceOrderInput {
  const items = Array.isArray(order.items) ? order.items : []
  const mappedItems = items.map((item, index) => mapSellbriteItem(channel.id, item, index))

  const shippingAddress = mapSellbriteAddress(
    order.shipping_address ?? order.consignee ?? order.ship_to ?? undefined
  )

  const purchaseDate =
    order.order_date ??
    order.placed_at ??
    (order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString())

  const promoCodes =
    Array.isArray(order.discount_codes) && order.discount_codes.length > 0
      ? order.discount_codes
          .map((entry) =>
            typeof entry === 'string'
              ? entry
              : typeof entry === 'object' && entry
                ? (entry.code as string | undefined)
                : undefined
          )
          .filter((code): code is string => Boolean(code && code.length))
      : null

  const totals = order.totals ?? {}

  return {
    externalId:
      order.order_id ??
      order.id ??
      order.identifier ??
      order.external_id ??
      order.order_number ??
      `unknown-${Date.now()}`,
    externalNumber: order.order_number ?? order.reference ?? null,
    status: mapStatus(order.order_status ?? order.status),
    financialStatus: mapFinancialStatus(order.financial_status ?? order.payment_status),
    fulfillmentStatus: mapFulfillmentStatus(order.fulfillment_status ?? order.shipping_status),
    purchaseDate,
    acknowledgedAt: order.acknowledged_at ?? null,
    customerName:
      (order.shipping_address?.name ??
        order.billing_address?.name ??
        order.customer_name ??
        null) ?? null,
    customerEmail: order.customer_email ?? order.email ?? null,
    currency: order.currency ?? order.totals?.currency ?? 'USD',
    subtotal: toNumber(order.subtotal ?? totals.subtotal, 0),
    shipping: toNumber(order.shipping ?? totals.shipping, 0),
    tax: toNumber(order.tax ?? totals.tax, 0),
    total: toNumber(order.total ?? totals.total, mappedItems.reduce((sum, item) => sum + item.totalPrice, 0)),
    marketplaceFees: toNumber(order.marketplace_fee ?? totals.channel_fees, 0),
    promocodes: promoCodes,
    shippingAddress,
    data: order,
    items: mappedItems,
  }
}

export async function listSellbriteOrders(
  channel: MarketplaceChannel,
  options: MarketplaceSyncOptions = {}
): Promise<SellbriteListResponse> {
  const limit = options.limit ?? DEFAULT_PAGE_LIMIT

  const params: Record<string, string | number | undefined> = {
    per_page: limit,
  }

  if (options.since) {
    params['created_at_min'] = options.since
  }
  if (options.until) {
    params['created_at_max'] = options.until
  }

  if (channel.settings && typeof channel.settings.channel_identifier === 'string') {
    params['channel_identifier'] = channel.settings.channel_identifier as string
  }

  const response = await sellbriteRequest<any>(channel, '/v1/orders', params)
  const orders = Array.isArray(response)
    ? response
    : Array.isArray(response?.orders)
      ? response.orders
      : []

  const warnings: string[] = Array.isArray(response?.warnings)
    ? response.warnings.filter((msg: unknown) => typeof msg === 'string')
    : []

  return {
    orders,
    warnings,
    meta: typeof response?.meta === 'object' ? (response.meta as Record<string, unknown>) : undefined,
  }
}


