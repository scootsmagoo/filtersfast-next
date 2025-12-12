/**
 * Initialize Giveaways System
 * 
 * Creates database tables and optionally seeds sample data
 * 
 * Usage:
 *   npm run init:giveaways
 */

import { initGiveawayTables, createGiveaway } from '../lib/db/giveaways';

console.log('🎁 Initializing Giveaways System...\n');

try {
  // Create tables
  initGiveawayTables();
  
  console.log('\n✅ Giveaway system initialized successfully!');
  console.log('\nNext steps:');
  console.log('  1. Add giveaways via admin dashboard at /admin/giveaways');
  console.log('  2. Users can enter at /giveaway or /giveaway/[campaign-name]');
  console.log('  3. Select winners from admin dashboard\n');

} catch (error) {
  console.error('❌ Error initializing giveaway system:', error);
  process.exit(1);
}

