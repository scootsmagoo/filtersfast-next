import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL || './auth.db');

export interface AbandonedCart {
  id: number;
  session_id: string;
  user_id: string | null;
  email: string;
  cart_data: string; // JSON stringified cart items
  cart_value: number;
  created_at: string;
  updated_at: string;
  abandoned_at: string;
  recovered_at: string | null;
  recovery_token: string;
  recovery_token_expires: string;
  email_sent_count: number;
  last_email_sent: string | null;
  opted_out: boolean;
  converted: boolean;
  order_id: string | null;
}

export interface AbandonedCartEmail {
  id: number;
  abandoned_cart_id: number;
  email_type: 'reminder_1hr' | 'reminder_24hr' | 'reminder_72hr';
  sent_at: string;
  opened: boolean;
  clicked: boolean;
}

export interface AbandonedCartStats {
  total_abandoned: number;
  total_recovered: number;
  total_value_abandoned: number;
  total_value_recovered: number;
  recovery_rate: number;
  emails_sent: number;
  recent_abandons: number; // Last 7 days
}

// Initialize abandoned cart tables
export function initializeAbandonedCartTables() {
  // Abandoned Carts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id TEXT,
      email TEXT NOT NULL,
      cart_data TEXT NOT NULL,
      cart_value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      abandoned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      recovered_at DATETIME,
      recovery_token TEXT NOT NULL UNIQUE,
      recovery_token_expires DATETIME NOT NULL,
      email_sent_count INTEGER DEFAULT 0,
      last_email_sent DATETIME,
      opted_out BOOLEAN DEFAULT 0,
      converted BOOLEAN DEFAULT 0,
      order_id TEXT,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
    )
  `);

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery_token ON abandoned_carts(recovery_token);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_abandoned_carts_abandoned_at ON abandoned_carts(abandoned_at);
  `);

  // Abandoned Cart Emails table (tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS abandoned_cart_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      abandoned_cart_id INTEGER NOT NULL,
      email_type TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      opened BOOLEAN DEFAULT 0,
      clicked BOOLEAN DEFAULT 0,
      FOREIGN KEY (abandoned_cart_id) REFERENCES abandoned_carts(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_abandoned_cart_emails_cart_id ON abandoned_cart_emails(abandoned_cart_id);
  `);

  console.log('✅ Abandoned cart tables initialized');
}

// Create an abandoned cart record
export function createAbandonedCart(data: {
  session_id: string;
  user_id: string | null;
  email: string;
  cart_data: string;
  cart_value: number;
  recovery_token: string;
  recovery_token_expires: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO abandoned_carts (
      session_id, user_id, email, cart_data, cart_value,
      recovery_token, recovery_token_expires
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.session_id,
    data.user_id,
    data.email,
    data.cart_data,
    data.cart_value,
    data.recovery_token,
    data.recovery_token_expires
  );

  return result.lastInsertRowid as number;
}

// Get abandoned cart by recovery token
export function getAbandonedCartByToken(token: string): AbandonedCart | null {
  const stmt = db.prepare(`
    SELECT * FROM abandoned_carts
    WHERE recovery_token = ? AND recovery_token_expires > datetime('now')
  `);

  return stmt.get(token) as AbandonedCart | null;
}

// Get carts ready for email (1hr, 24hr, 72hr)
export function getCartsReadyForEmail(emailType: 'reminder_1hr' | 'reminder_24hr' | 'reminder_72hr'): AbandonedCart[] {
  let hoursSinceAbandonment: number;
  let maxEmailsSent: number;

  switch (emailType) {
    case 'reminder_1hr':
      hoursSinceAbandonment = 1;
      maxEmailsSent = 0;
      break;
    case 'reminder_24hr':
      hoursSinceAbandonment = 24;
      maxEmailsSent = 1;
      break;
    case 'reminder_72hr':
      hoursSinceAbandonment = 72;
      maxEmailsSent = 2;
      break;
  }

  const stmt = db.prepare(`
    SELECT * FROM abandoned_carts
    WHERE 
      converted = 0
      AND opted_out = 0
      AND recovered_at IS NULL
      AND email_sent_count = ?
      AND abandoned_at <= datetime('now', '-${hoursSinceAbandonment} hours')
      AND (last_email_sent IS NULL OR last_email_sent <= datetime('now', '-1 hour'))
    ORDER BY abandoned_at ASC
    LIMIT 100
  `);

  return stmt.all(maxEmailsSent) as AbandonedCart[];
}

// Update email sent count
export function recordEmailSent(cartId: number, emailType: 'reminder_1hr' | 'reminder_24hr' | 'reminder_72hr'): void {
  // Update abandoned cart
  const updateStmt = db.prepare(`
    UPDATE abandoned_carts
    SET email_sent_count = email_sent_count + 1,
        last_email_sent = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `);
  updateStmt.run(cartId);

  // Insert email tracking record
  const insertStmt = db.prepare(`
    INSERT INTO abandoned_cart_emails (abandoned_cart_id, email_type)
    VALUES (?, ?)
  `);
  insertStmt.run(cartId, emailType);
}

// Mark cart as converted (purchase completed)
export function markCartAsConverted(cartId: number, orderId: string): void {
  const stmt = db.prepare(`
    UPDATE abandoned_carts
    SET converted = 1,
        recovered_at = datetime('now'),
        order_id = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(orderId, cartId);
}

