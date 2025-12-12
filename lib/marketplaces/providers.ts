/**
 * Marketplace Provider Dispatcher
 */

import { MarketplaceChannel, MarketplaceOrderInput, MarketplaceSyncOptions } from '@/lib/types/marketplace'
import { listSellbriteOrders, transformSellbriteOrder } from './sellbrite'

export interface ProviderFetchResult {
  orders: MarketplaceOrderInput[]
  raw: any[]
  warnings: string[]
}

/**
 * Fetch marketplace orders from the appropriate provider based on channel platform
 */
export async function fetchMarketplaceOrdersFromProvider(
  channel: MarketplaceChannel,
  options: MarketplaceSyncOptions = {}
): Promise<ProviderFetchResult> {
  switch (channel.platform) {
    case 'amazon':
    case 'ebay':
    case 'walmart': {
      const sellbriteResponse = await listSellbriteOrders(channel, options)
      const orders = sellbriteResponse.orders.map((order) => transformSellbriteOrder(channel, order))
      return {
        orders,
        raw: sellbriteResponse.orders,
        warnings: sellbriteResponse.warnings ?? [],
      }
    }
    default:
      throw new Error(`No provider configured for platform: ${channel.platform}`)
  }
}


