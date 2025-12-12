/**
 * Initialize Images Database Schema
 * Creates product_images table for gallery images
 * 
 * Run: npx tsx scripts/init-images-schema.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

const dbPath = join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🚀 Initializing Images Database Schema...\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schemaPath = join(process.cwd(), 'database', 'images-schema.sql');
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

  console.log('✅ Images database schema initialized successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Product images table for gallery images');
  console.log('   - Indexes for efficient queries\n');

} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
} finally {
  db.close();
}

