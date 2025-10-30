/**
 * SMS Marketing (Attentive) - Database Initialization
 * 
 * This script creates the necessary tables for SMS subscription management,
 * including customer opt-ins, preferences, message history, and campaigns.
 * 
 * Run: npm run init:sms
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🚀 Initializing SMS Marketing Database...\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // 1. SMS Subscriptions Table
  console.log('📱 Creating sms_subscriptions table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      phone_number TEXT NOT NULL,
      country_code TEXT DEFAULT '+1',
      attentive_subscriber_id TEXT,
      
      -- Subscription status
      is_subscribed INTEGER DEFAULT 1,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at DATETIME,
      
      -- Subscription channels
      transactional_opt_in INTEGER DEFAULT 1,  -- Order updates
      marketing_opt_in INTEGER DEFAULT 0,       -- Promotional messages
      
      -- Source tracking
      subscription_source TEXT,  -- 'checkout', 'account', 'social', 'popup'
      ip_address TEXT,
      user_agent TEXT,
      
      -- Compliance
      tcpa_consent INTEGER DEFAULT 0,  -- TCPA compliance acknowledged
      tcpa_consent_date DATETIME,
      
      -- Metadata
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(phone_number)
    )
  `);

  // 2. SMS Preferences Table (granular control)
  console.log('⚙️  Creating sms_preferences table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      
      -- Message type preferences
      order_confirmation INTEGER DEFAULT 1,
      shipping_updates INTEGER DEFAULT 1,
      delivery_notifications INTEGER DEFAULT 1,
      return_updates INTEGER DEFAULT 1,
      
      -- Marketing preferences
      promotional_offers INTEGER DEFAULT 0,
      new_products INTEGER DEFAULT 0,
      flash_sales INTEGER DEFAULT 0,
      filter_reminders INTEGER DEFAULT 0,
      
      -- Frequency control
      max_messages_per_week INTEGER DEFAULT 5,
      quiet_hours_start TEXT DEFAULT '21:00',
      quiet_hours_end TEXT DEFAULT '08:00',
      timezone TEXT DEFAULT 'America/New_York',
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (subscription_id) REFERENCES sms_subscriptions(id) ON DELETE CASCADE
    )
  `);

  // 3. SMS Messages Log Table
  console.log('📨 Creating sms_messages table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      
      -- Message details
      message_type TEXT NOT NULL,  -- 'transactional', 'marketing', 'reminder'
      message_category TEXT,       -- 'order_update', 'promo', 'abandoned_cart'
      message_content TEXT NOT NULL,
      
      -- Attentive data
      attentive_message_id TEXT,
      attentive_campaign_id TEXT,
      
      -- Status tracking
      status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'delivered', 'failed', 'clicked'
      sent_at DATETIME,
      delivered_at DATETIME,
      clicked_at DATETIME,
      failed_reason TEXT,
      
      -- Related entities
      order_id INTEGER,
      
      -- Cost tracking
      cost_cents INTEGER DEFAULT 0,  -- Cost in cents ($0.01-0.02 per SMS)
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (subscription_id) REFERENCES sms_subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  // 4. SMS Campaigns Table
  console.log('📣 Creating sms_campaigns table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Campaign details
      name TEXT NOT NULL,
      description TEXT,
      message_template TEXT NOT NULL,
      
      -- Targeting
      target_audience TEXT,  -- 'all', 'new_customers', 'repeat_customers', 'vip'
      segment_filter TEXT,   -- JSON criteria
      
      -- Scheduling
      status TEXT DEFAULT 'draft',  -- 'draft', 'scheduled', 'sending', 'completed', 'cancelled'
      scheduled_for DATETIME,
      sent_at DATETIME,
      completed_at DATETIME,
      
      -- Performance metrics
      total_recipients INTEGER DEFAULT 0,
      messages_sent INTEGER DEFAULT 0,
      messages_delivered INTEGER DEFAULT 0,
      messages_failed INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      revenue_generated REAL DEFAULT 0,
      
      -- Cost tracking
      total_cost_cents INTEGER DEFAULT 0,
      
      -- Creator
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. SMS Analytics Table (daily aggregates)
  console.log('📊 Creating sms_analytics table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      
      -- Subscription metrics
      new_subscriptions INTEGER DEFAULT 0,
      unsubscriptions INTEGER DEFAULT 0,
      total_active_subscribers INTEGER DEFAULT 0,
      
      -- Message metrics
      transactional_sent INTEGER DEFAULT 0,
      marketing_sent INTEGER DEFAULT 0,
      total_delivered INTEGER DEFAULT 0,
      total_failed INTEGER DEFAULT 0,
      total_clicks INTEGER DEFAULT 0,
      
      -- Performance
      click_rate REAL DEFAULT 0,
      delivery_rate REAL DEFAULT 0,
      opt_out_rate REAL DEFAULT 0,
      
      -- Revenue
      revenue_attributed REAL DEFAULT 0,
      total_cost_cents INTEGER DEFAULT 0,
      roi REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(date)
    )
  `);

  // 6. SMS Opt-Out Keywords Table
  console.log('🚫 Creating sms_opt_out_keywords table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_opt_out_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      
      -- Opt-out details
      keyword TEXT NOT NULL,  -- What they texted (STOP, UNSUBSCRIBE, etc.)
      opted_out_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (subscription_id) REFERENCES sms_subscriptions(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  console.log('🔍 Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sms_subscriptions_user_id ON sms_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sms_subscriptions_phone ON sms_subscriptions(phone_number);
    CREATE INDEX IF NOT EXISTS idx_sms_subscriptions_status ON sms_subscriptions(is_subscribed);
    CREATE INDEX IF NOT EXISTS idx_sms_messages_subscription_id ON sms_messages(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
    CREATE INDEX IF NOT EXISTS idx_sms_messages_type ON sms_messages(message_type);
    CREATE INDEX IF NOT EXISTS idx_sms_messages_order_id ON sms_messages(order_id);
    CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_sms_analytics_date ON sms_analytics(date);
  `);

  // Check if user table exists before querying
  console.log('👤 Checking for existing users...');
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='user'
  `).get();

  if (tableExists) {
    const existingUsers = db.prepare(`
      SELECT id, email FROM user WHERE id NOT IN (
        SELECT DISTINCT user_id FROM sms_subscriptions WHERE user_id IS NOT NULL
      )
    `).all();
    console.log(`Found ${existingUsers.length} users without SMS subscriptions.`);
  } else {
    console.log('User table not found (this is normal for fresh installs).');
  }

  // Seed some sample campaigns for testing
  console.log('🌱 Seeding sample campaigns...');
  try {
    const insertCampaign = db.prepare(`
      INSERT INTO sms_campaigns (name, description, message_template, target_audience, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertCampaign.run(
      'Welcome Series - New Subscribers',
      'Welcome message for new SMS subscribers with 10% off',
      'Welcome to FiltersFast! 🎉 Get 10% off your next order with code SMS10. Shop now: {{link}}',
      'new_customers',
      'draft'
    );

    insertCampaign.run(
      'Flash Sale - Summer Savings',
      '24-hour flash sale on air filters',
      '⚡ FLASH SALE! 25% off all air filters for 24hrs only. Use code SUMMER25: {{link}}',
      'all',
      'draft'
    );

    insertCampaign.run(
      'Filter Reminder - 3 Month',
      'Reminder to replace filters after 3 months',
      "Time to replace your filter! 🔄 It's been 3 months. Order now with free shipping: {{link}}",
      'repeat_customers',
      'draft'
    );

    insertCampaign.run(
      'Abandoned Cart Recovery',
      'Recover abandoned carts via SMS',
      "You left something behind! 🛒 Complete your order now and get FREE shipping: {{link}}",
      'all',
      'draft'
    );
  } catch (error) {
    console.log('⚠️  Skipping campaign seeding (may require user table)');
  }

  console.log('\n✅ SMS Marketing Database initialized successfully!');
  console.log('\n📋 Created tables:');
  console.log('   ✓ sms_subscriptions');
  console.log('   ✓ sms_preferences');
  console.log('   ✓ sms_messages');
  console.log('   ✓ sms_campaigns');
  console.log('   ✓ sms_analytics');
  console.log('   ✓ sms_opt_out_keywords');
  console.log(`\n📊 Seeded 4 sample campaigns`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Add ATTENTIVE_API_KEY to your .env file');
  console.log('   2. Configure Attentive webhook endpoints');
  console.log('   3. Test SMS opt-in flow at checkout');
  console.log('   4. Set up automated order update messages');

} catch (error) {
  console.error('❌ Error initializing SMS database:', error);
  process.exit(1);
} finally {
  db.close();
}

