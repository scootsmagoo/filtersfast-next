/**
 * TaxJar Database Functions
 * SQLite operations for TaxJar logging and tracking
 */

import Database from 'better-sqlite3';

const db = new Database('filtersfast.db');

// ==================== Sales Tax Logs ====================

export interface TaxJarSalesTaxLog {
  id: number;
  order_id: string | null;
  sales_tax_request: string;
  sales_tax_response: string;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  created_at: number;
}

export interface CreateSalesTaxLogRequest {
  order_id?: string;
  sales_tax_request: string;
  sales_tax_response: string;
  status_code?: number;
  success: boolean;
  error_message?: string;
}

/**
 * Log a tax calculation request/response
 */
export function createSalesTaxLog(data: CreateSalesTaxLogRequest): TaxJarSalesTaxLog {
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO taxjar_sales_tax_logs (
      order_id, sales_tax_request, sales_tax_response, status_code, 
      success, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.order_id || null,
    data.sales_tax_request,
    data.sales_tax_response,
    data.status_code || null,
    data.success ? 1 : 0,
    data.error_message || null,
    now
  );

  return {
    id: Number(result.lastInsertRowid),
    order_id: data.order_id || null,
    sales_tax_request: data.sales_tax_request,
    sales_tax_response: data.sales_tax_response,
    status_code: data.status_code || null,
    success: data.success,
    error_message: data.error_message || null,
    created_at: now,
  };
}

/**
 * Get sales tax logs for an order
 */
export function getSalesTaxLogs(order_id: string): TaxJarSalesTaxLog[] {
  const stmt = db.prepare(`
    SELECT * FROM taxjar_sales_tax_logs 
    WHERE order_id = ? 
    ORDER BY created_at DESC
  `);
  
  const rows = stmt.all(order_id) as any[];
  
  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    sales_tax_request: row.sales_tax_request,
    sales_tax_response: row.sales_tax_response,
    status_code: row.status_code,
    success: Boolean(row.success),
    error_message: row.error_message,
    created_at: row.created_at,
  }));
}

/**
 * Get recent sales tax logs
 */
export function getRecentSalesTaxLogs(limit = 100): TaxJarSalesTaxLog[] {
  const stmt = db.prepare(`
    SELECT * FROM taxjar_sales_tax_logs 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    sales_tax_request: row.sales_tax_request,
    sales_tax_response: row.sales_tax_response,
    status_code: row.status_code,
    success: Boolean(row.success),
    error_message: row.error_message,
    created_at: row.created_at,
  }));
}

// ==================== Order Posts ====================

export interface TaxJarOrderPost {
  id: number;
  order_id: string;
  order_status: string;
  tj_resp_status: number | null;
  tj_response: string | null;
  success: boolean;
  created_at: number;
}

export interface CreateOrderPostRequest {
  order_id: string;
  order_status: string;
  tj_resp_status?: number;
  tj_response?: string;
  success: boolean;
}

/**
 * Log a TaxJar order post
 */
export function createOrderPost(data: CreateOrderPostRequest): TaxJarOrderPost {
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO taxjar_order_posts (
      order_id, order_status, tj_resp_status, tj_response, success, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.order_id,
    data.order_status,
    data.tj_resp_status || null,
    data.tj_response || null,
    data.success ? 1 : 0,
    now
  );

  return {
    id: Number(result.lastInsertRowid),
    order_id: data.order_id,
    order_status: data.order_status,
    tj_resp_status: data.tj_resp_status || null,
    tj_response: data.tj_response || null,
    success: data.success,
    created_at: now,
  };
}

/**
 * Get order posts for an order
 */
export function getOrderPosts(order_id: string): TaxJarOrderPost[] {
  const stmt = db.prepare(`
    SELECT * FROM taxjar_order_posts 
    WHERE order_id = ? 
    ORDER BY created_at DESC
  `);
  
  const rows = stmt.all(order_id) as any[];
  
  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    order_status: row.order_status,
    tj_resp_status: row.tj_resp_status,
    tj_response: row.tj_response,
    success: Boolean(row.success),
    created_at: row.created_at,
  }));
}

/**
 * Check if order was successfully posted to TaxJar
 */
export function isOrderPostedToTaxJar(order_id: string): boolean {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM taxjar_order_posts 
    WHERE order_id = ? AND success = 1 AND tj_resp_status = 201
  `);
  
  const result = stmt.get(order_id) as { count: number };
  return result.count > 0;
}

/**
 * Get recent order posts
 */
