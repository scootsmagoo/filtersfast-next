/**
 * Initialize SKU Compatibility Database Schema
 * Creates product_sku_compatibility table for managing compatible SKUs
 * 
 * Run: npx tsx scripts/init-sku-compatibility-schema.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

const dbPath = join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🚀 Initializing SKU Compatibility Database Schema...\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schemaPath = join(process.cwd(), 'database', 'sku-compatibility-schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolons and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (error: any) {
      // Ignore "table already exists" errors
      if (!error.message.includes('already exists')) {
        console.error('Error executing statement:', error.message);
        console.error('Statement:', statement.substring(0, 100));
      }
    }
  }

  console.log('✅ SKU Compatibility database schema initialized successfully!\n');
  console.log('📊 Summary:');
  console.log('   - product_sku_compatibility table for compatible SKUs');
  console.log('   - Indexes for efficient queries');
  console.log('   - Views for compatibility summaries\n');

} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
} finally {
  db.close();
}

