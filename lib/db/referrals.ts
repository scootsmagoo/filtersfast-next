/**
 * Referral Program Database Functions
 * 
 * Manages customer referral codes, tracking, conversions, and rewards
 */

import Database from 'better-sqlite3';
import { 
  ReferralCode,
  ReferralClick,
  ReferralConversion,
  ReferralReward,
  ReferralSettings,
  ReferralStats,
  UserReferralStats,
  CreateReferralCodeInput,
  UpdateReferralCodeInput,
  TrackReferralClickInput,
  CreateReferralConversionInput,
  ShareAnalytics,
  TrackSocialShareInput
} from '@/lib/types/referral';

const db = new Database('filtersfast.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Generate a unique referral code
 */
function generateReferralCode(userName: string, existingCodes: string[]): string {
  // Clean and format name for code
  const cleanName = userName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  // Try base code first
  let code = cleanName + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  let attempts = 0;
  
  // Keep trying until we get a unique code
  while (existingCodes.includes(code) && attempts < 100) {
    code = cleanName + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    attempts++;
  }
  
  return code;
}

/**
 * Create or get referral code for a user
 */
export function createReferralCode(input: CreateReferralCodeInput): ReferralCode {
  const now = new Date().toISOString();
  const id = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Check if user already has a referral code
  const existing = db.prepare(`
    SELECT * FROM referral_codes WHERE user_id = ?
  `).get(input.user_id) as ReferralCode | undefined;
  
  if (existing) {
    return {
      ...existing,
      active: Boolean(existing.active)
    };
  }
  
  // Get user name for code generation from auth.db
  // Security: Validate user exists to prevent orphaned records
  const user = (() => {
    const authDb = new Database('auth.db');
    try {
      const u = authDb.prepare('SELECT name, email FROM user WHERE id = ?')
        .get(input.user_id) as { name: string | null; email: string } | undefined;
      authDb.close();
      if (!u) {
        throw new Error('User not found - cannot create referral code');
      }
      return u;
    } catch (error) {
      authDb.close();
      throw error;
    }
  })();
  
  // Get all existing codes
  const existingCodes = db.prepare('SELECT code FROM referral_codes')
    .all()
    .map((r: any) => r.code);
  
  // Generate unique code
  const code = input.code || generateReferralCode(user.name || user.email, existingCodes);
  
  // Validate custom code if provided
  if (input.code && existingCodes.includes(input.code)) {
    throw new Error('Referral code already exists');
  }
  
  // Insert referral code
  db.prepare(`
    INSERT INTO referral_codes (
      id, user_id, code, clicks, conversions, total_revenue, 
      total_rewards, active, created_at, updated_at
    ) VALUES (?, ?, ?, 0, 0, 0, 0, 1, ?, ?)
  `).run(id, input.user_id, code, now, now);
  
  const newCode = getReferralCodeById(id);
  if (!newCode) {
    throw new Error('Failed to create referral code');
  }
  
  return newCode;
}

/**
 * Get referral code by ID
 */
export function getReferralCodeById(id: string): ReferralCode | null {
  const code = db.prepare(`
    SELECT * FROM referral_codes WHERE id = ?
  `).get(id) as any;
  
  if (!code) return null;
  
  return {
    ...code,
    active: Boolean(code.active)
  };
}

/**
 * Get referral code by code string
 */
export function getReferralCodeByCode(code: string): ReferralCode | null {
  const result = db.prepare(`
    SELECT * FROM referral_codes WHERE code = ? COLLATE NOCASE
  `).get(code) as any;
  
  if (!result) return null;
  
  return {
    ...result,
    active: Boolean(result.active)
  };
}

/**
 * Get referral code by user ID
 */
export function getReferralCodeByUserId(userId: string): ReferralCode | null {
  const result = db.prepare(`
    SELECT * FROM referral_codes WHERE user_id = ?
  `).get(userId) as any;
  
  if (!result) return null;
  
  return {
    ...result,
    active: Boolean(result.active)
  };
}

/**
 * Update referral code
 */
export function updateReferralCode(id: string, input: UpdateReferralCodeInput): ReferralCode {
  const now = new Date().toISOString();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.active !== undefined) {
    updates.push('active = ?');
    values.push(input.active ? 1 : 0);
  }
  
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  db.prepare(`
    UPDATE referral_codes SET ${updates.join(', ')} WHERE id = ?
  `).run(...values);
  
  const updatedCode = getReferralCodeById(id);
  if (!updatedCode) {
    throw new Error('Referral code not found after update');
  }
  
  return updatedCode;
}

