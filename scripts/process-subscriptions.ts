/**
 * Process Subscription Orders Script
 * Run this daily via cron to process due subscriptions
 * 
 * Cron: 0 6 * * * (Daily at 6 AM)
 */

const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret'
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function processSubscriptions() {
  try {
    console.log('🔄 Processing subscription orders...')
    console.log(`⏰ Time: ${new Date().toISOString()}`)
    
    const response = await fetch(`${API_URL}/api/subscriptions/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${error}`)
    }

    const result = await response.json()
    
    console.log('✅ Processing complete!')
    console.log(`📦 Processed: ${result.results.processed}`)
    console.log(`❌ Failed: ${result.results.failed}`)
    
    if (result.results.errors.length > 0) {
      console.log('⚠️  Errors:')
      result.results.errors.forEach((err: string) => console.log(`  - ${err}`))
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error processing subscriptions:', error)
    process.exit(1)
  }
}

async function sendReminders() {
  try {
    console.log('📧 Sending subscription reminders...')
    console.log(`⏰ Time: ${new Date().toISOString()}`)
    
    const response = await fetch(`${API_URL}/api/subscriptions/process`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${error}`)
    }

    const result = await response.json()
    
    console.log('✅ Reminders sent!')
    console.log(`📧 Sent: ${result.results.sent}`)
    console.log(`❌ Failed: ${result.results.failed}`)
    
    if (result.results.errors.length > 0) {
      console.log('⚠️  Errors:')
      result.results.errors.forEach((err: string) => console.log(`  - ${err}`))
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error sending reminders:', error)
    process.exit(1)
  }
}

// Run based on argument
const command = process.argv[2]

if (command === 'reminders') {
  sendReminders()
} else {
  processSubscriptions()
}



