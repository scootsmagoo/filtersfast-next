/**
 * Initialize Currency Tables
 * Run this script to create the currency_rates table and add currency fields to orders
 */

import { initCurrencyTables } from '../lib/db/currency';

console.log('🔧 Initializing currency tables...\n');

try {
  initCurrencyTables();
  console.log('\n✨ Currency tables initialized successfully!\n');
  console.log('💡 Next steps:');
  console.log('   1. Run: npm run update-currency-rates');
  console.log('   2. Currency rates will be fetched and updated automatically\n');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