export function getRecentOrderPosts(limit = 100): TaxJarOrderPost[] {
  const stmt = db.prepare(`
    SELECT * FROM taxjar_order_posts 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    order_status: row.order_status,
    tj_resp_status: row.tj_resp_status,
    tj_response: row.tj_response,
    success: Boolean(row.success),
    created_at: row.created_at,
  }));
}

/**
 * Get failed order posts (for retry)
 */
export function getFailedOrderPosts(limit = 50): TaxJarOrderPost[] {
  const stmt = db.prepare(`
    SELECT * FROM taxjar_order_posts 
    WHERE success = 0 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    order_status: row.order_status,
    tj_resp_status: row.tj_resp_status,
    tj_response: row.tj_response,
    success: Boolean(row.success),
    created_at: row.created_at,
  }));
}

// ==================== Retry Queue ====================

export interface TaxJarRetryQueueItem {
  id: number;
  order_id: string;
  retry_count: number;
  last_error: string | null;
  next_retry_at: number;
  created_at: number;
}

export interface CreateRetryQueueItemRequest {
  order_id: string;
  last_error?: string;
  retry_delay_minutes?: number;
}

/**
 * Add an order to the retry queue
 */
export function addToRetryQueue(data: CreateRetryQueueItemRequest): TaxJarRetryQueueItem {
  const now = Date.now();
  const retryDelay = data.retry_delay_minutes || 60; // Default 1 hour
  const nextRetryAt = now + (retryDelay * 60 * 1000);
  
  // Check if already in queue
  const existingStmt = db.prepare(`
    SELECT * FROM taxjar_retry_queue WHERE order_id = ?
  `);
  const existing = existingStmt.get(data.order_id) as any;
  
  if (existing) {
    // Update existing entry
    const updateStmt = db.prepare(`
      UPDATE taxjar_retry_queue 
      SET retry_count = retry_count + 1,
          last_error = ?,
          next_retry_at = ?
      WHERE order_id = ?
    `);
    
    updateStmt.run(
      data.last_error || null,
      nextRetryAt,
      data.order_id
    );
    
    const updated = existingStmt.get(data.order_id) as any;
    return {
      id: updated.id,
      order_id: updated.order_id,
      retry_count: updated.retry_count,
      last_error: updated.last_error,
      next_retry_at: updated.next_retry_at,
      created_at: updated.created_at,
    };
  } else {
    // Insert new entry
    const insertStmt = db.prepare(`
      INSERT INTO taxjar_retry_queue (
        order_id, retry_count, last_error, next_retry_at, created_at
      ) VALUES (?, 1, ?, ?, ?)
    `);
    
    const result = insertStmt.run(
      data.order_id,
      data.last_error || null,
      nextRetryAt,
      now
    );
    
    return {
      id: Number(result.lastInsertRowid),
      order_id: data.order_id,
      retry_count: 1,
      last_error: data.last_error || null,
      next_retry_at: nextRetryAt,
      created_at: now,
    };
  }
}

/**
 * Get orders ready for retry
 */
export function getOrdersReadyForRetry(limit = 50): TaxJarRetryQueueItem[] {
  const now = Date.now();
  
  const stmt = db.prepare(`
    SELECT * FROM taxjar_retry_queue 
    WHERE next_retry_at <= ? AND retry_count < 5
    ORDER BY next_retry_at ASC 
    LIMIT ?
  `);
  
  const rows = stmt.all(now, limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    order_id: row.order_id,
    retry_count: row.retry_count,
    last_error: row.last_error,
    next_retry_at: row.next_retry_at,
    created_at: row.created_at,
  }));
}

/**
 * Remove an order from the retry queue
 */
export function removeFromRetryQueue(order_id: string): void {
  const stmt = db.prepare(`
    DELETE FROM taxjar_retry_queue WHERE order_id = ?
  `);
  
  stmt.run(order_id);
}

// ==================== Statistics ====================

export interface TaxJarStats {
  total_calculations: number;
  successful_calculations: number;
  failed_calculations: number;
  total_order_posts: number;
  successful_posts: number;
  failed_posts: number;
  pending_retries: number;
}

/**
 * Get TaxJar statistics
 */
export function getTaxJarStats(): TaxJarStats {
  // Calculation stats
  const calcStmt = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
    FROM taxjar_sales_tax_logs
  `);
  const calcStats = calcStmt.get() as { total: number; successful: number; failed: number };
  
  // Order post stats
  const postStmt = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
    FROM taxjar_order_posts
  `);
  const postStats = postStmt.get() as { total: number; successful: number; failed: number };
  
  // Retry queue count
  const retryStmt = db.prepare(`
    SELECT COUNT(*) as count FROM taxjar_retry_queue
  `);
  const retryCount = retryStmt.get() as { count: number };
  
  return {
    total_calculations: calcStats.total,
    successful_calculations: calcStats.successful,
    failed_calculations: calcStats.failed,
    total_order_posts: postStats.total,
    successful_posts: postStats.successful,
    failed_posts: postStats.failed,
    pending_retries: retryCount.count,
  };
}


