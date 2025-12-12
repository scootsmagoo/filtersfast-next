/**
 * Initialize Marketplace Channels
 *
 * Usage:
 *   tsx scripts/init-marketplaces.ts [--with-sample-orders]
 */

import { createMarketplaceChannel, getMarketplaceChannel, updateMarketplaceChannel, recordMarketplaceOrder, addMarketplaceTaxState } from '@/lib/db/marketplaces'
import type { MarketplaceOrderInput } from '@/lib/types/marketplace'

interface SeedChannel {
  id: string
  name: string
  slug: string
  platform: 'amazon' | 'ebay' | 'walmart'
  status: 'active' | 'inactive'
  syncEnabled: boolean
  syncFrequencyMinutes: number
  taxStates?: string[]
}

const CHANNELS: SeedChannel[] = [
  {
    id: 'mp_amazon',
    name: 'Amazon Marketplace',
    slug: 'amazon',
    platform: 'amazon',
    status: 'active',
    syncEnabled: true,
    syncFrequencyMinutes: 30,
    taxStates: ['AL', 'CA', 'FL', 'GA', 'NC', 'NY', 'TX'],
  },
  {
    id: 'mp_ebay',
    name: 'eBay Marketplace',
    slug: 'ebay',
    platform: 'ebay',
    status: 'active',
    syncEnabled: true,
    syncFrequencyMinutes: 60,
    taxStates: ['CA', 'FL', 'GA', 'NC'],
  },
  {
    id: 'mp_walmart',
    name: 'Walmart Marketplace',
    slug: 'walmart',
    platform: 'walmart',
    status: 'active',
    syncEnabled: true,
    syncFrequencyMinutes: 45,
    taxStates: ['CA', 'FL', 'GA', 'NC', 'SC', 'VA'],
  },
]

function buildSampleOrder(channelId: string, idx: number): MarketplaceOrderInput {
  const baseDate = Date.now() - idx * 86_400_000
  return {
    externalId: `sample-${channelId}-${idx}`,
    externalNumber: `S-${idx + 1000}`,
    status: 'processing',
    financialStatus: 'paid',
    fulfillmentStatus: idx % 2 === 0 ? 'fulfilled' : 'unfulfilled',
    purchaseDate: new Date(baseDate).toISOString(),
    customerName: `Sample Customer ${idx + 1}`,
    customerEmail: `sample${idx + 1}@example.com`,
    currency: 'USD',
    subtotal: 120 + idx * 10,
    shipping: 12.5,
    tax: 8.75,
    total: 120 + idx * 10 + 12.5 + 8.75,
    marketplaceFees: 15 + idx * 2,
    shippingAddress: {
      name: `Sample Customer ${idx + 1}`,
      address1: '123 Sample Street',
      city: 'Charlotte',
      state: 'NC',
      postalCode: '28202',
      country: 'US',
    },
    items: [
      {
        sku: `SKU-${idx + 1}`,
        title: `Sample Product ${idx + 1}`,
        quantity: 1,
        unitPrice: 120 + idx * 10,
        totalPrice: 120 + idx * 10,
        marketplaceFee: 15 + idx * 2,
        data: {
          sample: true,
        },
      },
    ],
    data: {
      source: 'seed-script',
    },
  }
}

async function main() {
  const withSampleOrders = process.argv.includes('--with-sample-orders')

  console.log('🔧 Initializing marketplace channels...')

  for (const channel of CHANNELS) {
    const existing = getMarketplaceChannel(channel.id)
    if (!existing) {
      createMarketplaceChannel({
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        platform: channel.platform,
        status: channel.status,
        syncEnabled: channel.syncEnabled,
        syncFrequencyMinutes: channel.syncFrequencyMinutes,
        credentials: {
          integration: 'sellbrite',
        },
        settings: {},
      })
      console.log(`✅ Created channel: ${channel.name}`)
    } else {
      updateMarketplaceChannel(channel.id, {
        name: channel.name,
        status: channel.status,
        syncEnabled: channel.syncEnabled,
        syncFrequencyMinutes: channel.syncFrequencyMinutes,
      })
      console.log(`ℹ️  Updated existing channel: ${channel.name}`)
    }

    if (channel.taxStates && channel.taxStates.length) {
      channel.taxStates.forEach((state) => {
        try {
          addMarketplaceTaxState(channel.id, state)
        } catch (error) {
          console.warn(`Warning: unable to add tax state ${state} for ${channel.name}`, error)
        }
      })
    }

    if (withSampleOrders) {
      console.log(`📦 Seeding sample orders for ${channel.name}...`)
      for (let i = 0; i < 3; i++) {
        recordMarketplaceOrder(channel.id, buildSampleOrder(channel.id, i))
      }
    }
  }

  console.log('🎉 Marketplace initialization complete.')
}

main().catch((error) => {
  console.error('Marketplace initialization failed:', error)
  process.exit(1)
})


