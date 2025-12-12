/**
 * Initialize PayPal Transactions Table
 * 
 * Run this script to create the PayPal transactions logging table
 * Usage: npm run init:paypal
 */

import { initializePayPalTransactionsTables } from '../lib/db/paypal-transactions';

async function main() {
  console.log('🚀 Initializing PayPal transactions table...\n');

  try {
    initializePayPalTransactionsTables();

    console.log('\n✅ PayPal transactions table initialized successfully!\n');
    console.log('📝 Next steps:');
    console.log('  1. Ensure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set in .env');
    console.log('  2. Ensure NEXT_PUBLIC_PAYPAL_CLIENT_ID is set in .env');
    console.log('  3. Start dev server: npm run dev');
    console.log('  4. Test PayPal checkout flow');
    console.log('\n💡 PayPal Configuration:');
    console.log('  - Get sandbox keys: https://developer.paypal.com/dashboard/applications');
    console.log('  - Create test accounts: https://developer.paypal.com/dashboard/accounts');
    console.log('  - View transaction logs in the paypal_transactions table');
    console.log('\n🎯 Features Enabled:');
    console.log('  ✓ PayPal Checkout');
    console.log('  ✓ Venmo Payments');
    console.log('  ✓ Transaction Logging');
    console.log('  ✓ Error Tracking');
    console.log('  ✓ Order Creation');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error initializing PayPal table:', error);
    process.exit(1);
  }
}

main();

