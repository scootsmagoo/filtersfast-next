/**
 * Initialize TaxJar Integration Database Tables
 * Tables for tax calculation logging and TaxJar order reporting
 */

import Database from 'better-sqlite3';

const mainDb = new Database('filtersfast.db');

console.log('🧾 Initializing TaxJar Integration database tables...\n');

try {
  // TaxJar Sales Tax Logs Table (logs tax rate calculations during checkout)
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS taxjar_sales_tax_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      sales_tax_request TEXT NOT NULL,
      sales_tax_response TEXT NOT NULL,
      status_code INTEGER,
      success INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Created taxjar_sales_tax_logs table');

  // Create index for sales tax logs
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_taxjar_sales_tax_logs_order_id ON taxjar_sales_tax_logs(order_id);
    CREATE INDEX IF NOT EXISTS idx_taxjar_sales_tax_logs_created_at ON taxjar_sales_tax_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_taxjar_sales_tax_logs_success ON taxjar_sales_tax_logs(success);
  `);
  console.log('✅ Created taxjar_sales_tax_logs indexes');

  // TaxJar Order Posts Table (logs order reporting to TaxJar for compliance)
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS taxjar_order_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      order_status TEXT NOT NULL,
      tj_resp_status INTEGER,
      tj_response TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created taxjar_order_posts table');

  // Create indexes for order posts
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_taxjar_order_posts_order_id ON taxjar_order_posts(order_id);
    CREATE INDEX IF NOT EXISTS idx_taxjar_order_posts_created_at ON taxjar_order_posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_taxjar_order_posts_success ON taxjar_order_posts(success);
    CREATE INDEX IF NOT EXISTS idx_taxjar_order_posts_order_status ON taxjar_order_posts(order_status);
  `);
  console.log('✅ Created taxjar_order_posts indexes');

  // TaxJar Retry Queue Table (orders that need to be retried)
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS taxjar_retry_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL UNIQUE,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      next_retry_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created taxjar_retry_queue table');

  // Create indexes for retry queue
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_taxjar_retry_queue_next_retry_at ON taxjar_retry_queue(next_retry_at);
    CREATE INDEX IF NOT EXISTS idx_taxjar_retry_queue_order_id ON taxjar_retry_queue(order_id);
  `);
  console.log('✅ Created taxjar_retry_queue indexes');

  console.log('\n✨ TaxJar Integration database tables initialized successfully!\n');
  
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  mainDb.close();
}

