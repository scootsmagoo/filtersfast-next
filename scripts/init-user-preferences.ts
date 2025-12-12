/**
 * Initialize User Preferences Table
 * Run this script to create the user_preferences table
 */

import { initUserPreferencesTable } from '../lib/db/user-preferences';

console.log('🔧 Initializing user preferences table...\n');

try {
  initUserPreferencesTable();
  console.log('\n✨ User preferences table initialized successfully!\n');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

