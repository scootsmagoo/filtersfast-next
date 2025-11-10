/**
 * Manual Marketplace Sync
 *
 * Usage:
 *   tsx scripts/sync-marketplace-orders.ts [--channel=<id>] [--platform=amazon|ebay|walmart] [--since=ISO] [--until=ISO] [--limit=50]
 */

import { syncMarketplaceOrders } from '@/lib/marketplaces/sync'
import type { MarketplacePlatform, MarketplaceSyncOptions } from '@/lib/types/marketplace'

interface CliOptions extends MarketplaceSyncOptions {
  verbose?: boolean
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {}

  args.forEach((arg) => {
    if (arg.startsWith('--channel=')) {
      options.channelId = arg.split('=')[1]
    } else if (arg.startsWith('--platform=')) {
      options.platform = arg.split('=')[1] as MarketplacePlatform
    } else if (arg.startsWith('--since=')) {
      options.since = arg.split('=')[1]
    } else if (arg.startsWith('--until=')) {
      options.until = arg.split('=')[1]
    } else if (arg.startsWith('--limit=')) {
      options.limit = Number(arg.split('=')[1])
    } else if (arg === '--verbose') {
      options.verbose = true
    }
  })

  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  console.log('🔄 Starting marketplace sync with options:', {
    channelId: options.channelId ?? 'all',
    platform: options.platform ?? 'all',
    since: options.since ?? 'default',
    until: options.until ?? 'default',
    limit: options.limit ?? 'default',
  })

  const result = await syncMarketplaceOrders(options)

  console.log('✅ Marketplace sync result:', {
    success: result.success,
    imported: result.totals.imported,
    updated: result.totals.updated,
    skipped: result.totals.skipped,
    errors: result.totals.errors,
  })

  if (!result.success) {
    console.error('⚠️  Sync completed with errors.')
  }

  if (options.verbose) {
    result.runs.forEach((run) => {
      console.log('—', {
        channel: run.channelName ?? 'All',
        platform: run.platform ?? 'multi',
        status: run.status,
        imported: run.importedCount,
        updated: run.updatedCount,
        skipped: run.skippedCount,
        errors: run.errorCount,
        message: run.message,
      })
    })
  }
}

main().catch((error) => {
  console.error('Marketplace sync failed:', error)
  process.exit(1)
})


