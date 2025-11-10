/**
 * Initialize Order Credits Database
 * Creates the order_credits table and indexes
 */

import Database from 'better-sqlite3'
import { initOrderCreditsTable } from '../lib/db/order-credits'

const db = new Database('filtersfast.db')

console.log('🚀 Initializing Order Credits database...\n')

try {
  // Initialize the table
  initOrderCreditsTable()
  console.log('✅ Created order_credits table with indexes')

  console.log('\n✅ Order Credits database initialized successfully!')
  console.log('\n📋 Table: order_credits')
  console.log('   - Tracks store credits applied to orders')
  console.log('   - Supports multiple payment methods (PayPal, Stripe, Manual, Store Credit, Refund)')
  console.log('   - Status tracking (pending, success, failed, cancelled)')
  console.log('   - Full audit trail with created_by tracking')
  
  console.log('\n🔗 Access the Order Credits admin at: /admin/order-credits')
} catch (error) {
  console.error('❌ Error initializing order credits database:', error)
  process.exit(1)
} finally {
  db.close()
}




