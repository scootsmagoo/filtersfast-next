/**
 * Loyalty Program Database Functions
 * Handles all loyalty points-related database operations
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type {
  LoyaltySettings,
  LoyaltyPoints,
  LoyaltyTransaction,
  LoyaltyTier,
  EarnPointsRequest,
  RedeemPointsRequest,
  AdjustPointsRequest,
} from '@/lib/types/loyalty';

const getDb = () => {
  // Use relative path like other database files (gift-cards.ts, customers.ts, etc.)
  // This ensures consistency and works correctly in Next.js API routes
  return new Database('filtersfast.db');
};

/**
 * Get or create loyalty points account for a customer
 */
export function getOrCreateLoyaltyAccount(
  customerEmail: string,
  userId?: string
): LoyaltyPoints {
  const db = getDb();

  try {
    // Check if account exists
    let stmt = db.prepare('SELECT * FROM loyalty_points WHERE customer_email = ?');
    let account = stmt.get(customerEmail) as LoyaltyPoints | undefined;

    if (!account) {
      // Create new account
      const accountId = `loyalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // Get default tier
      let defaultTier: LoyaltyTier | undefined;
      try {
        const tierStmt = db.prepare('SELECT * FROM loyalty_tiers WHERE tier_level = 1');
        defaultTier = tierStmt.get() as LoyaltyTier | undefined;
      } catch (tierError: any) {
        console.error(`[getOrCreateLoyaltyAccount] Error querying loyalty_tiers - Code: ${tierError?.code}, Message: ${tierError?.message}`);
        // If it's a "no such table" error, let it bubble up
        if (tierError?.code === 'SQLITE_ERROR' && tierError?.message?.toLowerCase().includes('no such table')) {
          throw tierError;
        }
        // Otherwise, continue with default values
        defaultTier = undefined;
      }

      stmt = db.prepare(`
        INSERT INTO loyalty_points (
          id, user_id, customer_email, points_balance, lifetime_points,
          tier_level, tier_name, last_activity_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        accountId,
        userId || null,
        customerEmail,
        0,
        0,
        defaultTier?.tier_level || 1,
        defaultTier?.tier_name || 'Bronze',
        now,
        now,
        now
      );

      // Fetch the newly created account
      stmt = db.prepare('SELECT * FROM loyalty_points WHERE id = ?');
      account = stmt.get(accountId) as LoyaltyPoints;
    }

    return account;
  } catch (error: any) {
    // Check if tables don't exist
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    console.error(`[getOrCreateLoyaltyAccount] Database error - Code: ${errorCode}, Message: ${errorMsg}`);
    
    // Only throw "not initialized" error if it's actually a "no such table" error
    if (errorCode === 'SQLITE_ERROR' && errorMsg && errorMsg.toLowerCase().includes('no such table')) {
      throw new Error(`Loyalty program database tables not initialized. Please run: npm run init:loyalty`);
    }
    // Re-throw the original error for any other database errors
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get loyalty points account by email
 */
export function getLoyaltyAccountByEmail(customerEmail: string): LoyaltyPoints | null {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM loyalty_points WHERE customer_email = ?');
    const account = stmt.get(customerEmail) as LoyaltyPoints | undefined;
    return account || null;
  } catch (error: any) {
    // Check if tables don't exist
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    console.error(`[getLoyaltyAccountByEmail] Database error - Code: ${errorCode}, Message: ${errorMsg}`);
    
    // Only throw "not initialized" error if it's actually a "no such table" error
    if (errorCode === 'SQLITE_ERROR' && errorMsg && errorMsg.toLowerCase().includes('no such table')) {
      throw new Error(`Loyalty program database tables not initialized. Please run: npm run init:loyalty`);
    }
    // Re-throw the original error for any other database errors
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get loyalty points account by user ID
 */
export function getLoyaltyAccountByUserId(userId: string): LoyaltyPoints | null {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM loyalty_points WHERE user_id = ?');
    const account = stmt.get(userId) as LoyaltyPoints | undefined;
    return account || null;
  } catch (error: any) {
    // Check if tables don't exist
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    console.error(`[getLoyaltyAccountByUserId] Database error - Code: ${errorCode}, Message: ${errorMsg}`);
    
    // Only throw "not initialized" error if it's actually a "no such table" error
    if (errorCode === 'SQLITE_ERROR' && errorMsg && errorMsg.toLowerCase().includes('no such table')) {
      throw new Error(`Loyalty program database tables not initialized. Please run: npm run init:loyalty`);
    }
    // Re-throw the original error for any other database errors
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get loyalty program settings
 */
export function getLoyaltySettings(): LoyaltySettings {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM loyalty_settings WHERE id = ?');
    const settings = stmt.get('default') as LoyaltySettings | undefined;

    if (!settings) {
      // Return default settings if not found
      return {
        id: 'default',
        is_enabled: 1,
        points_per_dollar: 1.0,
        points_per_review: 50,
        points_per_referral: 100,
        points_per_birthday: 200,
        min_redeem_amount: 100,
        redemption_rate: 100,
        expiration_days: null,
        tier_enabled: 1,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
    }

    return settings;
  } catch (error: any) {
    // Check if tables don't exist
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    console.error(`[getLoyaltySettings] Database error - Code: ${errorCode}, Message: ${errorMsg}, Type: ${typeof error}, Constructor: ${error?.constructor?.name}`);
    
    // Only throw "not initialized" error if it's actually a "no such table" error
    if (errorCode === 'SQLITE_ERROR' && errorMsg && errorMsg.toLowerCase().includes('no such table')) {
      throw new Error(`Loyalty program database tables not initialized. Please run: npm run init:loyalty`);
    }
    // If it's a different error, return default settings as fallback
    return {
      id: 'default',
      is_enabled: 1,
      points_per_dollar: 1.0,
      points_per_review: 50,
      points_per_referral: 100,
      points_per_birthday: 200,
      min_redeem_amount: 100,
      redemption_rate: 100,
      expiration_days: null,
      tier_enabled: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
  } finally {
    db.close();
  }
}

/**
 * Update loyalty program settings
 */
export function updateLoyaltySettings(settings: Partial<LoyaltySettings>): boolean {
  const db = getDb();

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (settings.is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      values.push(settings.is_enabled);
    }
    if (settings.points_per_dollar !== undefined) {
      updates.push('points_per_dollar = ?');
      values.push(settings.points_per_dollar);
    }
    if (settings.points_per_review !== undefined) {
      updates.push('points_per_review = ?');
      values.push(settings.points_per_review);
    }
    if (settings.points_per_referral !== undefined) {
      updates.push('points_per_referral = ?');
      values.push(settings.points_per_referral);
    }
    if (settings.points_per_birthday !== undefined) {
      updates.push('points_per_birthday = ?');
      values.push(settings.points_per_birthday);
    }
    if (settings.min_redeem_amount !== undefined) {
      updates.push('min_redeem_amount = ?');
      values.push(settings.min_redeem_amount);
    }
    if (settings.redemption_rate !== undefined) {
      updates.push('redemption_rate = ?');
      values.push(settings.redemption_rate);
    }
    if (settings.expiration_days !== undefined) {
      updates.push('expiration_days = ?');
      values.push(settings.expiration_days);
    }
    if (settings.tier_enabled !== undefined) {
      updates.push('tier_enabled = ?');
      values.push(settings.tier_enabled);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push('default');

    const stmt = db.prepare(`
      UPDATE loyalty_settings
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Earn loyalty points
 */
export function earnLoyaltyPoints(request: EarnPointsRequest): LoyaltyTransaction {
  const db = getDb();

  try {
    db.exec('BEGIN TRANSACTION');

    // Get or create account
    const account = getOrCreateLoyaltyAccount(request.customerEmail, request.userId);

    // Get settings
    const settings = getLoyaltySettings();

    if (!settings.is_enabled) {
      throw new Error('Loyalty program is disabled');
    }

    // Calculate points with tier multiplier if applicable
    let pointsToEarn = request.points;
    if (settings.tier_enabled && account.tier_level > 1) {
      const tierStmt = db.prepare('SELECT points_multiplier FROM loyalty_tiers WHERE tier_level = ?');
      const tier = tierStmt.get(account.tier_level) as { points_multiplier: number } | undefined;
      if (tier) {
        pointsToEarn = Math.floor(request.points * tier.points_multiplier);
      }
    }

    // Calculate expiration if enabled
    let expiresAt: number | null = null;
    if (settings.expiration_days) {
      expiresAt = Date.now() + settings.expiration_days * 24 * 60 * 60 * 1000;
    }

    // Update account balance
    const newBalance = account.points_balance + pointsToEarn;
    const newLifetime = account.lifetime_points + pointsToEarn;
    const now = Date.now();

    const updateStmt = db.prepare(`
      UPDATE loyalty_points
      SET points_balance = ?, lifetime_points = ?, last_activity_at = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(newBalance, newLifetime, now, now, account.id);

    // Check and update tier if applicable
    if (settings.tier_enabled) {
      updateTierForAccount(account.id, newLifetime);
    }

    // Create transaction record
    const transactionId = `loyalty_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionStmt = db.prepare(`
      INSERT INTO loyalty_transactions (
        id, loyalty_points_id, user_id, customer_email, transaction_type,
        points, balance_before, balance_after, order_id, order_number,
        description, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    transactionStmt.run(
      transactionId,
      account.id,
      request.userId || null,
      request.customerEmail,
      'earned',
      pointsToEarn,
      account.points_balance,
      newBalance,
      request.orderId || null,
      request.orderNumber || null,
      request.description || `Earned ${pointsToEarn} points`,
      expiresAt,
      now
    );

    db.exec('COMMIT');

    // Fetch and return transaction
    const fetchStmt = db.prepare('SELECT * FROM loyalty_transactions WHERE id = ?');
    return fetchStmt.get(transactionId) as LoyaltyTransaction;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Redeem loyalty points
 */
export function redeemLoyaltyPoints(request: RedeemPointsRequest): LoyaltyTransaction {
  const db = getDb();

  try {
    db.exec('BEGIN TRANSACTION');

    // Get account
    const account = getOrCreateLoyaltyAccount(request.customerEmail, request.userId);

    // Get settings
    const settings = getLoyaltySettings();

    if (!settings.is_enabled) {
      throw new Error('Loyalty program is disabled');
    }

    // Validate minimum redemption amount
    if (request.points < settings.min_redeem_amount) {
      throw new Error(`Minimum redemption is ${settings.min_redeem_amount} points`);
    }

    // Validate sufficient balance
    if (account.points_balance < request.points) {
      throw new Error('Insufficient points balance');
    }

    // Calculate discount amount
    const discountAmount = (request.points / settings.redemption_rate).toFixed(2);

    // Update account balance
    const newBalance = account.points_balance - request.points;
    const now = Date.now();

    const updateStmt = db.prepare(`
      UPDATE loyalty_points
      SET points_balance = ?, last_activity_at = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(newBalance, now, now, account.id);

    // Create transaction record
    const transactionId = `loyalty_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionStmt = db.prepare(`
      INSERT INTO loyalty_transactions (
        id, loyalty_points_id, user_id, customer_email, transaction_type,
        points, balance_before, balance_after, order_id, order_number,
        description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    transactionStmt.run(
      transactionId,
      account.id,
      request.userId || null,
      request.customerEmail,
      'redeemed',
      -request.points,
      account.points_balance,
      newBalance,
      request.orderId || null,
      request.orderNumber || null,
      request.description || `Redeemed ${request.points} points for $${discountAmount} discount`,
      now
    );

    db.exec('COMMIT');

    // Fetch and return transaction
    const fetchStmt = db.prepare('SELECT * FROM loyalty_transactions WHERE id = ?');
    return fetchStmt.get(transactionId) as LoyaltyTransaction;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Adjust loyalty points (admin function)
 */
export function adjustLoyaltyPoints(request: AdjustPointsRequest): LoyaltyTransaction {
  const db = getDb();

  try {
    db.exec('BEGIN TRANSACTION');

    // Get account
    const account = getOrCreateLoyaltyAccount(request.customerEmail, request.userId);

    // Update account balance
    const newBalance = account.points_balance + request.points;
    const newLifetime = request.points > 0 
      ? account.lifetime_points + request.points 
      : account.lifetime_points;
    const now = Date.now();

    if (newBalance < 0) {
      throw new Error('Cannot adjust points below zero');
    }

    const updateStmt = db.prepare(`
      UPDATE loyalty_points
      SET points_balance = ?, lifetime_points = ?, last_activity_at = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(newBalance, newLifetime, now, now, account.id);

    // Create transaction record
    const transactionId = `loyalty_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionStmt = db.prepare(`
      INSERT INTO loyalty_transactions (
        id, loyalty_points_id, user_id, customer_email, transaction_type,
        points, balance_before, balance_after, description,
        performed_by_id, performed_by_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    transactionStmt.run(
      transactionId,
      account.id,
      request.userId || null,
      request.customerEmail,
      'adjusted',
      request.points,
      account.points_balance,
      newBalance,
      request.description || `Points adjusted by ${request.points > 0 ? '+' : ''}${request.points}`,
      request.performedBy?.id || null,
      request.performedBy?.name || 'Admin',
      now
    );

    db.exec('COMMIT');

    // Fetch and return transaction
    const fetchStmt = db.prepare('SELECT * FROM loyalty_transactions WHERE id = ?');
    return fetchStmt.get(transactionId) as LoyaltyTransaction;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get loyalty transactions for a customer
 */
export function getLoyaltyTransactions(
  customerEmail: string,
  limit: number = 50,
  offset: number = 0
): LoyaltyTransaction[] {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT * FROM loyalty_transactions
      WHERE customer_email = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(customerEmail, limit, offset) as LoyaltyTransaction[];
  } catch (error: any) {
    // Check if tables don't exist
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    console.error(`[getLoyaltyTransactions] Database error - Code: ${errorCode}, Message: ${errorMsg}, Type: ${typeof error}, Constructor: ${error?.constructor?.name}`);
    
    // Only throw "not initialized" error if it's actually a "no such table" error
    if (errorCode === 'SQLITE_ERROR' && errorMsg && errorMsg.toLowerCase().includes('no such table')) {
      throw new Error(`Loyalty program database tables not initialized. Please run: npm run init:loyalty`);
    }
    // Re-throw the original error for any other database errors
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get all loyalty tiers
 */
export function getLoyaltyTiers(): LoyaltyTier[] {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM loyalty_tiers ORDER BY tier_level ASC');
    return stmt.all() as LoyaltyTier[];
  } catch (error: any) {
    // Check if tables don't exist
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    console.error(`[getLoyaltyTiers] Database error - Code: ${errorCode}, Message: ${errorMsg}, Type: ${typeof error}, Constructor: ${error?.constructor?.name}`);
    
    // Only throw "not initialized" error if it's actually a "no such table" error
    if (errorCode === 'SQLITE_ERROR' && errorMsg && errorMsg.toLowerCase().includes('no such table')) {
      throw new Error(`Loyalty program database tables not initialized. Please run: npm run init:loyalty`);
    }
    // Return empty array if error (fallback for other errors)
    return [];
  } finally {
    db.close();
  }
}

/**
 * Update tier for an account based on lifetime points
 */
function updateTierForAccount(accountId: string, lifetimePoints: number): void {
  const db = getDb();

  try {
    const tierStmt = db.prepare(`
      SELECT * FROM loyalty_tiers
      WHERE min_points <= ? AND (max_points IS NULL OR max_points >= ?)
      ORDER BY tier_level DESC
      LIMIT 1
    `);
    const tier = tierStmt.get(lifetimePoints, lifetimePoints) as LoyaltyTier | undefined;

    if (tier) {
      const updateStmt = db.prepare(`
        UPDATE loyalty_points
        SET tier_level = ?, tier_name = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(tier.tier_level, tier.tier_name, Date.now(), accountId);
    }
  } finally {
    db.close();
  }
}

/**
 * Get loyalty program statistics
 */
export function getLoyaltyStats(): {
  totalAccounts: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeAccounts: number;
} {
  const db = getDb();

  try {
    const accountsStmt = db.prepare(`
      SELECT 
        COUNT(*) as totalAccounts,
        SUM(CASE WHEN points_balance > 0 THEN 1 ELSE 0 END) as activeAccounts,
        SUM(lifetime_points) as totalPointsIssued
      FROM loyalty_points
    `);
    const accounts = accountsStmt.get() as {
      totalAccounts: number;
      activeAccounts: number;
      totalPointsIssued: number;
    };

    const redeemedStmt = db.prepare(`
      SELECT SUM(ABS(points)) as totalPointsRedeemed
      FROM loyalty_transactions
      WHERE transaction_type = 'redeemed'
    `);
    const redeemed = redeemedStmt.get() as { totalPointsRedeemed: number | null };

    return {
      totalAccounts: accounts.totalAccounts || 0,
      totalPointsIssued: accounts.totalPointsIssued || 0,
      totalPointsRedeemed: redeemed.totalPointsRedeemed || 0,
      activeAccounts: accounts.activeAccounts || 0,
    };
  } finally {
    db.close();
  }
}

