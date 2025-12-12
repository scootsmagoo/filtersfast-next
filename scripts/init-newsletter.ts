/**
 * Initialize Newsletter Tokens Table
 * Run this script to create the newsletter_tokens table
 */

import { initNewsletterTokensTable } from '../lib/db/newsletter-tokens';

console.log('🔧 Initializing newsletter tokens table...\n');

try {
  initNewsletterTokensTable();
  console.log('\n✨ Newsletter tokens table initialized successfully!\n');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

