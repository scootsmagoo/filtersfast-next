import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = process.env.DATABASE_URL || './filtersfast.db';

async function initPushNotifications() {
  console.log('Initializing push notifications schema...');

  try {
    const db = new Database(dbPath);
    
    // Read and execute schema SQL
    const schemaPath = join(process.cwd(), 'database', 'push-notifications-schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema (SQLite doesn't support multiple statements in one exec, so split)
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        db.exec(statement + ';');
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('Error executing statement:', statement);
          console.error(error);
        }
      }
    }

    console.log('✅ Push notifications schema initialized successfully');
    
    db.close();
  } catch (error) {
    console.error('❌ Error initializing push notifications schema:', error);
    process.exit(1);
  }
}

initPushNotifications();

