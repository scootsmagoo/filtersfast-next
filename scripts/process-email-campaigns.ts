/**
 * Email Campaign Dispatcher Script
 *
 * Run on a schedule to process pending email campaigns.
 *
 * Example cron (every 5 minutes):
 * */5 * * * *  cd /app && npm run cron:email-campaigns
 */

import { processEmailCampaigns } from '../lib/email/email-campaign-dispatcher'

async function main() {
  const startedAt = new Date()
  console.log('📣 Processing email campaigns...')
  console.log(`⏰ Started at: ${startedAt.toISOString()}`)

  try {
    const result = await processEmailCampaigns({ log: true })

    console.log('✅ Campaign processing finished')
    console.log(`📬 Campaigns processed: ${result.processedCampaigns}`)
    console.log(`📨 Recipients sent: ${result.processedRecipients}`)
    console.log(`⚠️  Failures: ${result.failedRecipients}`)

    if (result.errors.length > 0) {
      console.log('🚨 Errors encountered:')
      for (const error of result.errors) {
        console.log(
          `  - Campaign ${error.campaignId >= 0 ? `#${error.campaignId}` : '(dispatcher)'}: ${
            error.error
          }`
        )
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error processing campaigns:', error)
    process.exit(1)
  }
}

main()

