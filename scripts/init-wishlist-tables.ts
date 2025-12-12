/**
 * Initialize Wishlist Database Tables
 */

import { initWishlistTables } from '../lib/db/wishlist';

console.log('🔧 Initializing wishlist database tables...\n');

try {
  initWishlistTables();
  console.log('\n✨ Wishlist tables initialized successfully!\n');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

