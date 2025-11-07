/**
 * Initialize Blog Schema
 * Creates the blog_posts table if it doesn't exist
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

const dbPath = join(process.cwd(), 'filtersfast.db');

try {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  console.log('Initializing blog schema...');

  // Read and execute schema
  const schemaPath = join(process.cwd(), 'database', 'blog-schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  db.exec(schema);

  console.log('✅ Blog schema initialized successfully!');
  console.log('   - blog_posts table created');
  console.log('   - Indexes created');

  db.close();
} catch (error) {
  console.error('❌ Error initializing blog schema:', error);
  process.exit(1);
}