/**
 * Track referral click
 */
export function trackReferralClick(input: TrackReferralClickInput): ReferralClick {
  const now = new Date().toISOString();
  const id = `click_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Get referral code
  const refCode = getReferralCodeByCode(input.referral_code);
  if (!refCode || !refCode.active) {
    throw new Error('Invalid or inactive referral code');
  }
  
  // Insert click
  db.prepare(`
    INSERT INTO referral_clicks (
      id, referral_code_id, referral_code, ip_address, user_agent,
      referrer_url, landing_page, converted, clicked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    id,
    refCode.id,
    refCode.code,
    input.ip_address || null,
    input.user_agent || null,
    input.referrer_url || null,
    input.landing_page || null,
    now
  );
  
  // Increment click count
  db.prepare(`
    UPDATE referral_codes SET clicks = clicks + 1, updated_at = ? WHERE id = ?
  `).run(now, refCode.id);
  
  return {
    id,
    referral_code_id: refCode.id,
    referral_code: refCode.code,
    ip_address: input.ip_address || null,
    user_agent: input.user_agent || null,
    referrer_url: input.referrer_url || null,
    landing_page: input.landing_page || null,
    converted: false,
    conversion_order_id: null,
    clicked_at: now
  };
}

/**
 * Create referral conversion
 */
export function createReferralConversion(input: CreateReferralConversionInput): ReferralConversion {
  const now = new Date().toISOString();
  const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Get referral code
  const refCode = getReferralCodeByCode(input.referral_code);
  if (!refCode || !refCode.active) {
    throw new Error('Invalid or inactive referral code');
  }
  
  // Get settings
  const settings = getReferralSettings();
  
  // Check minimum order value
  if (input.order_total < settings.minimum_order_value) {
    throw new Error(`Order must be at least $${settings.minimum_order_value} to qualify for referral reward`);
  }
  
  // Calculate rewards
  let referrerReward = 0;
  if (settings.referrer_reward_type === 'fixed') {
    referrerReward = settings.referrer_reward_amount;
  } else if (settings.referrer_reward_type === 'percentage') {
    referrerReward = input.order_total * (settings.referrer_reward_amount / 100);
  } else {
    referrerReward = settings.referrer_reward_amount; // credit
  }
  
  let referredDiscount = 0;
  if (settings.referred_discount_type === 'fixed') {
    referredDiscount = settings.referred_discount_amount;
  } else {
    referredDiscount = input.order_total * (settings.referred_discount_amount / 100);
  }
  
  // Insert conversion
  db.prepare(`
    INSERT INTO referral_conversions (
      id, referral_code_id, referral_code, referrer_user_id, referred_user_id,
      order_id, order_total, referrer_reward, referred_discount, 
      reward_status, converted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    refCode.id,
    refCode.code,
    refCode.user_id,
    input.referred_user_id || null,
    input.order_id,
    input.order_total,
    referrerReward,
    referredDiscount,
    now
  );
  
  // Update referral code stats
  db.prepare(`
    UPDATE referral_codes 
    SET conversions = conversions + 1,
        total_revenue = total_revenue + ?,
        total_rewards = total_rewards + ?,
        updated_at = ?
    WHERE id = ?
  `).run(input.order_total, referrerReward, now, refCode.id);
  
  // Mark click as converted if exists
  db.prepare(`
    UPDATE referral_clicks 
    SET converted = 1, conversion_order_id = ?
    WHERE referral_code_id = ? AND converted = 0
    ORDER BY clicked_at DESC
    LIMIT 1
  `).run(input.order_id, refCode.id);
  
  return {
    id,
    referral_code_id: refCode.id,
    referral_code: refCode.code,
    referrer_user_id: refCode.user_id,
    referred_user_id: input.referred_user_id || null,
    order_id: input.order_id,
    order_total: input.order_total,
    referrer_reward: referrerReward,
    referred_discount: referredDiscount,
    reward_status: 'pending',
    converted_at: now,
    processed_at: null
  };
}

/**
 * Get user referral statistics
 */
export function getUserReferralStats(userId: string): UserReferralStats {
  try {
    const refCode = getReferralCodeByUserId(userId);
    
    if (!refCode) {
      // Return empty stats if no referral code
      return {
        referral_code: '',
        total_clicks: 0,
        total_conversions: 0,
        conversion_rate: 0,
        total_revenue: 0,
        total_rewards_earned: 0,
        pending_rewards: 0,
        available_rewards: 0,
        recent_referrals: []
      };
    }
    
    // Get recent conversions
    const recentConversions = db.prepare(`
      SELECT 
        order_id,
        order_total,
        referrer_reward as reward_amount,
        reward_status as status,
        converted_at,
        referred_user_id
      FROM referral_conversions
      WHERE referrer_user_id = ?
      ORDER BY converted_at DESC
      LIMIT 10
    `).all(userId) as any[];
    
    // Get user emails from auth.db (only if there are conversions)
    let conversionsWithEmails: any[] = [];
    
    if (recentConversions.length > 0) {
      try {
        const authDb = new Database('auth.db');
        conversionsWithEmails = recentConversions.map(conv => {
          const email = conv.referred_user_id 
            ? (authDb.prepare('SELECT email FROM user WHERE id = ?').get(conv.referred_user_id) as any)?.email
            : null;
          return {
            order_id: conv.order_id,
            order_total: conv.order_total,
            reward_amount: conv.reward_amount,
            status: conv.status,
            converted_at: conv.converted_at,
            referred_email: email || 'Guest'
          };
        });
        authDb.close();
      } catch (dbError) {
        console.error('Error fetching user emails:', dbError);
        // Fallback to conversions without emails
        conversionsWithEmails = recentConversions.map(conv => ({
          order_id: conv.order_id,
          order_total: conv.order_total,
          reward_amount: conv.reward_amount,
          status: conv.status,
          converted_at: conv.converted_at,
          referred_email: 'Guest'
        }));
      }
    }
    
    // Calculate pending and available rewards
    const rewardStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN reward_status = 'pending' THEN referrer_reward ELSE 0 END) as pending,
        SUM(CASE WHEN reward_status = 'approved' THEN referrer_reward ELSE 0 END) as available
      FROM referral_conversions
      WHERE referrer_user_id = ?
    `).get(userId) as any;
    
    return {
      referral_code: refCode.code,
      total_clicks: refCode.clicks,
      total_conversions: refCode.conversions,
      conversion_rate: refCode.clicks > 0 ? (refCode.conversions / refCode.clicks) * 100 : 0,
      total_revenue: refCode.total_revenue,
      total_rewards_earned: refCode.total_rewards,
      pending_rewards: rewardStats?.pending || 0,
      available_rewards: rewardStats?.available || 0,
      recent_referrals: conversionsWithEmails
    };
  } catch (error) {
    console.error('Error in getUserReferralStats:', error);
    throw error;
  }
}

