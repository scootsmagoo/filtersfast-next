/**
 * Initialize Loyalty Program Database Tables
 * 
 * Run with:
 *   npx tsx scripts/init-loyalty.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🎁 Initializing loyalty program tables...');

try {
  // Drop existing tables if they exist (to remove foreign key constraints)
  db.exec(`DROP TABLE IF EXISTS loyalty_transactions`);
  db.exec(`DROP TABLE IF EXISTS loyalty_points`);
  db.exec(`DROP TABLE IF EXISTS loyalty_tiers`);
  db.exec(`DROP TABLE IF EXISTS loyalty_settings`);
  console.log('🗑️  Dropped existing loyalty tables (if any)');

  db.pragma('foreign_keys = ON');

  // Loyalty Program Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      points_per_dollar REAL NOT NULL DEFAULT 1.0,
      points_per_review INTEGER NOT NULL DEFAULT 50,
      points_per_referral INTEGER NOT NULL DEFAULT 100,
      points_per_birthday INTEGER NOT NULL DEFAULT 200,
      min_redeem_amount REAL NOT NULL DEFAULT 100,
      redemption_rate REAL NOT NULL DEFAULT 100,
      expiration_days INTEGER,
      tier_enabled INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  console.log('✅ loyalty_settings table ready');

  // Loyalty Points Table (tracks current balance per customer)
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_points (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      customer_email TEXT NOT NULL,
      points_balance INTEGER NOT NULL DEFAULT 0,
      lifetime_points INTEGER NOT NULL DEFAULT 0,
      tier_level INTEGER NOT NULL DEFAULT 1,
      tier_name TEXT DEFAULT 'Bronze',
      last_activity_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  console.log('✅ loyalty_points table ready');

  // Loyalty Transactions Table (history of all point changes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id TEXT PRIMARY KEY,
      loyalty_points_id TEXT NOT NULL,
      user_id TEXT,
      customer_email TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'refunded', 'bonus')),
      points INTEGER NOT NULL,
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      order_id TEXT,
      order_number TEXT,
      description TEXT,
      expires_at INTEGER,
      performed_by_id TEXT,
      performed_by_name TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (loyalty_points_id) REFERENCES loyalty_points(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ loyalty_transactions table ready');

  // Loyalty Tiers Table (defines tier levels and benefits)
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_tiers (
      id TEXT PRIMARY KEY,
      tier_level INTEGER NOT NULL UNIQUE,
      tier_name TEXT NOT NULL,
      min_points INTEGER NOT NULL,
      max_points INTEGER,
      points_multiplier REAL NOT NULL DEFAULT 1.0,
      benefits TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  console.log('✅ loyalty_tiers table ready');

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_points_email ON loyalty_points(customer_email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier_level)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_points_id ON loyalty_transactions(loyalty_points_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_email ON loyalty_transactions(customer_email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(transaction_type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order ON loyalty_transactions(order_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_level ON loyalty_tiers(tier_level)`);
  console.log('✅ loyalty program indexes created');

  // Initialize default settings if not exists
  const checkSettings = db.prepare('SELECT id FROM loyalty_settings WHERE id = ?').get('default');
  if (!checkSettings) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO loyalty_settings (
        id, is_enabled, points_per_dollar, points_per_review, points_per_referral,
        points_per_birthday, min_redeem_amount, redemption_rate, tier_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default',
      1, // enabled
      1.0, // 1 point per dollar
      50, // 50 points per review
      100, // 100 points per referral
      200, // 200 points for birthday
      100, // minimum 100 points to redeem
      100, // 100 points = $1.00
      1, // tiers enabled
      now,
      now
    );
    console.log('✅ Default loyalty settings initialized');
  }

  // Initialize default tiers if not exists
  const checkTiers = db.prepare('SELECT COUNT(*) as count FROM loyalty_tiers').get() as { count: number };
  if (checkTiers.count === 0) {
    const now = Date.now();
    const defaultTiers = [
      { level: 1, name: 'Bronze', min: 0, max: 999, multiplier: 1.0, benefits: 'Standard earning rate' },
      { level: 2, name: 'Silver', min: 1000, max: 4999, multiplier: 1.25, benefits: '25% bonus points, free shipping on orders $50+' },
      { level: 3, name: 'Gold', min: 5000, max: 9999, multiplier: 1.5, benefits: '50% bonus points, free shipping, early access to sales' },
      { level: 4, name: 'Platinum', min: 10000, max: null, multiplier: 2.0, benefits: '100% bonus points, free shipping, exclusive products, dedicated support' },
    ];

    const insertTier = db.prepare(`
      INSERT INTO loyalty_tiers (id, tier_level, tier_name, min_points, max_points, points_multiplier, benefits, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const tier of defaultTiers) {
      const tierId = `tier_${tier.level}`;
      insertTier.run(
        tierId,
        tier.level,
        tier.name,
        tier.min,
        tier.max,
        tier.multiplier,
        tier.benefits,
        now,
        now
      );
    }
    console.log('✅ Default loyalty tiers initialized');
  }

  console.log('\n🎉 Loyalty program tables initialized successfully!');
} catch (error) {
  console.error('❌ Failed to initialize loyalty program tables:', error);
  process.exitCode = 1;
} finally {
  db.close();
}

