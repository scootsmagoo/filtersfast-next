/**
 * Database operations for Saved Payment Methods
 * 
 * Secure storage of Stripe payment method tokens (NOT raw card data)
 * PCI compliant - all sensitive data stored by Stripe
 */

import Database from 'better-sqlite3';
import { SavedPaymentMethod } from '../types/payment-methods';

const db = new Database(process.env.DATABASE_URL || './auth.db');

/**
 * Initialize payment methods tables
 */
export function initializePaymentMethodsTables(): void {
  // Create saved_payment_methods table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      stripe_payment_method_id TEXT NOT NULL UNIQUE,
      stripe_customer_id TEXT NOT NULL,
      card_brand TEXT NOT NULL,
      card_last4 TEXT NOT NULL,
      card_exp_month INTEGER NOT NULL,
      card_exp_year INTEGER NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      billing_name TEXT,
      billing_email TEXT,
      billing_address_line1 TEXT,
      billing_address_line2 TEXT,
      billing_address_city TEXT,
      billing_address_state TEXT,
      billing_address_zip TEXT,
      billing_address_country TEXT DEFAULT 'US',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id 
      ON saved_payment_methods(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_customer_id 
      ON saved_payment_methods(stripe_customer_id);
    
    CREATE INDEX IF NOT EXISTS idx_payment_methods_default 
      ON saved_payment_methods(user_id, is_default);
  `);

  console.log('✅ Payment methods tables created');
}

/**
 * Get all payment methods for a user
 */
export function getPaymentMethodsByUserId(userId: string): SavedPaymentMethod[] {
  const stmt = db.prepare(`
    SELECT * FROM saved_payment_methods 
    WHERE user_id = ? 
    ORDER BY is_default DESC, created_at DESC
  `);
  return stmt.all(userId) as SavedPaymentMethod[];
}

/**
 * Get a specific payment method by ID
 */
export function getPaymentMethodById(id: number, userId: string): SavedPaymentMethod | undefined {
  const stmt = db.prepare(`
    SELECT * FROM saved_payment_methods 
    WHERE id = ? AND user_id = ?
  `);
  return stmt.get(id, userId) as SavedPaymentMethod | undefined;
}

/**
 * Get payment method by Stripe payment method ID
 */
export function getPaymentMethodByStripeId(stripePaymentMethodId: string): SavedPaymentMethod | undefined {
  const stmt = db.prepare(`
    SELECT * FROM saved_payment_methods 
    WHERE stripe_payment_method_id = ?
  `);
  return stmt.get(stripePaymentMethodId) as SavedPaymentMethod | undefined;
}

/**
 * Get default payment method for a user
 */
export function getDefaultPaymentMethod(userId: string): SavedPaymentMethod | undefined {
  const stmt = db.prepare(`
    SELECT * FROM saved_payment_methods 
    WHERE user_id = ? AND is_default = 1
    LIMIT 1
  `);
  return stmt.get(userId) as SavedPaymentMethod | undefined;
}

/**
 * Create a new saved payment method
 */
export function createPaymentMethod(data: {
  user_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default?: boolean;
  billing_name?: string;
  billing_email?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_address_city?: string;
  billing_address_state?: string;
  billing_address_zip?: string;
  billing_address_country?: string;
}): number {
  // If this is the first payment method for the user, make it default
  const existingMethods = getPaymentMethodsByUserId(data.user_id);
  const isDefault = existingMethods.length === 0 ? true : (data.is_default || false);

  // If setting as default, unset any existing defaults
  if (isDefault) {
    unsetDefaultPaymentMethods(data.user_id);
  }

  const stmt = db.prepare(`
    INSERT INTO saved_payment_methods (
      user_id, stripe_payment_method_id, stripe_customer_id,
      card_brand, card_last4, card_exp_month, card_exp_year,
      is_default, billing_name, billing_email,
      billing_address_line1, billing_address_line2,
      billing_address_city, billing_address_state,
      billing_address_zip, billing_address_country
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.user_id,
    data.stripe_payment_method_id,
    data.stripe_customer_id,
    data.card_brand,
    data.card_last4,
    data.card_exp_month,
    data.card_exp_year,
    isDefault ? 1 : 0,
    data.billing_name || null,
    data.billing_email || null,
    data.billing_address_line1 || null,
    data.billing_address_line2 || null,
    data.billing_address_city || null,
    data.billing_address_state || null,
    data.billing_address_zip || null,
    data.billing_address_country || 'US'
  );

  return result.lastInsertRowid as number;
}

/**
 * Update payment method (mainly for setting default or updating billing address)
 * 
 * OWASP A03: SQL Injection Prevention - Uses allowlist for dynamic fields
 */
export function updatePaymentMethod(
  id: number,
  userId: string,
  updates: {
    is_default?: boolean;
    billing_name?: string;
    billing_address_line1?: string;
    billing_address_line2?: string;
    billing_address_city?: string;
    billing_address_state?: string;
    billing_address_zip?: string;
    billing_address_country?: string;
  }
): boolean {
  // If setting as default, unset any existing defaults
  if (updates.is_default === true) {
    unsetDefaultPaymentMethods(userId);
  }

  // OWASP A03: Allowlist of valid column names to prevent SQL injection
  const allowedFields = new Map<string, string>([
    ['is_default', 'is_default = ?'],
    ['billing_name', 'billing_name = ?'],
    ['billing_address_line1', 'billing_address_line1 = ?'],
    ['billing_address_line2', 'billing_address_line2 = ?'],
    ['billing_address_city', 'billing_address_city = ?'],
    ['billing_address_state', 'billing_address_state = ?'],
    ['billing_address_zip', 'billing_address_zip = ?'],
    ['billing_address_country', 'billing_address_country = ?'],
  ]);

  const fields: string[] = [];
  const values: any[] = [];

  // Only process fields that exist in the allowlist
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && allowedFields.has(key)) {
      fields.push(allowedFields.get(key)!);
      values.push(key === 'is_default' ? (value ? 1 : 0) : value);
    }
  }

  if (fields.length === 0) {
    return false;
  }

  values.push(id, userId);

  const stmt = db.prepare(`
    UPDATE saved_payment_methods 
    SET ${fields.join(', ')}
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(...values);
  return result.changes > 0;
}

/**
 * Delete a payment method
 */
export function deletePaymentMethod(id: number, userId: string): boolean {
  // Check if this was the default
  const paymentMethod = getPaymentMethodById(id, userId);
  const wasDefault = paymentMethod?.is_default;

  const stmt = db.prepare(`
    DELETE FROM saved_payment_methods 
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(id, userId);

  // If we deleted the default, set another as default
  if (wasDefault && result.changes > 0) {
    const remaining = getPaymentMethodsByUserId(userId);
    if (remaining.length > 0) {
      setDefaultPaymentMethod(remaining[0].id, userId);
    }
  }

  return result.changes > 0;
}

