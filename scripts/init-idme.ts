/**
 * Initialize ID.me Verification Tables
 * 
 * Creates database tables for storing ID.me verification data
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🔐 Initializing ID.me verification tables...\n');

try {
  // Create idme_verifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS idme_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      verification_type TEXT NOT NULL,
      idme_user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      verified_at TEXT NOT NULL,
      expires_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_idme_user_id 
    ON idme_verifications(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_idme_status 
    ON idme_verifications(status);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_idme_verification_type 
    ON idme_verifications(verification_type);
  `);

  console.log('✅ Created table: idme_verifications');

  // Create idme_discounts table for managing discount configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS idme_discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      verification_type TEXT NOT NULL UNIQUE,
      discount_percentage REAL NOT NULL,
      discount_code TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      min_order_amount REAL,
      max_discount_amount REAL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log('✅ Created table: idme_discounts');

  // Insert default discount configurations
  const insertDiscount = db.prepare(`
    INSERT OR IGNORE INTO idme_discounts 
    (verification_type, discount_percentage, discount_code, is_active, max_discount_amount)
    VALUES (?, ?, ?, ?, ?)
  `);

  const discounts = [
    { type: 'military', percentage: 10, code: 'IDME_MILITARY', maxDiscount: 100 },
    { type: 'responder', percentage: 10, code: 'IDME_RESPONDER', maxDiscount: 100 },
    { type: 'employee', percentage: 15, code: 'IDME_EMPLOYEE', maxDiscount: 150 },
    { type: 'student', percentage: 5, code: 'IDME_STUDENT', maxDiscount: 50 },
    { type: 'teacher', percentage: 10, code: 'IDME_TEACHER', maxDiscount: 100 },
    { type: 'nurse', percentage: 10, code: 'IDME_NURSE', maxDiscount: 100 },
  ];

  discounts.forEach(discount => {
    insertDiscount.run(
      discount.type,
      discount.percentage,
      discount.code,
      1,
      discount.maxDiscount
    );
  });

  console.log('✅ Inserted default discount configurations');

  // Create audit log table for ID.me verifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS idme_verification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      verification_type TEXT,
      action TEXT NOT NULL,
      success INTEGER NOT NULL,
      error_message TEXT,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_idme_log_user 
    ON idme_verification_log(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_idme_log_created 
    ON idme_verification_log(created_at);
  `);

  console.log('✅ Created table: idme_verification_log');

  console.log('\n✨ ID.me tables initialized successfully!');
  console.log('\n📋 Next Steps:');
  console.log('  1. Sign up for ID.me Developer account at https://developer.id.me');
  console.log('  2. Create an application and get your credentials');
  console.log('  3. Add to .env.local:');
  console.log('     IDME_CLIENT_ID=your_client_id');
  console.log('     IDME_CLIENT_SECRET=your_client_secret');
  console.log('     IDME_REDIRECT_URI=http://localhost:3000/api/idme/callback');
  console.log('  4. Run: npm run dev\n');

} catch (error) {
  console.error('❌ Error initializing ID.me tables:', error);
  process.exit(1);
} finally {
  db.close();
}

