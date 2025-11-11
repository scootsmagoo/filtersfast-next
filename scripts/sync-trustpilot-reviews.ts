/**
 * Sync Trustpilot Reviews Script
 *
 * Usage:
 *   npm run sync:reviews
 *   npm run sync:reviews -- --skus=SKU1,SKU2 --pages=2 --perPage=100
 */

import { syncTrustpilotReviews } from '../lib/services/trustpilot-sync'

function parseArgs() {
  const args = process.argv.slice(2)
  const options: Record<string, string> = {}

  for (const arg of args) {
    const [key, value] = arg.split('=')
    if (key && value) {
      options[key.replace(/^--/, '')] = value
    }
  }

  return options
}

async function main() {
  if (!process.env.TRUSTPILOT_API_KEY) {
    console.error('❌ TRUSTPILOT_API_KEY is not configured. Aborting sync.')
    process.exit(1)
  }

  const args = parseArgs()
  const pages = args.pages ? parseInt(args.pages, 10) : undefined
  const perPage = args.perPage ? parseInt(args.perPage, 10) : undefined
  const includeImported = args.includeImported ? args.includeImported !== 'false' : true
  const skus = args.skus ? args.skus.split(',').map(s => s.trim()).filter(Boolean) : undefined

  console.log('🔄 Syncing Trustpilot reviews...')
  console.log(`⏰ ${new Date().toISOString()}`)
  if (skus?.length) {
    console.log(`🧾 Product SKUs: ${skus.join(', ')}`)
  }

  try {
    const result = await syncTrustpilotReviews({
      pages,
      perPage,
      productSkus: skus,
      includeImported,
      log: true,
    })

    console.log('✅ Sync complete!')
    console.log(`📬 Reviews processed: ${result.processed}`)
    if (result.errors.length > 0) {
      console.log('⚠️  Errors encountered:')
      for (const error of result.errors) {
        console.log(`  - ${error}`)
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error syncing reviews:', error)
    process.exit(1)
  }
}

main()

