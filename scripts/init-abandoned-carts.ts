/**
 * Initialize Abandoned Cart Recovery System
 * 
 * Run this script to set up the database tables for abandoned cart tracking
 * 
 * Usage: npx tsx scripts/init-abandoned-carts.ts
 */

import { initializeAbandonedCartTables } from '../lib/db/abandoned-carts';

console.log('🛒 Initializing Abandoned Cart Recovery System...\n');

try {
  initializeAbandonedCartTables();
  console.log('\n✨ Abandoned Cart Recovery System initialized successfully!\n');
  console.log('📊 Features enabled:');
  console.log('  - Cart abandonment tracking');
  console.log('  - 3-stage email recovery (1hr, 24hr, 72hr)');
  console.log('  - Unique recovery links');
  console.log('  - Opt-out functionality');
  console.log('  - Admin analytics dashboard');
  console.log('  - Auto-cleanup of old carts (90+ days)');
  console.log('\n🚀 Next steps:');
  console.log('  1. Set up scheduled job: npm run cron:abandoned-carts');
  console.log('  2. Configure email templates in lib/email-templates/abandoned-cart.ts');
  console.log('  3. View analytics at /admin/abandoned-carts\n');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

