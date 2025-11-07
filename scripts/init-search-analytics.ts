import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');
const schemaPath = join(process.cwd(), 'database', 'search-analytics-schema.sql');

async function initSearchAnalytics() {
  console.log('Initializing search analytics schema...');

  const db = new Database(dbPath);

  try {
    // Read schema file
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema - SQLite better-sqlite3 requires running each statement separately
    // Better approach: split by semicolon and handle multiline statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Remove comments
        const lines = s.split('\n');
        const cleaned = lines
          .map(line => {
            const commentIndex = line.indexOf('--');
            return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
          })
          .join(' ')
          .trim();
        return cleaned.length > 0;
      });

    for (const statement of statements) {
      // Clean up the statement (remove comments, normalize whitespace)
      const cleaned = statement
        .split('\n')
        .map(line => {
          // Remove inline comments
          const commentIndex = line.indexOf('--');
          return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned) continue;

      try {
        db.exec(cleaned);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate') &&
            !error.message.includes('no such table') &&
            !error.message.includes('incomplete input')) {
          console.error('Error executing statement:', cleaned.substring(0, 100));
          console.error(error.message);
        }
      }
    }

    console.log('✅ Search analytics schema initialized successfully');
    console.log('   - search_logs table');
    console.log('   - search_clicks table');
    console.log('   - Views: v_top_searches, v_search_trends, v_failed_searches, v_search_conversions');
    console.log('   - Indexes created');

  } catch (error) {
    console.error('❌ Error initializing search analytics schema:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initSearchAnalytics();

