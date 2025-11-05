/**
 * Payment Gateway Database Operations
 * 
 * Manages payment gateway configurations and transaction logs
 */

import Database from 'better-sqlite3';
import type {
  PaymentGatewayConfig,
  PaymentGatewayType,
  PaymentGatewayStatus,
  PaymentGatewayTransaction,
  PaymentGatewayStats,
  TransactionType,
  TransactionStatus,
} from '../types/payment-gateway';

const db = new Database(process.env.DATABASE_URL || './auth.db');

/**
 * Initialize payment gateway tables
 */
export function initializePaymentGatewayTables(): void {
  // Payment Gateway Configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_gateways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gateway_type TEXT NOT NULL,
      gateway_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'inactive',
      is_primary BOOLEAN DEFAULT 0,
      is_backup BOOLEAN DEFAULT 0,
      priority INTEGER DEFAULT 999,
      
      -- Credentials (encrypted JSON)
      credentials_encrypted TEXT,
      
      -- Settings
      test_mode BOOLEAN DEFAULT 1,
      capture_method TEXT DEFAULT 'automatic',
      supported_currencies TEXT DEFAULT '["USD"]',
      supported_countries TEXT DEFAULT '["US"]',
      min_amount REAL,
      max_amount REAL,
      
      -- Features
      supports_tokenization BOOLEAN DEFAULT 0,
      supports_3ds BOOLEAN DEFAULT 0,
      supports_refunds BOOLEAN DEFAULT 1,
      supports_partial_refunds BOOLEAN DEFAULT 1,
      supports_subscriptions BOOLEAN DEFAULT 0,
      
      -- Metadata
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      
      UNIQUE(gateway_type)
    );

    CREATE INDEX IF NOT EXISTS idx_payment_gateways_status 
      ON payment_gateways(status);
    
    CREATE INDEX IF NOT EXISTS idx_payment_gateways_priority 
      ON payment_gateways(priority, status);
  `);

  // Payment Gateway Transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      gateway_type TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      gateway_transaction_id TEXT NOT NULL,
      
      -- Amount
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      
      -- Status
      status TEXT NOT NULL,
      authorization_code TEXT,
      
      -- Customer
      customer_email TEXT,
      customer_id TEXT,
      
      -- Payment Method
      payment_method_type TEXT,
      payment_method_token TEXT,
      card_last4 TEXT,
      card_brand TEXT,
      
      -- Fraud Detection
      avs_result TEXT,
      cvv_result TEXT,
      risk_score REAL,
      
      -- Error Handling
      error_code TEXT,
      error_message TEXT,
      
      -- Logging
      raw_request TEXT, -- JSON
      raw_response TEXT, -- JSON
      ip_address TEXT,
      user_agent TEXT,
      
      -- Metadata
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pgt_order_id 
      ON payment_gateway_transactions(order_id);
    
    CREATE INDEX IF NOT EXISTS idx_pgt_gateway_type 
      ON payment_gateway_transactions(gateway_type);
    
    CREATE INDEX IF NOT EXISTS idx_pgt_status 
      ON payment_gateway_transactions(status);
    
    CREATE INDEX IF NOT EXISTS idx_pgt_transaction_id 
      ON payment_gateway_transactions(transaction_id);
    
    CREATE INDEX IF NOT EXISTS idx_pgt_gateway_transaction_id 
      ON payment_gateway_transactions(gateway_transaction_id);
    
    CREATE INDEX IF NOT EXISTS idx_pgt_created_at 
      ON payment_gateway_transactions(created_at DESC);
  `);

  console.log('✅ Payment gateway tables created');
}

/**
 * Get all payment gateways
 */
