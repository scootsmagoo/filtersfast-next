/**
 * SMS Marketing Database Operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { sanitize } from '../sanitize';
import type {
  SMSSubscription,
  SMSPreferences,
  SMSMessage,
  SMSCampaign,
  SMSAnalytics,
  SubscribeToSMSRequest,
  UpdateSMSPreferencesRequest,
  SMSSubscriptionWithPreferences,
} from '../types/sms';

const dbPath = path.join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Create a new SMS subscription
 */
export function createSMSSubscription(
  userId: number | null,
  data: SubscribeToSMSRequest,
  metadata: { ip?: string; userAgent?: string }
): SMSSubscription | null {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      INSERT INTO sms_subscriptions (
        user_id, phone_number, country_code,
        transactional_opt_in, marketing_opt_in,
        tcpa_consent, tcpa_consent_date,
        subscription_source, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Clean phone number but don't escape it with HTML entities
    const cleanPhone = data.phone_number.replace(/\D/g, ''); // Keep digits only

    const result = stmt.run(
      userId,
      cleanPhone,
      data.country_code || '+1',
      data.transactional_opt_in ? 1 : 0,
      data.marketing_opt_in ? 1 : 0,
      data.tcpa_consent ? 1 : 0,
      data.tcpa_consent ? new Date().toISOString() : null,
      sanitize(data.subscription_source || 'checkout'),
      metadata.ip || null,
      metadata.userAgent ? sanitize(metadata.userAgent) : null
    );

    const subscriptionId = Number(result.lastInsertRowid);

    // Create default preferences
    const prefStmt = db.prepare(`
      INSERT INTO sms_preferences (subscription_id) VALUES (?)
    `);
    prefStmt.run(subscriptionId);

    // Get the subscription back using the same db connection
    const getStmt = db.prepare('SELECT * FROM sms_subscriptions WHERE id = ?');
    const subscription = getStmt.get(subscriptionId) as SMSSubscription | null;

    return subscription;
  } catch (error) {
    console.error('Error creating SMS subscription:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error; // Re-throw so the API can catch and return a better error
  } finally {
    db.close();
  }
}

/**
 * Get SMS subscription by ID
 */
export function getSMSSubscriptionById(id: number): SMSSubscription | null {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM sms_subscriptions WHERE id = ?');
    return stmt.get(id) as SMSSubscription | null;
  } finally {
    db.close();
  }
}

/**
 * Get SMS subscription by phone number
 */
export function getSMSSubscriptionByPhone(phone: string): SMSSubscription | null {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM sms_subscriptions WHERE phone_number = ?');
    return stmt.get(phone) as SMSSubscription | null;
  } finally {
    db.close();
  }
}

/**
 * Get SMS subscription by user ID
 */
export function getSMSSubscriptionByUserId(userId: number): SMSSubscription | null {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM sms_subscriptions WHERE user_id = ?');
    return stmt.get(userId) as SMSSubscription | null;
  } finally {
    db.close();
  }
}

/**
 * Get subscription with preferences
 */
export function getSMSSubscriptionWithPreferences(id: number): SMSSubscriptionWithPreferences | null {
  const db = getDb();

  try {
    const subscription = getSMSSubscriptionById(id);
    if (!subscription) return null;

    const prefStmt = db.prepare('SELECT * FROM sms_preferences WHERE subscription_id = ?');
    const preferences = prefStmt.get(id) as SMSPreferences;

    return {
      ...subscription,
      preferences,
    };
  } finally {
    db.close();
  }
}

/**
 * Update subscription status (subscribe/unsubscribe)
 */
export function updateSMSSubscriptionStatus(
  id: number,
  isSubscribed: boolean
): boolean {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      UPDATE sms_subscriptions
      SET is_subscribed = ?,
          unsubscribed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      isSubscribed ? 1 : 0,
      isSubscribed ? null : new Date().toISOString(),
      id
    );

    return true;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return false;
  } finally {
    db.close();
  }
}

/**
 * Update Attentive subscriber ID
 */
export function updateAttentiveSubscriberId(id: number, subscriberId: string): boolean {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      UPDATE sms_subscriptions
      SET attentive_subscriber_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(subscriberId, id);
    return true;
  } catch (error) {
    console.error('Error updating Attentive subscriber ID:', error);
    return false;
  } finally {
    db.close();
  }
}

// ============================================================================
// PREFERENCES MANAGEMENT
// ============================================================================

/**
 * Get SMS preferences
 */
export function getSMSPreferences(subscriptionId: number): SMSPreferences | null {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM sms_preferences WHERE subscription_id = ?');
    return stmt.get(subscriptionId) as SMSPreferences | null;
  } finally {
    db.close();
  }
}

/**
 * Update SMS preferences
 */