/**
 * Get all referral codes (admin)
 */
export function getAllReferralCodes(limit = 100, offset = 0): any[] {
  const codes = db.prepare(`
    SELECT *
    FROM referral_codes
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];
  
  // Get user data from auth.db separately (only if there are codes)
  if (codes.length === 0) {
    return [];
  }
  
  const authDb = new Database('auth.db');
  const codesWithUserData = codes.map(code => {
    const user = authDb.prepare('SELECT email, name FROM user WHERE id = ?').get(code.user_id) as any;
    return {
      ...code,
      email: user?.email || 'Unknown',
      name: user?.name || 'Unknown',
      active: Boolean(code.active)
    };
  });
  authDb.close();
  
  return codesWithUserData;
}

/**
 * Get referral statistics (admin)
 */
export function getReferralStats(): ReferralStats {
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT rc.id) as total_codes,
      SUM(rc.clicks) as total_clicks,
      SUM(rc.conversions) as total_conversions,
      SUM(rc.total_revenue) as total_revenue,
      SUM(rc.total_rewards) as total_rewards
    FROM referral_codes rc
  `).get() as any;
  
  const pendingRewards = db.prepare(`
    SELECT SUM(referrer_reward) as pending
    FROM referral_conversions
    WHERE reward_status = 'pending'
  `).get() as any;
  
  const activeReferrers = db.prepare(`
    SELECT COUNT(DISTINCT referrer_user_id) as count
    FROM referral_conversions
    WHERE converted_at > datetime('now', '-30 days')
  `).get() as any;
  
  const recentConversions = db.prepare(`
    SELECT *
    FROM referral_conversions
    ORDER BY converted_at DESC
    LIMIT 10
  `).all() as any[];
  
  // Get user data from auth.db separately (only if there are conversions)
  let conversionsWithUserData = recentConversions;
  if (recentConversions.length > 0) {
    const authDb = new Database('auth.db');
    conversionsWithUserData = recentConversions.map(conv => {
      const referrerUser = authDb.prepare('SELECT email FROM user WHERE id = ?').get(conv.referrer_user_id) as any;
      const referredUser = conv.referred_user_id 
        ? authDb.prepare('SELECT email FROM user WHERE id = ?').get(conv.referred_user_id) as any
        : null;
      return {
        ...conv,
        referrer_email: referrerUser?.email || 'Unknown',
        referred_email: referredUser?.email || null
      };
    });
    authDb.close();
  }
  
  return {
    total_clicks: stats?.total_clicks || 0,
    total_conversions: stats?.total_conversions || 0,
    conversion_rate: stats?.total_clicks > 0 ? (stats.total_conversions / stats.total_clicks) * 100 : 0,
    total_revenue: stats?.total_revenue || 0,
    total_rewards: stats?.total_rewards || 0,
    pending_rewards: pendingRewards?.pending || 0,
    active_referrers: activeReferrers?.count || 0,
    recent_conversions: conversionsWithUserData
  };
}

