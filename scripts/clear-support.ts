/**
 * Clear all support data
 * Run with: npx tsx scripts/clear-support.ts
 */

import Database from 'better-sqlite3';

const db = new Database('auth.db');

console.log('🧹 Clearing Support Portal data...\n');

try {
  // Delete in reverse order to respect foreign keys
  db.prepare('DELETE FROM support_article_feedback').run();
  console.log('✅ Cleared article feedback');
  
  db.prepare('DELETE FROM support_article_views').run();
  console.log('✅ Cleared article views');
  
  db.prepare('DELETE FROM support_articles').run();
  console.log('✅ Cleared articles');
  
  db.prepare('DELETE FROM support_categories').run();
  console.log('✅ Cleared categories');
  
  console.log('\n✨ Support data cleared successfully!\n');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}

