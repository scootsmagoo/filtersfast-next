/**
 * Initialize Affiliate Program Tables
 * 
 * Run this script to create the affiliate program database tables
 * Usage: npx tsx scripts/init-affiliates.ts
 */

import { initAffiliatesTable, getAffiliateSettings } from '../lib/db/affiliates';

async function main() {
  try {
    console.log('🚀 Initializing affiliate program tables...');
    
    // Initialize tables
    initAffiliatesTable();
    
    console.log('✅ Affiliate tables created successfully!');
    
    // Display settings
    const settings = getAffiliateSettings();
    console.log('\n📋 Default Affiliate Settings:');
    console.log(`  Program Enabled: ${settings.program_enabled}`);
    console.log(`  Auto-Approve Affiliates: ${settings.auto_approve_affiliates}`);
    console.log(`  Default Commission Type: ${settings.default_commission_type}`);
    console.log(`  Default Commission Rate: ${settings.default_commission_rate}%`);
    console.log(`  Cookie Duration: ${settings.cookie_duration_days} days`);
    console.log(`  Minimum Payout: $${settings.minimum_payout_threshold}`);
    console.log(`  Payout Schedule: ${settings.payout_schedule}`);
    console.log(`  Commission Hold Period: ${settings.commission_hold_days} days`);
    
    console.log('\n✨ Affiliate program is ready to use!');
    console.log('\n📚 Next steps:');
    console.log('  1. Configure settings via admin dashboard or API');
    console.log('  2. Start accepting affiliate applications');
    console.log('  3. Integrate affiliate tracking into your site');
    console.log('  4. Monitor performance and approve applications');
    
  } catch (error) {
    console.error('❌ Error initializing affiliate tables:', error);
    process.exit(1);
  }
}

main();

