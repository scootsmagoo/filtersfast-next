/**
 * Marketplace Sync Orchestrator
 */

import { logger } from '@/lib/logger'
import {
  getMarketplaceChannels,
  getMarketplaceChannel,
  recordMarketplaceOrder,
  startMarketplaceSyncRun,
  appendMarketplaceSyncRunCounts,
  completeMarketplaceSyncRun,
  summarizeMarketplaceSync,
  updateMarketplaceChannel,
  getMarketplaceSyncHistory,
} from '@/lib/db/marketplaces'
import { fetchMarketplaceOrdersFromProvider } from './providers'
import { MarketplaceChannel, MarketplaceSyncOptions, MarketplaceSyncResult, MarketplaceSyncRun } from '@/lib/types/marketplace'

function filterChannelsForSync(channels: MarketplaceChannel[], options: MarketplaceSyncOptions): MarketplaceChannel[] {
  let relevant = channels

  if (options.channelId) {
    relevant = relevant.filter((channel) => channel.id === options.channelId)
  }

  if (options.platform) {
    relevant = relevant.filter((channel) => channel.platform === options.platform)
  }

  if (!options.channelId) {
    relevant = relevant.filter((channel) => channel.syncEnabled)
  }

  return relevant
}

async function syncChannel(
  channel: MarketplaceChannel,
  options: MarketplaceSyncOptions
): Promise<MarketplaceSyncRun> {
  const run = startMarketplaceSyncRun({ ...options, channelId: channel.id, source: options.source ?? 'manual' })
  let imported = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  try {
    logger.info(`Starting marketplace sync for ${channel.name} (${channel.platform})`)

    const providerResult = await fetchMarketplaceOrdersFromProvider(channel, options)

    for (const orderInput of providerResult.orders) {
      try {
        const result = recordMarketplaceOrder(channel.id, orderInput)
        if (result.created) {
          imported += 1
        } else if (result.updated) {
          updated += 1
        } else {
          skipped += 1
        }
      } catch (error) {
        errors += 1
        logger.error(
          `Failed to record marketplace order ${orderInput.externalId} for channel ${channel.name}`,
          { error }
        )
      }
    }

    if (providerResult.warnings.length > 0) {
      providerResult.warnings.forEach((warning) => {
        logger.warn(`Marketplace sync warning (${channel.slug}): ${warning}`)
      })
    }

    appendMarketplaceSyncRunCounts(run.id, {
      imported,
      updated,
      skipped,
      errors,
    })

    const completed = completeMarketplaceSyncRun(
      run.id,
      errors > 0 ? 'error' : 'success',
      { imported, updated, skipped, errors },
      errors > 0
        ? `Sync completed with ${errors} error(s).`
        : `Imported ${imported} order(s), updated ${updated}.`,
      {
        warnings: providerResult.warnings,
        orderCount: providerResult.orders.length,
      }
    )

    updateMarketplaceChannel(channel.id, {
      lastSyncedAt: new Date().toISOString(),
      lastSuccessfulSyncAt: errors === 0 ? new Date().toISOString() : channel.lastSuccessfulSyncAt,
      lastSyncStatus: errors > 0 ? 'error' : 'success',
      lastSyncMessage:
        errors > 0
          ? `Sync completed with ${errors} error(s).`
          : `Imported ${imported} order(s), updated ${updated}.`,
    })

    return completed ?? run
  } catch (error: any) {
    errors += 1
    logger.error(`Marketplace sync failed for ${channel.name}`, { error })

    const completed = completeMarketplaceSyncRun(
      run.id,
      'error',
      { imported, updated, skipped, errors },
      error.message ?? 'Marketplace sync failed.',
      {
        error: error instanceof Error ? error.message : String(error),
      }
    )

    updateMarketplaceChannel(channel.id, {
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'error',
      lastSyncMessage: error.message ?? 'Marketplace sync failed.',
    })

    return completed ?? run
  }
}

export async function syncMarketplaceOrders(options: MarketplaceSyncOptions = {}): Promise<MarketplaceSyncResult> {
  const allChannels = getMarketplaceChannels()
  const channels = filterChannelsForSync(allChannels, options)

  if (channels.length === 0) {
    if (options.channelId) {
      const singleChannel = getMarketplaceChannel(options.channelId)
      if (!singleChannel) {
        throw new Error(`Marketplace channel ${options.channelId} not found`)
      }
      if (!singleChannel.syncEnabled && !options.channelId) {
        throw new Error(`Marketplace channel ${singleChannel.name} is disabled for sync`)
      }
      if (options.platform && singleChannel.platform !== options.platform) {
        throw new Error(`Marketplace channel ${singleChannel.name} does not match requested platform`)
      }
    }

    return {
      success: true,
      runs: [],
      totals: {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      },
      message: 'No marketplace channels matched the sync criteria.',
    }
  }

  const runs: MarketplaceSyncRun[] = []

  for (const channel of channels) {
    const run = await syncChannel(channel, options)
    runs.push(run)
  }

  return summarizeMarketplaceSync(runs)
}

export function getRecentMarketplaceSyncs(limit = 10): MarketplaceSyncRun[] {
  return getMarketplaceSyncHistory(limit)
}