export function getAllPaymentGateways(): PaymentGatewayConfig[] {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateways 
    ORDER BY priority ASC, gateway_name ASC
  `);
  
  const gateways = stmt.all() as any[];
  return gateways.map(parsePaymentGateway);
}

/**
 * Get active payment gateways
 */
export function getActivePaymentGateways(): PaymentGatewayConfig[] {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateways 
    WHERE status = 'active'
    ORDER BY priority ASC, gateway_name ASC
  `);
  
  const gateways = stmt.all() as any[];
  return gateways.map(parsePaymentGateway);
}

/**
 * Get primary payment gateway
 */
export function getPrimaryPaymentGateway(): PaymentGatewayConfig | null {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateways 
    WHERE status = 'active' AND is_primary = 1
    LIMIT 1
  `);
  
  const gateway = stmt.get() as any;
  return gateway ? parsePaymentGateway(gateway) : null;
}

/**
 * Get backup payment gateway
 */
export function getBackupPaymentGateway(): PaymentGatewayConfig | null {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateways 
    WHERE status = 'active' AND is_backup = 1
    ORDER BY priority ASC
    LIMIT 1
  `);
  
  const gateway = stmt.get() as any;
  return gateway ? parsePaymentGateway(gateway) : null;
}

/**
 * Get payment gateway by type
 */
