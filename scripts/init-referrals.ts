/**
 * Initialize Referral Program Database Tables
 * 
 * Sets up tables for customer referral program and social sharing tracking
 */

import Database from 'better-sqlite3';

const db = new Database('filtersfast.db');

console.log('🎁 Initializing Referral Program database tables...\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create referral_codes table
  // Note: No foreign keys to user table since it's in auth.db (different database)
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      total_rewards REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
    CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
    CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(active);
  `);
  console.log('✅ Created referral_codes table');

  // Create referral_clicks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_clicks (
      id TEXT PRIMARY KEY,
      referral_code_id TEXT NOT NULL,
      referral_code TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer_url TEXT,
      landing_page TEXT,
      converted INTEGER DEFAULT 0,
      conversion_order_id INTEGER,
      clicked_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_referral_clicks_code_id ON referral_clicks(referral_code_id);
    CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
    CREATE INDEX IF NOT EXISTS idx_referral_clicks_converted ON referral_clicks(converted);
    CREATE INDEX IF NOT EXISTS idx_referral_clicks_date ON referral_clicks(clicked_at);
  `);
  console.log('✅ Created referral_clicks table');

  // Create referral_conversions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_conversions (
      id TEXT PRIMARY KEY,
      referral_code_id TEXT NOT NULL,
      referral_code TEXT NOT NULL,
      referrer_user_id TEXT NOT NULL,
      referred_user_id TEXT,
      order_id INTEGER NOT NULL,
      order_total REAL NOT NULL,
      referrer_reward REAL DEFAULT 0,
      referred_discount REAL DEFAULT 0,
      reward_status TEXT DEFAULT 'pending' CHECK(reward_status IN ('pending', 'approved', 'paid', 'cancelled')),
      converted_at TEXT NOT NULL,
      processed_at TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_referral_conversions_code_id ON referral_conversions(referral_code_id);
    CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON referral_conversions(referrer_user_id);
    CREATE INDEX IF NOT EXISTS idx_referral_conversions_order ON referral_conversions(order_id);
    CREATE INDEX IF NOT EXISTS idx_referral_conversions_status ON referral_conversions(reward_status);
    CREATE INDEX IF NOT EXISTS idx_referral_conversions_date ON referral_conversions(converted_at);
  `);
  console.log('✅ Created referral_conversions table');

  // Create referral_rewards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_rewards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      referral_conversion_id TEXT NOT NULL,
      reward_type TEXT NOT NULL CHECK(reward_type IN ('credit', 'discount', 'percentage', 'fixed')),
      reward_amount REAL NOT NULL,
      reward_code TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'redeemed', 'expired')),
      redeemed_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
    CREATE INDEX IF NOT EXISTS idx_referral_rewards_conversion ON referral_rewards(referral_conversion_id);
    CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
    CREATE INDEX IF NOT EXISTS idx_referral_rewards_code ON referral_rewards(reward_code);
  `);
  console.log('✅ Created referral_rewards table');

  // Create referral_settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_settings (
      id TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      referrer_reward_type TEXT DEFAULT 'credit' CHECK(referrer_reward_type IN ('credit', 'discount', 'percentage', 'fixed')),
      referrer_reward_amount REAL DEFAULT 10.00,
      referred_discount_type TEXT DEFAULT 'percentage' CHECK(referred_discount_type IN ('percentage', 'fixed')),
      referred_discount_amount REAL DEFAULT 10.00,
      minimum_order_value REAL DEFAULT 50.00,
      reward_delay_days INTEGER DEFAULT 14,
      terms_text TEXT,
      updated_at TEXT NOT NULL
    );
    
    -- Insert default settings if not exists
    INSERT OR IGNORE INTO referral_settings (
      id, 
      enabled, 
      referrer_reward_type,
      referrer_reward_amount,
      referred_discount_type,
      referred_discount_amount,
      minimum_order_value,
      reward_delay_days,
      terms_text,
      updated_at
    ) VALUES (
      'default',
      1,
      'credit',
      10.00,
      'percentage',
      10.00,
      50.00,
      14,
      'Refer a friend and get $10 credit when they make their first purchase of $50 or more. Your friend also gets 10% off their first order!',
      datetime('now')
    );
  `);
  console.log('✅ Created referral_settings table with default settings');

  // Create social_share_analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_share_analytics (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      share_type TEXT NOT NULL CHECK(share_type IN ('product', 'referral', 'order', 'general')),
      share_platform TEXT NOT NULL CHECK(share_platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'copy')),
      shared_url TEXT NOT NULL,
      product_id TEXT,
      referral_code TEXT,
      ip_address TEXT,
      shared_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_social_share_user_id ON social_share_analytics(user_id);
    CREATE INDEX IF NOT EXISTS idx_social_share_type ON social_share_analytics(share_type);
    CREATE INDEX IF NOT EXISTS idx_social_share_platform ON social_share_analytics(share_platform);
    CREATE INDEX IF NOT EXISTS idx_social_share_date ON social_share_analytics(shared_at);
    CREATE INDEX IF NOT EXISTS idx_social_share_referral ON social_share_analytics(referral_code);
  `);
  console.log('✅ Created social_share_analytics table');

  console.log('\n✨ Referral Program database initialized successfully!\n');
  console.log('📊 Default Settings:');
  console.log('  - Referrer Reward: $10 credit per conversion');
  console.log('  - Referred Discount: 10% off first order');
  console.log('  - Minimum Order Value: $50');
  console.log('  - Reward Delay: 14 days (return window)');
  console.log('  - Status: Enabled\n');

} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}