export function updateSMSPreferences(
  subscriptionId: number,
  data: UpdateSMSPreferencesRequest
): boolean {
  const db = getDb();

  try {
    const updates: string[] = [];
    const values: any[] = [];

    // Build dynamic UPDATE query
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    });

    if (updates.length === 0) return true;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(subscriptionId);

    const stmt = db.prepare(`
      UPDATE sms_preferences
      SET ${updates.join(', ')}
      WHERE subscription_id = ?
    `);

    stmt.run(...values);
    return true;
  } catch (error) {
    console.error('Error updating SMS preferences:', error);
    return false;
  } finally {
    db.close();
  }
}

// ============================================================================
// MESSAGE LOGGING
// ============================================================================

/**
 * Log an SMS message
 */
export function logSMSMessage(data: {
  subscriptionId: number;
  messageType: 'transactional' | 'marketing' | 'reminder';
  messageCategory: string;
  messageContent: string;
  orderId?: number;
  attentiveMessageId?: string;
  attentiveCampaignId?: string;
  costCents?: number;
}): number | null {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      INSERT INTO sms_messages (
        subscription_id, message_type, message_category, message_content,
        order_id, attentive_message_id, attentive_campaign_id, cost_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.subscriptionId,
      data.messageType,
      sanitize(data.messageCategory),
      sanitize(data.messageContent),
      data.orderId || null,
      data.attentiveMessageId || null,
      data.attentiveCampaignId || null,
      data.costCents || 1  // Default 1 cent per message
    );

    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('Error logging SMS message:', error);
    return null;
  } finally {
    db.close();
  }
}

/**
 * Update message status
 */
