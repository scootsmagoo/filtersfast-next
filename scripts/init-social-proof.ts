#!/usr/bin/env tsx
/**
 * Initialize Social Proof Schema
 * Creates tables and views for real-time social proof tracking
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

const dbPath = join(process.cwd(), 'filtersfast.db');

console.log('Initializing Social Proof schema...\n');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

try {
  // Read and execute schema file
  const schemaPath = join(process.cwd(), 'database', 'social-proof-schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolons and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
  
  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (error) {
      // Ignore "already exists" errors
      if (error instanceof Error && !error.message.includes('already exists')) {
        console.error('Error executing statement:', error.message);
        console.error('Statement:', statement.substring(0, 100));
      }
    }
  }
  
  // Add social_proof_enabled column to products table if it doesn't exist
  try {
    db.exec(`
      ALTER TABLE products ADD COLUMN social_proof_enabled INTEGER DEFAULT 1;
    `);
    console.log('  ✓ Added social_proof_enabled column to products table');
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate column')) {
      console.log('  ✓ social_proof_enabled column already exists');
    } else {
      throw error;
    }
  }
  
  // Create social_proof_purchases table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS social_proof_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        purchased_at INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);
    
    // Create indexes separately (SQLite doesn't support inline INDEX in CREATE TABLE)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_social_proof_product ON social_proof_purchases(product_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_social_proof_order ON social_proof_purchases(order_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_social_proof_date ON social_proof_purchases(purchased_at);`);
    
    console.log('  ✓ Created social_proof_purchases table');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('  ✓ social_proof_purchases table already exists');
    } else {
      throw error;
    }
  }
  
  // Create views
  try {
    db.exec(`
      CREATE VIEW IF NOT EXISTS view_recent_product_views AS
      SELECT 
        idProduct,
        COUNT(*) as view_count,
        COUNT(DISTINCT sessionId) as unique_viewers
      FROM product_views
      WHERE viewedAt >= datetime('now', '-5 minutes')
      GROUP BY idProduct;
    `);
    console.log('  ✓ Created view_recent_product_views view');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('  ✓ view_recent_product_views view already exists');
    } else {
      throw error;
    }
  }
  
  try {
    db.exec(`
      CREATE VIEW IF NOT EXISTS view_recent_product_purchases AS
      SELECT 
        product_id,
        COUNT(*) as purchase_count,
        SUM(quantity) as total_quantity
      FROM social_proof_purchases
      WHERE purchased_at >= (strftime('%s', 'now') - 3600) * 1000
      GROUP BY product_id;
    `);
    console.log('  ✓ Created view_recent_product_purchases view');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('  ✓ view_recent_product_purchases view already exists');
    } else {
      throw error;
    }
  }
  
  console.log('\n✅ Social Proof schema initialized successfully!');
  console.log('\nNext steps:');
  console.log('  1. Social proof badges will automatically appear on product pages');
  console.log('  2. Purchase tracking is integrated into order creation');
  console.log('  3. Use admin product edit page to enable/disable per product');
  
} catch (error) {
  console.error('\n❌ Error initializing Social Proof schema:', error);
  process.exit(1);
} finally {
  db.close();
}