export function getPaymentGatewayByType(type: PaymentGatewayType): PaymentGatewayConfig | null {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateways 
    WHERE gateway_type = ?
  `);
  
  const gateway = stmt.get(type) as any;
  return gateway ? parsePaymentGateway(gateway) : null;
}

/**
 * Create or update payment gateway
 */
export function upsertPaymentGateway(data: Partial<PaymentGatewayConfig> & { gateway_type: PaymentGatewayType }): number {
  const existing = getPaymentGatewayByType(data.gateway_type);
  
  if (existing) {
    return updatePaymentGateway(existing.id, data);
  }
  
  const stmt = db.prepare(`
    INSERT INTO payment_gateways (
      gateway_type, gateway_name, status, is_primary, is_backup, priority,
      credentials_encrypted, test_mode, capture_method, 
      supported_currencies, supported_countries, min_amount, max_amount,
      supports_tokenization, supports_3ds, supports_refunds, 
      supports_partial_refunds, supports_subscriptions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.gateway_type,
    data.gateway_name || data.gateway_type,
    data.status || 'inactive',
    data.is_primary ? 1 : 0,
    data.is_backup ? 1 : 0,
    data.priority || 999,
    data.credentials ? JSON.stringify(data.credentials) : null,
    data.test_mode !== undefined ? (data.test_mode ? 1 : 0) : 1,
    data.capture_method || 'automatic',
    JSON.stringify(data.supported_currencies || ['USD']),
    JSON.stringify(data.supported_countries || ['US']),
    data.min_amount || null,
    data.max_amount || null,
    data.supports_tokenization ? 1 : 0,
    data.supports_3ds ? 1 : 0,
    data.supports_refunds !== undefined ? (data.supports_refunds ? 1 : 0) : 1,
    data.supports_partial_refunds !== undefined ? (data.supports_partial_refunds ? 1 : 0) : 1,
    data.supports_subscriptions ? 1 : 0
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Update payment gateway
 */
export function updatePaymentGateway(id: number, updates: Partial<PaymentGatewayConfig>): number {
  const allowedFields = [
    'gateway_name', 'status', 'is_primary', 'is_backup', 'priority',
    'credentials_encrypted', 'test_mode', 'capture_method',
    'supported_currencies', 'supported_countries', 'min_amount', 'max_amount',
    'supports_tokenization', 'supports_3ds', 'supports_refunds',
    'supports_partial_refunds', 'supports_subscriptions'
  ];
  
  const fields: string[] = [];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(updates)) {
    let fieldName = key;
    let fieldValue = value;
    
    // Convert camelCase to snake_case
    if (key === 'gatewayName') fieldName = 'gateway_name';
    else if (key === 'isPrimary') fieldName = 'is_primary';
    else if (key === 'isBackup') fieldName = 'is_backup';
    else if (key === 'testMode') fieldName = 'test_mode';
    else if (key === 'captureMethod') fieldName = 'capture_method';
    else if (key === 'supportedCurrencies') fieldName = 'supported_currencies';
    else if (key === 'supportedCountries') fieldName = 'supported_countries';
    else if (key === 'minAmount') fieldName = 'min_amount';
    else if (key === 'maxAmount') fieldName = 'max_amount';
    else if (key === 'supportsTokenization') fieldName = 'supports_tokenization';
    else if (key === 'supports3ds') fieldName = 'supports_3ds';
    else if (key === 'supportsRefunds') fieldName = 'supports_refunds';
    else if (key === 'supportsPartialRefunds') fieldName = 'supports_partial_refunds';
    else if (key === 'supportsSubscriptions') fieldName = 'supports_subscriptions';
    
    if (allowedFields.includes(fieldName)) {
      fields.push(`${fieldName} = ?`);
      
      // Handle special types
      if (fieldName === 'credentials_encrypted' && typeof fieldValue === 'object') {
        fieldValue = JSON.stringify(fieldValue);
      } else if (fieldName === 'supported_currencies' && Array.isArray(fieldValue)) {
        fieldValue = JSON.stringify(fieldValue);
      } else if (fieldName === 'supported_countries' && Array.isArray(fieldValue)) {
        fieldValue = JSON.stringify(fieldValue);
      } else if (typeof fieldValue === 'boolean') {
        fieldValue = fieldValue ? 1 : 0;
      }
      
      values.push(fieldValue);
    }
  }
  
  if (fields.length === 0) {
    return 0;
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE payment_gateways 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  const result = stmt.run(...values);
  return result.changes;
}

/**
 * Update gateway last used timestamp
 */
export function updateGatewayLastUsed(gatewayType: PaymentGatewayType): void {
  const stmt = db.prepare(`
    UPDATE payment_gateways 
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE gateway_type = ?
  `);
  
  stmt.run(gatewayType);
}

/**
 * Log payment gateway transaction
 */
export function logPaymentGatewayTransaction(data: Omit<PaymentGatewayTransaction, 'id' | 'created_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO payment_gateway_transactions (
      order_id, gateway_type, transaction_type, transaction_id, gateway_transaction_id,
      amount, currency, status, authorization_code,
      customer_email, customer_id,
      payment_method_type, payment_method_token, card_last4, card_brand,
      avs_result, cvv_result, risk_score,
      error_code, error_message,
      raw_request, raw_response, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.order_id || null,
    data.gateway_type,
    data.transaction_type,
    data.transaction_id,
    data.gateway_transaction_id,
    data.amount,
    data.currency || 'USD',
    data.status,
    data.authorization_code || null,
    data.customer_email || null,
    data.customer_id || null,
    data.payment_method_type || null,
    data.payment_method_token || null,
    data.card_last4 || null,
    data.card_brand || null,
    data.avs_result || null,
    data.cvv_result || null,
    data.risk_score || null,
    data.error_code || null,
    data.error_message || null,
    data.raw_request ? JSON.stringify(data.raw_request) : null,
    data.raw_response ? JSON.stringify(data.raw_response) : null,
    data.ip_address || null,
    data.user_agent || null
  );
  
  // Update gateway last used timestamp
  updateGatewayLastUsed(data.gateway_type);
  
  return result.lastInsertRowid as number;
}

/**
 * Get transaction by ID
 */
export function getTransactionById(id: number): PaymentGatewayTransaction | null {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateway_transactions 
    WHERE id = ?
  `);
  
  const transaction = stmt.get(id) as any;
  return transaction ? parseTransaction(transaction) : null;
}

/**
 * Get transactions by order ID
 */
export function getTransactionsByOrderId(orderId: number): PaymentGatewayTransaction[] {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateway_transactions 
    WHERE order_id = ?
    ORDER BY created_at DESC
  `);
  
  const transactions = stmt.all(orderId) as any[];
  return transactions.map(parseTransaction);
}