export function updateSMSMessageStatus(
  messageId: number,
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked',
  failedReason?: string
): boolean {
  const db = getDb();

  try {
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (status === 'sent') {
      updates.push('sent_at = CURRENT_TIMESTAMP');
    } else if (status === 'delivered') {
      updates.push('delivered_at = CURRENT_TIMESTAMP');
    } else if (status === 'clicked') {
      updates.push('clicked_at = CURRENT_TIMESTAMP');
    } else if (status === 'failed' && failedReason) {
      updates.push('failed_reason = ?');
      values.push(sanitize(failedReason));
    }

    values.push(messageId);

    const stmt = db.prepare(`
      UPDATE sms_messages
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return true;
  } catch (error) {
    console.error('Error updating message status:', error);
    return false;
  } finally {
    db.close();
  }
}

/**
 * Get messages for a subscription
 */
export function getSMSMessages(
  subscriptionId: number,
  limit = 50
): SMSMessage[] {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT * FROM sms_messages
      WHERE subscription_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(subscriptionId, limit) as SMSMessage[];
  } finally {
    db.close();
  }
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

/**
 * Create SMS campaign
 */
export function createSMSCampaign(
  data: {
    name: string;
    description?: string;
    messageTemplate: string;
    targetAudience: string;
    segmentFilter?: string;
    scheduledFor?: string;
  },
  createdBy: number
): number | null {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      INSERT INTO sms_campaigns (
        name, description, message_template,
        target_audience, segment_filter, scheduled_for,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      sanitize(data.name),
      data.description ? sanitize(data.description) : null,
      sanitize(data.messageTemplate),
      sanitize(data.targetAudience),
      data.segmentFilter || null,
      data.scheduledFor || null,
      data.scheduledFor ? 'scheduled' : 'draft',
      createdBy
    );

    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('Error creating SMS campaign:', error);
    return null;
  } finally {
    db.close();
  }
}

/**
 * Get campaign by ID
 */
export function getSMSCampaign(id: number): SMSCampaign | null {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM sms_campaigns WHERE id = ?');
    return stmt.get(id) as SMSCampaign | null;
  } finally {
    db.close();
  }
}

/**
 * Get all campaigns
 */
export function getAllSMSCampaigns(status?: string): SMSCampaign[] {
  const db = getDb();

  try {
    let stmt;
    if (status) {
      stmt = db.prepare('SELECT * FROM sms_campaigns WHERE status = ? ORDER BY created_at DESC');
      return stmt.all(status) as SMSCampaign[];
    } else {
      stmt = db.prepare('SELECT * FROM sms_campaigns ORDER BY created_at DESC');
      return stmt.all() as SMSCampaign[];
    }
  } finally {
    db.close();
  }
}

/**
 * Update campaign status
 */
export function updateSMSCampaignStatus(
  id: number,
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled'
): boolean {
  const db = getDb();

  try {
    const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [status];

    if (status === 'sending') {
      updates.push('sent_at = CURRENT_TIMESTAMP');
    } else if (status === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE sms_campaigns
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return true;
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return false;
  } finally {
    db.close();
  }
}

/**
 * Update campaign metrics
 */
export function updateSMSCampaignMetrics(
  id: number,
  metrics: {
    totalRecipients?: number;
    messagesSent?: number;
    messagesDelivered?: number;
    messagesFailed?: number;
    clicks?: number;
    conversions?: number;
    revenueGenerated?: number;
    totalCostCents?: number;
  }
): boolean {
  const db = getDb();

  try {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) return true;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE sms_campaigns
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return true;
  } catch (error) {
    console.error('Error updating campaign metrics:', error);
    return false;
  } finally {
    db.close();
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get SMS statistics
 */
export function getSMSStats() {
  const db = getDb();

  try {
    // Total and active subscribers
    const subStats = db.prepare(`
      SELECT
        COUNT(*) as total_subscribers,
        SUM(CASE WHEN is_subscribed = 1 THEN 1 ELSE 0 END) as active_subscribers,
        SUM(CASE WHEN DATE(subscribed_at) = DATE('now') THEN 1 ELSE 0 END) as new_today,
        SUM(CASE WHEN DATE(subscribed_at) >= DATE('now', '-7 days') THEN 1 ELSE 0 END) as new_this_week,
        SUM(CASE WHEN DATE(subscribed_at) >= DATE('now', '-30 days') THEN 1 ELSE 0 END) as new_this_month
      FROM sms_subscriptions
    `).get() as any;

    // Message stats
    const msgStats = db.prepare(`
      SELECT
        SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as messages_sent_today,
        SUM(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 ELSE 0 END) as messages_sent_this_week,
        SUM(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 ELSE 0 END) as messages_sent_this_month,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as total_delivered,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed,
        SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as total_clicked,
        COUNT(*) as total_messages,
        SUM(cost_cents) as total_cost_cents
      FROM sms_messages
    `).get() as any;

    // Calculate rates
    const deliveryRate = msgStats?.total_messages > 0
      ? (msgStats.total_delivered / msgStats.total_messages) * 100
      : 0;

    const clickRate = msgStats?.total_delivered > 0
      ? (msgStats.total_clicked / msgStats.total_delivered) * 100
      : 0;

    return {
      ...(subStats || {}),
      ...(msgStats || {}),
      average_delivery_rate: deliveryRate,
      average_click_rate: clickRate,
      total_revenue_attributed: 0,  // Would need order tracking
      roi: 0,  // Revenue / Cost
    };
  } finally {
    db.close();
  }
}

/**
 * Get or create daily analytics record
 */
export function recordDailySMSAnalytics(date: string = new Date().toISOString().split('T')[0]) {
  const db = getDb();

  try {
    const stats = getSMSStats();

    const stmt = db.prepare(`
      INSERT INTO sms_analytics (
        date, new_subscriptions, total_active_subscribers,
        transactional_sent, marketing_sent,
        total_delivered, total_failed, total_clicks,
        click_rate, delivery_rate,
        total_cost_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_active_subscribers = excluded.total_active_subscribers,
        transactional_sent = excluded.transactional_sent,
        marketing_sent = excluded.marketing_sent,
        total_delivered = excluded.total_delivered,
        total_failed = excluded.total_failed,
        total_clicks = excluded.total_clicks,
        click_rate = excluded.click_rate,
        delivery_rate = excluded.delivery_rate,
        total_cost_cents = excluded.total_cost_cents
    `);

    stmt.run(
      date,
      stats.new_today || 0,
      stats.active_subscribers || 0,
      0,  // TODO: Get from messages table
      0,  // TODO: Get from messages table
      stats.total_delivered || 0,
      stats.total_failed || 0,
      stats.total_clicked || 0,
      stats.average_click_rate || 0,
      stats.average_delivery_rate || 0,
      stats.total_cost_cents || 0
    );

    return true;
  } catch (error) {
    console.error('Error recording daily analytics:', error);
    return false;
  } finally {
    db.close();
  }
}

/**
 * Get analytics for date range
 */
export function getSMSAnalytics(startDate: string, endDate: string): SMSAnalytics[] {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT * FROM sms_analytics
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC
    `);

    return stmt.all(startDate, endDate) as SMSAnalytics[];
  } finally {
    db.close();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if phone number is subscribed
 */
export function isPhoneSubscribed(phone: string): boolean {
  const subscription = getSMSSubscriptionByPhone(phone);
  return subscription ? subscription.is_subscribed : false;
}

/**
 * Get active subscribers count
 */
export function getActiveSubscribersCount(): number {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM sms_subscriptions WHERE is_subscribed = 1');
    const result = stmt.get() as { count: number };
    return result.count;
  } finally {
    db.close();
  }
}

/**
 * Get subscribers for campaign targeting
 */
export function getSubscribersForCampaign(targetAudience: string): SMSSubscription[] {
  const db = getDb();

  try {
    // Base query for active, marketing opt-in subscribers
    let query = `
      SELECT s.* FROM sms_subscriptions s
      JOIN sms_preferences p ON s.id = p.subscription_id
      WHERE s.is_subscribed = 1 AND s.marketing_opt_in = 1
    `;

    // Add targeting filters
    if (targetAudience === 'new_customers') {
      query += ` AND s.user_id IS NULL`;
    } else if (targetAudience === 'repeat_customers') {
      query += ` AND s.user_id IS NOT NULL`;
    }
    // 'all' doesn't add additional filters

    const stmt = db.prepare(query);
    return stmt.all() as SMSSubscription[];
  } finally {
    db.close();
  }
}

