/**
 * Marketplace Channel & Order Types
 */

export type MarketplacePlatform = 'amazon' | 'ebay' | 'walmart'

export type MarketplaceChannelStatus = 'active' | 'inactive' | 'paused' | 'error'

export type MarketplaceSyncStatus = 'idle' | 'running' | 'success' | 'error'

export type MarketplaceOrderStatus =
  | 'pending'
  | 'acknowledged'
  | 'processing'
  | 'shipped'
  | 'cancelled'
  | 'closed'

export type MarketplaceFinancialStatus = 'pending' | 'authorized' | 'paid' | 'refunded' | 'voided'

export type MarketplaceFulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled'

export interface MarketplaceCredentials {
  integration?: 'sellbrite' | 'direct' | 'custom'
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  sellerId?: string
  marketplaceId?: string
  accountId?: string
  warehouseId?: string
  [key: string]: unknown
}

export interface MarketplaceChannel {
  id: string
  name: string
  slug: string
  platform: MarketplacePlatform
  status: MarketplaceChannelStatus
  syncEnabled: boolean
  syncFrequencyMinutes: number | null
  lastSyncedAt: string | null
  lastSuccessfulSyncAt: string | null
  lastSyncStatus: MarketplaceSyncStatus | null
  lastSyncMessage: string | null
  credentials: MarketplaceCredentials | null
  settings: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface MarketplaceAddress {
  name?: string | null
  company?: string | null
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
}

export interface MarketplaceOrderItem {
  id: string
  orderId: string
  sku: string
  title: string
  quantity: number
  unitPrice: number
  totalPrice: number
  marketplaceFee: number
  data: Record<string, unknown> | null
}

export interface MarketplaceOrder {
  id: string
  channelId: string
  channelName: string
  platform: MarketplacePlatform
  externalId: string
  externalNumber: string | null
  status: MarketplaceOrderStatus
  financialStatus: MarketplaceFinancialStatus
  fulfillmentStatus: MarketplaceFulfillmentStatus
  purchaseDate: string
  importedAt: string
  updatedAt: string
  acknowledgedAt: string | null
  customerName: string | null
  customerEmail: string | null
  currency: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  marketplaceFees: number
  promocodes: string[] | null
  shippingAddress: MarketplaceAddress | null
  data: Record<string, unknown> | null
  items: MarketplaceOrderItem[]
}

export interface MarketplaceOrderFilters {
  channelId?: string
  platform?: MarketplacePlatform
  status?: MarketplaceOrderStatus | 'any'
  from?: string
  to?: string
  search?: string
  limit?: number
  offset?: number
}

export interface MarketplaceOrderListResult {
  orders: MarketplaceOrder[]
  total: number
  page: number
  pageSize: number
}

export interface MarketplaceSyncRun {
  id: string
  channelId: string | null
  channelName: string | null
  platform: MarketplacePlatform | null
  status: MarketplaceSyncStatus
  source: 'manual' | 'scheduled' | 'webhook'
  startedAt: string
  completedAt: string | null
  importedCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  message: string | null
  metadata: Record<string, unknown> | null
}

export interface MarketplaceSyncSummary {
  runs: MarketplaceSyncRun[]
  latestRun: MarketplaceSyncRun | null
}

export interface MarketplaceSummaryMetrics {
  totalOrders: number
  totalRevenue: number
  totalFees: number
  lastSyncAt: string | null
  ordersByPlatform: Array<{
    platform: MarketplacePlatform
    platformLabel: string
    orderCount: number
    revenue: number
    fees: number
  }>
  ordersByChannel: Array<{
    channelId: string
    name: string
    orderCount: number
    revenue: number
    fees: number
    lastSyncedAt: string | null
  }>
  recentOrders: MarketplaceOrder[]
}

export interface MarketplaceTrendPoint {
  period: string
  orderCount: number
  revenue: number
  fees: number
}

export interface MarketplaceTaxState {
  id: number
  channelId: string
  platform: MarketplacePlatform
  stateCode: string
  addedAt: string
}

export interface MarketplaceOrderInputItem {
  sku: string
  title: string
  quantity: number
  unitPrice: number
  totalPrice: number
  marketplaceFee?: number
  data?: Record<string, unknown> | null
}

export interface MarketplaceOrderInput {
  externalId: string
  externalNumber?: string | null
  status: MarketplaceOrderStatus
  financialStatus: MarketplaceFinancialStatus
  fulfillmentStatus: MarketplaceFulfillmentStatus
  purchaseDate: string
  acknowledgedAt?: string | null
  customerName?: string | null
  customerEmail?: string | null
  currency?: string
  subtotal?: number
  shipping?: number
  tax?: number
  total: number
  marketplaceFees?: number
  promocodes?: string[] | null
  shippingAddress?: MarketplaceAddress | null
  data?: Record<string, unknown> | null
  items: MarketplaceOrderInputItem[]
}

export interface MarketplaceSyncOptions {
  channelId?: string
  platform?: MarketplacePlatform
  since?: string
  until?: string
  limit?: number
  source?: 'manual' | 'scheduled' | 'webhook'
  acknowledgeAfterImport?: boolean
}

export interface MarketplaceSyncResult {
  success: boolean
  runs: MarketplaceSyncRun[]
  totals: {
    imported: number
    updated: number
    skipped: number
    errors: number
  }
  message?: string
}