// Mark cart as opted out
export function markCartAsOptedOut(token: string): void {
  const stmt = db.prepare(`
    UPDATE abandoned_carts
    SET opted_out = 1,
        updated_at = datetime('now')
    WHERE recovery_token = ?
  `);
  stmt.run(token);
}

// Delete old abandoned carts (>90 days)
export function deleteOldAbandonedCarts(): number {
  const stmt = db.prepare(`
    DELETE FROM abandoned_carts
    WHERE abandoned_at < datetime('now', '-90 days')
  `);

  const result = stmt.run();
  return result.changes;
}

// Get abandoned cart statistics
export function getAbandonedCartStats(): AbandonedCartStats {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_abandoned,
      SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as total_recovered,
      SUM(cart_value) as total_value_abandoned,
      SUM(CASE WHEN converted = 1 THEN cart_value ELSE 0 END) as total_value_recovered,
      SUM(email_sent_count) as emails_sent,
      SUM(CASE WHEN abandoned_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as recent_abandons
    FROM abandoned_carts
  `).get() as any;

  const recovery_rate = stats.total_abandoned > 0
    ? (stats.total_recovered / stats.total_abandoned) * 100
    : 0;

  return {
    total_abandoned: stats.total_abandoned || 0,
    total_recovered: stats.total_recovered || 0,
    total_value_abandoned: stats.total_value_abandoned || 0,
    total_value_recovered: stats.total_value_recovered || 0,
    recovery_rate: Math.round(recovery_rate * 100) / 100,
    emails_sent: stats.emails_sent || 0,
    recent_abandons: stats.recent_abandons || 0,
  };
}

// Get all abandoned carts for admin (with pagination)
export function getAbandonedCartsForAdmin(params: {
  page?: number;
  limit?: number;
  filter?: 'all' | 'pending' | 'recovered' | 'opted_out';
}): { carts: AbandonedCart[]; total: number } {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;

  let whereClause = '';
  switch (params.filter) {
    case 'pending':
      whereClause = 'WHERE converted = 0 AND opted_out = 0';
      break;
    case 'recovered':
      whereClause = 'WHERE converted = 1';
      break;
    case 'opted_out':
      whereClause = 'WHERE opted_out = 1';
      break;
    default:
      whereClause = '';
  }

  const carts = db.prepare(`
    SELECT * FROM abandoned_carts
    ${whereClause}
    ORDER BY abandoned_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as AbandonedCart[];

  const totalResult = db.prepare(`
    SELECT COUNT(*) as count FROM abandoned_carts ${whereClause}
  `).get() as { count: number };

  return {
    carts,
    total: totalResult.count,
  };
}

// Check if email has active abandoned cart
export function getActiveAbandonedCartByEmail(email: string): AbandonedCart | null {
  const stmt = db.prepare(`
    SELECT * FROM abandoned_carts
    WHERE email = ?
      AND converted = 0
      AND opted_out = 0
      AND abandoned_at >= datetime('now', '-7 days')
    ORDER BY abandoned_at DESC
    LIMIT 1
  `);

  return stmt.get(email) as AbandonedCart | null;
}

export default db;

