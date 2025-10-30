/**
 * Reset SMS Tables - Drop and Recreate
 * Run this if you're getting foreign key errors
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🔄 Resetting SMS Marketing Tables...\n');

try {
  db.pragma('foreign_keys = OFF'); // Temporarily disable to drop tables

  // Drop all SMS tables
  console.log('🗑️  Dropping existing tables...');
  db.exec('DROP TABLE IF EXISTS sms_opt_out_keywords');
  db.exec('DROP TABLE IF EXISTS sms_analytics');
  db.exec('DROP TABLE IF EXISTS sms_campaigns');
  db.exec('DROP TABLE IF EXISTS sms_messages');
  db.exec('DROP TABLE IF EXISTS sms_preferences');
  db.exec('DROP TABLE IF EXISTS sms_subscriptions');
  
  console.log('✅ Tables dropped successfully\n');
  console.log('🔄 Now run: npm run init:sms\n');

} catch (error) {
  console.error('❌ Error resetting tables:', error);
  process.exit(1);
} finally {
  db.close();
}

