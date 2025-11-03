/**
 * Database operations for PayPal Transaction Logging
 * 
 * Tracks all PayPal transactions for audit and debugging
 */

import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL || './filtersfast.db');

export interface PayPalTransaction {
  id: number;
  order_id: string | null;
  paypal_order_id: string;
  payer_id: string | null;
  transaction_type: 'create' | 'capture' | 'refund' | 'error';
  status: string;
  amount: number;
  currency: string;
  payment_source: 'paypal' | 'venmo' | 'credit';
  raw_request: string;
  raw_response: string;
  error_message: string | null;
  created_at: string;
}

/**
 * Initialize PayPal transactions table
 * OWASP A03: Proper database constraints and validation
 */
export function initializePayPalTransactionsTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS paypal_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      paypal_order_id TEXT NOT NULL,
      payer_id TEXT,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('create', 'capture', 'refund', 'error')),
      status TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0 CHECK(amount >= 0 AND amount <= 999999),
      currency TEXT NOT NULL DEFAULT 'USD' CHECK(length(currency) = 3),
      payment_source TEXT NOT NULL DEFAULT 'paypal' CHECK(payment_source IN ('paypal', 'venmo', 'credit')),
      raw_request TEXT CHECK(length(raw_request) <= 100000),
      raw_response TEXT CHECK(length(raw_response) <= 100000),
      error_message TEXT CHECK(length(error_message) <= 5000),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_paypal_transactions_order_id 
      ON paypal_transactions(order_id);
    
    CREATE INDEX IF NOT EXISTS idx_paypal_transactions_paypal_order_id 
      ON paypal_transactions(paypal_order_id);
    
    CREATE INDEX IF NOT EXISTS idx_paypal_transactions_created_at 
      ON paypal_transactions(created_at);
    
    CREATE INDEX IF NOT EXISTS idx_paypal_transactions_transaction_type 
      ON paypal_transactions(transaction_type);
    
    CREATE INDEX IF NOT EXISTS idx_paypal_transactions_status 
      ON paypal_transactions(status);
  `);

  console.log('✅ PayPal transactions tables created');
}

/**
 * Log a PayPal transaction
 * OWASP A03: Input validation before database insertion
 */
export function logPayPalTransaction(data: {
  order_id?: string;
  paypal_order_id: string;
  payer_id?: string;
  transaction_type: 'create' | 'capture' | 'refund' | 'error';
  status: string;
  amount: number;
  currency?: string;
  payment_source?: 'paypal' | 'venmo' | 'credit';
  raw_request?: any;
  raw_response?: any;
  error_message?: string;
}): number {
  // OWASP A03: Validate inputs
  if (!data.paypal_order_id || typeof data.paypal_order_id !== 'string') {
    throw new Error('Invalid PayPal order ID');
  }
  
  if (typeof data.amount !== 'number' || data.amount < 0 || data.amount > 999999) {
    throw new Error('Invalid amount');
  }
  
  if (data.status && typeof data.status !== 'string') {
    throw new Error('Invalid status');
  }
  
  const stmt = db.prepare(`
    INSERT INTO paypal_transactions (
      order_id, paypal_order_id, payer_id, transaction_type,
      status, amount, currency, payment_source,
      raw_request, raw_response, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // OWASP A09: Limit size of logged data to prevent DoS via log flooding
  const requestStr = data.raw_request ? JSON.stringify(data.raw_request).substring(0, 100000) : null;
  const responseStr = data.raw_response ? JSON.stringify(data.raw_response).substring(0, 100000) : null;
  const errorStr = data.error_message ? data.error_message.substring(0, 5000) : null;

  const result = stmt.run(
    data.order_id || null,
    data.paypal_order_id.substring(0, 100),
    data.payer_id ? data.payer_id.substring(0, 100) : null,
    data.transaction_type,
    data.status.substring(0, 50),
    data.amount,
    (data.currency || 'USD').substring(0, 3),
    data.payment_source || 'paypal',
    requestStr,
    responseStr,
    errorStr
  );

  return result.lastInsertRowid as number;
}

/**
 * Get all transactions for an order
 */
export function getPayPalTransactionsByOrderId(order_id: string): PayPalTransaction[] {
  const stmt = db.prepare(`
    SELECT * FROM paypal_transactions 
    WHERE order_id = ? 
    ORDER BY created_at DESC
  `);
  return stmt.all(order_id) as PayPalTransaction[];
}

/**
 * Get all transactions for a PayPal order ID
 */
export function getPayPalTransactionsByPayPalOrderId(paypal_order_id: string): PayPalTransaction[] {
  const stmt = db.prepare(`
    SELECT * FROM paypal_transactions 
    WHERE paypal_order_id = ? 
    ORDER BY created_at DESC
  `);
  return stmt.all(paypal_order_id) as PayPalTransaction[];
}

/**
 * Get a single transaction
 */
export function getPayPalTransaction(id: number): PayPalTransaction | undefined {
  const stmt = db.prepare(`
    SELECT * FROM paypal_transactions 
    WHERE id = ?
  `);
  return stmt.get(id) as PayPalTransaction | undefined;
}

/**
 * Get recent PayPal errors for monitoring
 */
export function getRecentPayPalErrors(limit: number = 50): PayPalTransaction[] {
  const stmt = db.prepare(`
    SELECT * FROM paypal_transactions 
    WHERE transaction_type = 'error' 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(limit) as PayPalTransaction[];
}

/**
 * Update transaction with order ID after order creation
 */
export function updatePayPalTransactionOrderId(paypal_order_id: string, order_id: string): boolean {
  const stmt = db.prepare(`
    UPDATE paypal_transactions 
    SET order_id = ? 
    WHERE paypal_order_id = ? AND order_id IS NULL
  `);
  const result = stmt.run(order_id, paypal_order_id);
  return result.changes > 0;
}

/**
 * Get PayPal transaction stats
 */
export function getPayPalTransactionStats(days: number = 30): {
  total_transactions: number;
  total_amount: number;
  successful_captures: number;
  failed_transactions: number;
  venmo_transactions: number;
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN transaction_type = 'capture' AND status IN ('COMPLETED', 'SUCCESS') THEN amount ELSE 0 END) as total_amount,
      SUM(CASE WHEN transaction_type = 'capture' AND status IN ('COMPLETED', 'SUCCESS') THEN 1 ELSE 0 END) as successful_captures,
      SUM(CASE WHEN transaction_type = 'error' THEN 1 ELSE 0 END) as failed_transactions,
      SUM(CASE WHEN payment_source = 'venmo' THEN 1 ELSE 0 END) as venmo_transactions
    FROM paypal_transactions
    WHERE created_at >= ?
  `);

  return stmt.get(cutoffDate.toISOString()) as any;
}

