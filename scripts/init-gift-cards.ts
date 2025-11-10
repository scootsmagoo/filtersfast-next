/**
 * Initialize Gift Card Tables
 * 
 * Run with:
 *   npx tsx scripts/init-gift-cards.ts
 */

import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'filtersfast.db')
const db = new Database(dbPath)

console.log('🎁 Initializing gift card tables...')

try {
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      initial_value REAL NOT NULL,
      balance REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'partially_redeemed', 'redeemed', 'void')),
      order_id TEXT,
      order_item_id TEXT,
      purchaser_name TEXT,
      purchaser_email TEXT,
      recipient_name TEXT,
      recipient_email TEXT,
      message TEXT,
      send_at INTEGER,
      delivered_at INTEGER,
      issued_at INTEGER,
      last_redeemed_at INTEGER,
      external_reference TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL
    )
  `)
  console.log('✅ gift_cards table ready')

  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_card_transactions (
      id TEXT PRIMARY KEY,
      gift_card_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('issue', 'redeem', 'adjust', 'void', 'reactivate')),
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      order_id TEXT,
      order_number TEXT,
      note TEXT,
      performed_by_id TEXT,
      performed_by_name TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `)
  console.log('✅ gift_card_transactions table ready')

  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_email ON gift_cards(recipient_email)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_order ON gift_cards(order_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_type ON gift_card_transactions(type)`)
  console.log('✅ gift card indexes created')

  console.log('\n🎉 Gift card tables initialized successfully!')
} catch (error) {
  console.error('❌ Failed to initialize gift card tables:', error)
  process.exitCode = 1
} finally {
  db.close()
}

