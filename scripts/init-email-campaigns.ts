/**
 * Email Campaign Manager - Database Initialization Script
 *
 * Run with: npm run init:email-campaigns
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('📧 Initializing Email Campaign Manager tables...\n');

try {
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  console.log('🗂️  Creating table: email_campaigns');
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      from_name TEXT NOT NULL,
      from_email TEXT NOT NULL,
      reply_to_email TEXT,
      template_id TEXT,
      content_html TEXT,
      content_text TEXT,
      target_audience TEXT,
      segment_rules TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_at DATETIME,
      sent_at DATETIME,
      completed_at DATETIME,
      cancelled_at DATETIME,
      test_mode INTEGER DEFAULT 0,
      metadata TEXT,
      last_error TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('👥 Creating table: email_campaign_recipients');
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_campaign_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      sent_at DATETIME,
      opened_at DATETIME,
      clicked_at DATETIME,
      bounced_at DATETIME,
      suppressed_at DATETIME,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(campaign_id, email),
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
    )
  `);

  console.log('📈 Creating table: email_campaign_events');
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_campaign_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      recipient_email TEXT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
    )
  `);

  console.log('🔍 Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_events_campaign ON email_campaign_events(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_events_type ON email_campaign_events(event_type);
  `);

  const existing = db.prepare('SELECT COUNT(*) as count FROM email_campaigns').get() as { count: number };

  if (existing.count === 0) {
    console.log('🌱 Seeding sample campaigns...');
    const insertCampaign = db.prepare(`
      INSERT INTO email_campaigns (
        name,
        subject,
        from_name,
        from_email,
        content_html,
        content_text,
        target_audience,
        status,
        metadata,
        created_by,
        updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCampaign.run(
      'Spring Filter Savings',
      'Spring cleaning starts with fresh filters',
      'FiltersFast Marketing',
      'marketing@filtersfast.com',
      '<h1>Spring Savings</h1><p>Save 20% on select filters this week only.</p>',
      'Save 20% on select filters this week only.',
      'all_customers',
      'draft',
      JSON.stringify({ theme: 'spring' }),
      null,
      null
    );

    insertCampaign.run(
      'Filter Reminder Series',
      'Is it time to replace your filter?',
      'FiltersFast Reminders',
      'reminders@filtersfast.com',
      '<p>It has been three months since your last purchase. Time to replace your filter!</p>',
      'It has been three months since your last purchase. Time to replace your filter!',
      'repeat_customers',
      'scheduled',
      JSON.stringify({ cadence: 'quarterly' }),
      null,
      null
    );

    const firstCampaignId = db.prepare('SELECT id FROM email_campaigns ORDER BY id LIMIT 1').get() as { id: number };

    if (firstCampaignId) {
      console.log('👥 Seeding sample recipients...');
      const insertRecipient = db.prepare(`
        INSERT INTO email_campaign_recipients (
          campaign_id,
          email,
          first_name,
          last_name,
          status
        ) VALUES (?, ?, ?, ?, 'pending')
      `);

      insertRecipient.run(firstCampaignId.id, 'jane.doe@example.com', 'Jane', 'Doe');
      insertRecipient.run(firstCampaignId.id, 'john.smith@example.com', 'John', 'Smith');

      const insertEvent = db.prepare(`
        INSERT INTO email_campaign_events (
          campaign_id,
          recipient_email,
          event_type,
          event_data
        ) VALUES (?, ?, ?, ?)
      `);

      insertEvent.run(firstCampaignId.id, null, 'created', JSON.stringify({ seeded: true }));
    }
  } else {
    console.log('ℹ️  Existing campaigns found, skipping seed data.');
  }

  console.log('\n✅ Email Campaign Manager tables ready!');
} catch (error) {
  console.error('❌ Failed to initialize email campaign tables:', error);
  process.exit(1);
} finally {
  db.close();
}


