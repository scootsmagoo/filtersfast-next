/**
 * Referral Database Cleanup Functions
 * 
 * Since referral tables are in filtersfast.db and user table is in auth.db,
 * we can't use foreign key constraints. These functions maintain data integrity.
 */

import Database from 'better-sqlite3';

/**
 * Clean up orphaned referral records (users that no longer exist)
 * Run this periodically (e.g., daily cron job)
 */
export function cleanupOrphanedReferrals(): {
  deletedCodes: number;
  deletedConversions: number;
  deletedRewards: number;
} {
  const ffDb = new Database('filtersfast.db');
  const authDb = new Database('auth.db');
  
  try {
    // Get all user IDs from auth.db
    const validUserIds = authDb.prepare('SELECT id FROM user').all().map((u: any) => u.id);
    authDb.close();
    
    // Find orphaned referral codes
    const allReferralCodes = ffDb.prepare('SELECT user_id FROM referral_codes').all();
    const orphanedCodeUserIds = allReferralCodes
      .map((r: any) => r.user_id)
      .filter(uid => !validUserIds.includes(uid));
    
    let deletedCodes = 0;
    if (orphanedCodeUserIds.length > 0) {
      for (const userId of orphanedCodeUserIds) {
        ffDb.prepare('DELETE FROM referral_codes WHERE user_id = ?').run(userId);
        deletedCodes++;
      }
    }
    
    // Find orphaned conversions (referrer doesn't exist)
    const allConversions = ffDb.prepare('SELECT referrer_user_id FROM referral_conversions').all();
    const orphanedConversionUserIds = allConversions
      .map((c: any) => c.referrer_user_id)
      .filter(uid => !validUserIds.includes(uid));
    
    let deletedConversions = 0;
    if (orphanedConversionUserIds.length > 0) {
      for (const userId of orphanedConversionUserIds) {
        ffDb.prepare('DELETE FROM referral_conversions WHERE referrer_user_id = ?').run(userId);
        deletedConversions++;
      }
    }
    
    // Find orphaned rewards
    const allRewards = ffDb.prepare('SELECT user_id FROM referral_rewards').all();
    const orphanedRewardUserIds = allRewards
      .map((r: any) => r.user_id)
      .filter(uid => !validUserIds.includes(uid));
    
    let deletedRewards = 0;
    if (orphanedRewardUserIds.length > 0) {
      for (const userId of orphanedRewardUserIds) {
        ffDb.prepare('DELETE FROM referral_rewards WHERE user_id = ?').run(userId);
        deletedRewards++;
      }
    }
    
    return {
      deletedCodes,
      deletedConversions,
      deletedRewards
    };
  } finally {
    ffDb.close();
  }
}

/**
 * Validate user exists before creating referral code
 */
export function validateUserExists(userId: string): boolean {
  const authDb = new Database('auth.db');
  try {
    const user = authDb.prepare('SELECT id FROM user WHERE id = ?').get(userId);
    return !!user;
  } finally {
    authDb.close();
  }
}

/**
 * Clean up orphaned clicks (referral codes that no longer exist)
 */
export function cleanupOrphanedClicks(): number {
  const ffDb = new Database('filtersfast.db');
  
  try {
    // Get all valid referral code IDs
    const validCodeIds = ffDb.prepare('SELECT id FROM referral_codes').all().map((c: any) => c.id);
    
    // Delete clicks for codes that don't exist
    const allClicks = ffDb.prepare('SELECT id, referral_code_id FROM referral_clicks').all();
    const orphanedClicks = allClicks.filter((click: any) => !validCodeIds.includes(click.referral_code_id));
    
    let deleted = 0;
    for (const click of orphanedClicks) {
      ffDb.prepare('DELETE FROM referral_clicks WHERE id = ?').run((click as any).id);
      deleted++;
    }
    
    return deleted;
  } finally {
    ffDb.close();
  }
}

/**
 * Run all cleanup operations
 */
export function runFullCleanup() {
  console.log('🧹 Running referral database cleanup...\n');
  
  const orphans = cleanupOrphanedReferrals();
  console.log(`✅ Deleted ${orphans.deletedCodes} orphaned referral codes`);
  console.log(`✅ Deleted ${orphans.deletedConversions} orphaned conversions`);
  console.log(`✅ Deleted ${orphans.deletedRewards} orphaned rewards`);
  
  const clicks = cleanupOrphanedClicks();
  console.log(`✅ Deleted ${clicks} orphaned clicks`);
  
  console.log('\n✨ Cleanup complete!');
  
  return {
    ...orphans,
    deletedClicks: clicks
  };
}