/**
 * Set a payment method as default
 */
export function setDefaultPaymentMethod(id: number, userId: string): boolean {
  // First, unset all defaults for this user
  unsetDefaultPaymentMethods(userId);

  // Then set this one as default
  const stmt = db.prepare(`
    UPDATE saved_payment_methods 
    SET is_default = 1 
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(id, userId);
  return result.changes > 0;
}

/**
 * Unset all default payment methods for a user
 */
function unsetDefaultPaymentMethods(userId: string): void {
  const stmt = db.prepare(`
    UPDATE saved_payment_methods 
    SET is_default = 0 
    WHERE user_id = ?
  `);
  stmt.run(userId);
}

/**
 * Update last used timestamp
 */
export function updateLastUsed(id: number, userId: string): boolean {
  const stmt = db.prepare(`
    UPDATE saved_payment_methods 
    SET last_used_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(id, userId);
  return result.changes > 0;
}

/**
 * Get payment methods count for a user
 */
export function getPaymentMethodsCount(userId: string): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM saved_payment_methods 
    WHERE user_id = ?
  `);
  const result = stmt.get(userId) as { count: number };
  return result.count;
}

/**
 * Delete all payment methods for a user (used when deleting account)
 */
export function deleteAllPaymentMethodsByUserId(userId: string): number {
  const stmt = db.prepare(`
    DELETE FROM saved_payment_methods 
    WHERE user_id = ?
  `);
  const result = stmt.run(userId);
  return result.changes;
}

/**
 * Get Stripe customer ID for a user (from their saved payment methods)
 */
export function getStripeCustomerIdByUserId(userId: string): string | null {
  const stmt = db.prepare(`
    SELECT stripe_customer_id 
    FROM saved_payment_methods 
    WHERE user_id = ? 
    LIMIT 1
  `);
  const result = stmt.get(userId) as { stripe_customer_id: string } | undefined;
  return result?.stripe_customer_id || null;
}

