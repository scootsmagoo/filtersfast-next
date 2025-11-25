import Database from 'better-sqlite3';
import { logger } from '@/lib/logger';

const dbPath = process.env.DATABASE_URL || './filtersfast.db';

export interface PushSubscription {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at: number;
  updated_at: number;
}

export interface PushNotificationPreferences {
  id: number;
  user_id: string;
  order_updates: number;
  deals_promotions: number;
  abandoned_carts: number;
  back_in_stock: number;
  created_at: number;
  updated_at: number;
}

/**
 * Get database connection
 */
function getDb() {
  return new Database(dbPath);
}

/**
 * Save push subscription for a user
 */
export function savePushSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userAgent?: string
): PushSubscription | null {
  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string' || userId.length > 100) {
      logger.error('Invalid userId provided to savePushSubscription');
      return null;
    }
    if (!subscription?.endpoint || typeof subscription.endpoint !== 'string' || subscription.endpoint.length > 2000) {
      logger.error('Invalid endpoint provided to savePushSubscription');
      return null;
    }
    if (!subscription?.keys?.p256dh || typeof subscription.keys.p256dh !== 'string' || subscription.keys.p256dh.length > 200) {
      logger.error('Invalid p256dh key provided to savePushSubscription');
      return null;
    }
    if (!subscription?.keys?.auth || typeof subscription.keys.auth !== 'string' || subscription.keys.auth.length > 200) {
      logger.error('Invalid auth key provided to savePushSubscription');
      return null;
    }

    const db = getDb();
    
    // Check if subscription already exists (parameterized query prevents SQL injection)
    const existing = db
      .prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?')
      .get(subscription.endpoint) as PushSubscription | undefined;

    if (existing) {
      // Update existing subscription
      db.prepare(
        `UPDATE push_subscriptions 
         SET user_id = ?, p256dh = ?, auth = ?, user_agent = ?, updated_at = strftime('%s', 'now')
         WHERE endpoint = ?`
      ).run(
        userId,
        subscription.keys.p256dh,
        subscription.keys.auth,
        userAgent || null,
        subscription.endpoint
      );
      
      return db
        .prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?')
        .get(subscription.endpoint) as PushSubscription;
    } else {
      // Insert new subscription
      const result = db
        .prepare(
          `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          userId,
          subscription.endpoint,
          subscription.keys.p256dh,
          subscription.keys.auth,
          userAgent || null
        );

      return db
        .prepare('SELECT * FROM push_subscriptions WHERE id = ?')
        .get(result.lastInsertRowid) as PushSubscription;
    }
  } catch (error) {
    logger.error('Error saving push subscription:', error);
    return null;
  }
}

/**
 * Get push subscriptions for a user
 */
export function getUserPushSubscriptions(userId: string): PushSubscription[] {
  try {
    const db = getDb();
    return db
      .prepare('SELECT * FROM push_subscriptions WHERE user_id = ?')
      .all(userId) as PushSubscription[];
  } catch (error) {
    logger.error('Error getting user push subscriptions:', error);
    return [];
  }
}

/**
 * Delete push subscription by endpoint (only if owned by user)
 */
export function deletePushSubscription(endpoint: string, userId?: string): boolean {
  try {
    // Validate input
    if (!endpoint || typeof endpoint !== 'string' || endpoint.length > 2000) {
      logger.error('Invalid endpoint provided to deletePushSubscription');
      return false;
    }

    const db = getDb();
    
    // If userId provided, verify ownership before deleting
    if (userId) {
      const existing = db
        .prepare('SELECT user_id FROM push_subscriptions WHERE endpoint = ?')
        .get(endpoint) as { user_id: string } | undefined;
      
      if (!existing || existing.user_id !== userId) {
        logger.warn('Attempt to delete subscription not owned by user');
        return false;
      }
    }
    
    const result = db
      .prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
      .run(endpoint);
    return result.changes > 0;
  } catch (error) {
    logger.error('Error deleting push subscription:', error);
    return false;
  }
}

/**
 * Delete all push subscriptions for a user
 */
export function deleteUserPushSubscriptions(userId: string): boolean {
  try {
    const db = getDb();
    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
    return true;
  } catch (error) {
    logger.error('Error deleting user push subscriptions:', error);
    return false;
  }
}

/**
 * Check if user has active push subscription
 */
export function hasActivePushSubscription(userId: string): boolean {
  try {
    const db = getDb();
    const count = db
      .prepare('SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ?')
      .get(userId) as { count: number };
    return count.count > 0;
  } catch (error) {
    logger.error('Error checking push subscription:', error);
    return false;
  }
}

/**
 * Get or create push notification preferences for a user
 */
export function getPushNotificationPreferences(
  userId: string
): PushNotificationPreferences {
  try {
    const db = getDb();
    let preferences = db
      .prepare('SELECT * FROM push_notification_preferences WHERE user_id = ?')
      .get(userId) as PushNotificationPreferences | undefined;

    if (!preferences) {
      // Create default preferences
      const result = db
        .prepare(
          `INSERT INTO push_notification_preferences 
           (user_id, order_updates, deals_promotions, abandoned_carts, back_in_stock)
           VALUES (?, 1, 1, 1, 0)`
        )
        .run(userId);

      preferences = db
        .prepare('SELECT * FROM push_notification_preferences WHERE id = ?')
        .get(result.lastInsertRowid) as PushNotificationPreferences;
    }

    return preferences!;
  } catch (error) {
    logger.error('Error getting push notification preferences:', error);
    // Return default preferences on error
    return {
      id: 0,
      user_id: userId,
      order_updates: 1,
      deals_promotions: 1,
      abandoned_carts: 1,
      back_in_stock: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
  }
}

/**
 * Update push notification preferences
 */
export function updatePushNotificationPreferences(
  userId: string,
  preferences: Partial<{
    order_updates: boolean;
    deals_promotions: boolean;
    abandoned_carts: boolean;
    back_in_stock: boolean;
  }>
): boolean {
  try {
    const db = getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (preferences.order_updates !== undefined) {
      updates.push('order_updates = ?');
      values.push(preferences.order_updates ? 1 : 0);
    }
    if (preferences.deals_promotions !== undefined) {
      updates.push('deals_promotions = ?');
      values.push(preferences.deals_promotions ? 1 : 0);
    }
    if (preferences.abandoned_carts !== undefined) {
      updates.push('abandoned_carts = ?');
      values.push(preferences.abandoned_carts ? 1 : 0);
    }
    if (preferences.back_in_stock !== undefined) {
      updates.push('back_in_stock = ?');
      values.push(preferences.back_in_stock ? 1 : 0);
    }

    if (updates.length === 0) {
      return true;
    }

    updates.push('updated_at = strftime(\'%s\', \'now\')');
    values.push(userId);

    db.prepare(
      `UPDATE push_notification_preferences 
       SET ${updates.join(', ')} 
       WHERE user_id = ?`
    ).run(...values);

    return true;
  } catch (error) {
    logger.error('Error updating push notification preferences:', error);
    return false;
  }
}

/**
 * Log push notification
 */
export function logPushNotification(
  userId: string | null,
  subscriptionId: number | null,
  title: string,
  body: string,
  data?: any,
  status: 'pending' | 'sent' | 'failed' = 'pending',
  errorMessage?: string
): number | null {
  try {
    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO push_notification_log 
         (user_id, subscription_id, title, body, data, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        userId || null,
        subscriptionId || null,
        title,
        body,
        data ? JSON.stringify(data) : null,
        status,
        errorMessage || null
      );
    return result.lastInsertRowid as number;
  } catch (error) {
    logger.error('Error logging push notification:', error);
    return null;
  }
}

/**
 * Get all active push subscriptions (for broadcasting)
 */
export function getAllPushSubscriptions(): PushSubscription[] {
  try {
    const db = getDb();
    return db
      .prepare('SELECT * FROM push_subscriptions')
      .all() as PushSubscription[];
  } catch (error) {
    logger.error('Error getting all push subscriptions:', error);
    return [];
  }
}

