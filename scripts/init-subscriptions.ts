/**
 * Initialize Subscription Tables
 * Run this script to create subscription database tables
 */

import { initSubscriptionTables } from '../lib/db/subscriptions'

async function main() {
  try {
    console.log('Initializing subscription tables...')
    
    await initSubscriptionTables()
    
    console.log('✅ Subscription tables initialized successfully!')
    console.log('')
    console.log('Created tables:')
    console.log('  - subscriptions')
    console.log('  - subscription_items')
    console.log('  - subscription_history')
    console.log('  - subscription_logs')
    console.log('')
    console.log('You can now create and manage subscriptions!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error initializing subscription tables:', error)
    process.exit(1)
  }
}

main()



