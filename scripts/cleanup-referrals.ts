/**
 * Referral Database Cleanup Script
 * Run periodically to maintain data integrity
 * 
 * Usage: npm run cleanup:referrals
 */

import { runFullCleanup } from '../lib/db/referral-cleanup';

console.log('🧹 Referral Database Cleanup\n');
console.log('This script removes orphaned records from the referral system.\n');

try {
  const results = runFullCleanup();
  
  const totalDeleted = results.deletedCodes + results.deletedConversions + 
                      results.deletedRewards + results.deletedClicks;
  
  if (totalDeleted === 0) {
    console.log('\n✨ Database is clean - no orphaned records found!');
  } else {
    console.log(`\n⚠️  Removed ${totalDeleted} orphaned record(s)`);
    console.log('💡 Recommendation: Run this cleanup weekly');
  }
} catch (error: any) {
  console.error('\n❌ Error during cleanup:', error.message);
  process.exit(1);
}

