/**
 * Initialize Product Options Database Schema
 * Run this script to create the product options tables
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');
const schemaPath = join(process.cwd(), 'database', 'product-options-schema.sql');

function initSchema() {
  console.log('Initializing product options database schema...');
  
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  try {
    // Read schema file
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema (SQLite doesn't support multiple statements in one exec, so split by semicolon)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    db.transaction(() => {
      for (const statement of statements) {
        if (statement.trim().length > 0) {
          try {
            db.exec(statement + ';');
          } catch (error: any) {
            // Ignore errors for IF NOT EXISTS statements
            if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
              console.warn('Warning executing statement:', statement.substring(0, 50) + '...', error.message);
            }
          }
        }
      }
    })();
    
    console.log('✅ Product options schema initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initSchema();