/**
 * Get referral settings
 */
export function getReferralSettings(): ReferralSettings {
  const settings = db.prepare(`
    SELECT * FROM referral_settings WHERE id = 'default'
  `).get() as any;
  
  if (!settings) {
    throw new Error('Referral settings not found');
  }
  
  return {
    ...settings,
    enabled: Boolean(settings.enabled)
  };
}

/**
 * Update referral settings (admin)
 */
export function updateReferralSettings(settings: Partial<ReferralSettings>): ReferralSettings {
  const now = new Date().toISOString();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (settings.enabled !== undefined) {
    updates.push('enabled = ?');
    values.push(settings.enabled ? 1 : 0);
  }
  if (settings.referrer_reward_type) {
    updates.push('referrer_reward_type = ?');
    values.push(settings.referrer_reward_type);
  }
  if (settings.referrer_reward_amount !== undefined) {
    updates.push('referrer_reward_amount = ?');
    values.push(settings.referrer_reward_amount);
  }
  if (settings.referred_discount_type) {
    updates.push('referred_discount_type = ?');
    values.push(settings.referred_discount_type);
  }
  if (settings.referred_discount_amount !== undefined) {
    updates.push('referred_discount_amount = ?');
    values.push(settings.referred_discount_amount);
  }
  if (settings.minimum_order_value !== undefined) {
    updates.push('minimum_order_value = ?');
    values.push(settings.minimum_order_value);
  }
  if (settings.reward_delay_days !== undefined) {
    updates.push('reward_delay_days = ?');
    values.push(settings.reward_delay_days);
  }
  if (settings.terms_text !== undefined) {
    updates.push('terms_text = ?');
    values.push(settings.terms_text);
  }
  
  updates.push('updated_at = ?');
  values.push(now);
  
  if (updates.length === 0) {
    return getReferralSettings();
  }
  
  db.prepare(`
    UPDATE referral_settings SET ${updates.join(', ')} WHERE id = 'default'
  `).run(...values);
  
  return getReferralSettings();
}

/**
 * Track social share
 */
export function trackSocialShare(input: TrackSocialShareInput): ShareAnalytics {
  const now = new Date().toISOString();
  const id = `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  db.prepare(`
    INSERT INTO social_share_analytics (
      id, user_id, share_type, share_platform, shared_url,
      product_id, referral_code, ip_address, shared_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.user_id || null,
    input.share_type,
    input.share_platform,
    input.shared_url,
    input.product_id || null,
    input.referral_code || null,
    input.ip_address || null,
    now
  );
  
  return {
    id,
    user_id: input.user_id || null,
    share_type: input.share_type,
    share_platform: input.share_platform,
    shared_url: input.shared_url,
    product_id: input.product_id || null,
    referral_code: input.referral_code || null,
    ip_address: input.ip_address || null,
    shared_at: now
  };
}

/**
 * Get social share analytics
 */
export function getSocialShareAnalytics(days = 30) {
  return db.prepare(`
    SELECT 
      share_platform,
      share_type,
      COUNT(*) as count
    FROM social_share_analytics
    WHERE shared_at > datetime('now', '-' || ? || ' days')
    GROUP BY share_platform, share_type
    ORDER BY count DESC
  `).all(days);
}

/**
 * Process pending rewards (run periodically)
 */
export function processPendingRewards(): number {
  const now = new Date().toISOString();
  const settings = getReferralSettings();
  
  // Get conversions ready to be approved (past delay period)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.reward_delay_days);
  
  const result = db.prepare(`
    UPDATE referral_conversions
    SET reward_status = 'approved', processed_at = ?
    WHERE reward_status = 'pending'
    AND converted_at <= ?
  `).run(now, cutoffDate.toISOString());
  
  return result.changes;
}

