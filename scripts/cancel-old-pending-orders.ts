/**
 * Auto-Cancel Old Pending Orders
 * 
 * Cancels orders that have been in "pending" status for 60+ days
 * Similar to legacy abandonedPendingOrders.asp
 * 
 * Run this script daily:
 * npx tsx scripts/cancel-old-pending-orders.ts
 * 
 * Or add to package.json:
 * "cron:cancel-old-orders": "tsx scripts/cancel-old-pending-orders.ts"
 */

import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL || './auth.db');

interface PendingOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  email: string;
}

async function cancelOldPendingOrders() {
  console.log('\n🔍 Checking for old pending orders...\n');
  console.log(`⏰ ${new Date().toISOString()}\n`);

  let cancelledCount = 0;

  try {
    // Check if orders table exists first
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='orders'
    `).get();

    if (!tableExists) {
      console.log('⚠️  Orders table not found. Creating placeholder...\n');
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          order_number TEXT NOT NULL UNIQUE,
          user_id TEXT,
          email TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          total REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          cancelled_at DATETIME,
          cancellation_reason TEXT,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
        )
      `);
      
      console.log('✅ Orders table created');
      console.log('ℹ️  No orders to process yet\n');
      console.log('✨ Script completed successfully\n');
      return;
    }

    // Find orders pending for 60+ days
    const findStmt = db.prepare(`
      SELECT id, order_number, created_at, status, email
      FROM orders
      WHERE status = 'pending'
        AND created_at < datetime('now', '-60 days')
      ORDER BY created_at ASC
    `);

    const pendingOrders = findStmt.all() as PendingOrder[];

    console.log(`Found ${pendingOrders.length} orders pending for 60+ days\n`);

    if (pendingOrders.length === 0) {
      console.log('✅ No orders to cancel\n');
      return;
    }

    // Cancel each order
    const updateStmt = db.prepare(`
      UPDATE orders
      SET status = 'cancelled',
          cancelled_at = datetime('now'),
          cancellation_reason = 'Auto-cancelled after 60 days in pending status',
          updated_at = datetime('now')
      WHERE id = ?
    `);

    for (const order of pendingOrders) {
      try {
        updateStmt.run(order.id);
        cancelledCount++;
        console.log(`✅ Cancelled order ${order.order_number} (${order.email})`);
        console.log(`   Created: ${order.created_at}`);
        console.log(`   Age: ${Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))} days\n`);
      } catch (error: any) {
        console.error(`❌ Error cancelling order ${order.order_number}:`, error.message);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Orders cancelled: ${cancelledCount}`);
  console.log(`✨ Job completed at ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');
}

// Run the job
cancelOldPendingOrders()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    db.close();
    process.exit(1);
  });