/**
 * Get transaction by gateway transaction ID
 */
export function getTransactionByGatewayId(gatewayTransactionId: string): PaymentGatewayTransaction | null {
  const stmt = db.prepare(`
    SELECT * FROM payment_gateway_transactions 
    WHERE gateway_transaction_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);
  
  const transaction = stmt.get(gatewayTransactionId) as any;
  return transaction ? parseTransaction(transaction) : null;
}

/**
 * Get gateway statistics
 */
export function getPaymentGatewayStats(gatewayType?: PaymentGatewayType): PaymentGatewayStats[] {
  const whereClause = gatewayType ? 'WHERE gateway_type = ?' : '';
  const params = gatewayType ? [gatewayType] : [];
  
  const stmt = db.prepare(`
    SELECT 
      gateway_type,
      COUNT(*) as total_transactions,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as successful_transactions,
      SUM(CASE WHEN status IN ('declined', 'error') THEN 1 ELSE 0 END) as failed_transactions,
      SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_volume,
      AVG(CASE WHEN status = 'approved' THEN amount ELSE NULL END) as average_amount,
      MAX(created_at) as last_transaction_at
    FROM payment_gateway_transactions
    ${whereClause}
    GROUP BY gateway_type
    ORDER BY total_volume DESC
  `);
  
  const stats = stmt.all(...params) as any[];
  
  return stats.map(s => ({
    gateway_type: s.gateway_type,
    total_transactions: s.total_transactions,
    successful_transactions: s.successful_transactions,
    failed_transactions: s.failed_transactions,
    total_volume: s.total_volume || 0,
    average_amount: s.average_amount || 0,
    success_rate: s.total_transactions > 0 
      ? (s.successful_transactions / s.total_transactions) * 100 
      : 0,
    last_transaction_at: s.last_transaction_at,
  }));
}

/**
 * Helper: Parse payment gateway from database
 */
function parsePaymentGateway(row: any): PaymentGatewayConfig {
  return {
    id: row.id,
    gateway_type: row.gateway_type,
    gateway_name: row.gateway_name,
    status: row.status,
    is_primary: row.is_primary === 1,
    is_backup: row.is_backup === 1,
    priority: row.priority,
    credentials: row.credentials_encrypted ? JSON.parse(row.credentials_encrypted) : {},
    test_mode: row.test_mode === 1,
    capture_method: row.capture_method,
    supported_currencies: JSON.parse(row.supported_currencies || '["USD"]'),
    supported_countries: JSON.parse(row.supported_countries || '["US"]'),
    min_amount: row.min_amount,
    max_amount: row.max_amount,
    supports_tokenization: row.supports_tokenization === 1,
    supports_3ds: row.supports_3ds === 1,
    supports_refunds: row.supports_refunds === 1,
    supports_partial_refunds: row.supports_partial_refunds === 1,
    supports_subscriptions: row.supports_subscriptions === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_used_at: row.last_used_at,
  };
}

/**
 * Helper: Parse transaction from database
 */
function parseTransaction(row: any): PaymentGatewayTransaction {
  return {
    id: row.id,
    order_id: row.order_id,
    gateway_type: row.gateway_type,
    transaction_type: row.transaction_type,
    transaction_id: row.transaction_id,
    gateway_transaction_id: row.gateway_transaction_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    authorization_code: row.authorization_code,
    customer_email: row.customer_email,
    customer_id: row.customer_id,
    payment_method_type: row.payment_method_type,
    payment_method_token: row.payment_method_token,
    card_last4: row.card_last4,
    card_brand: row.card_brand,
    avs_result: row.avs_result,
    cvv_result: row.cvv_result,
    risk_score: row.risk_score,
    error_code: row.error_code,
    error_message: row.error_message,
    raw_request: row.raw_request ? JSON.parse(row.raw_request) : undefined,
    raw_response: row.raw_response ? JSON.parse(row.raw_response) : undefined,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

