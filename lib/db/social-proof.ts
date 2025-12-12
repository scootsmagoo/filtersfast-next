/**
 * Social Proof Database Operations
 * Handles tracking and retrieving real-time social proof data
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

// ============================================================================
// TYPES
// ============================================================================

export interface SocialProofData {
  productId: string;
  recentViews: number; // Views in last 5 minutes
  uniqueViewers: number; // Unique sessions viewing in last 5 minutes
  recentPurchases: number; // Purchases in last hour
  totalQuantityPurchased: number; // Total quantity purchased in last hour
}

// ============================================================================
// TRACKING FUNCTIONS
// ============================================================================

/**
 * Track a purchase for social proof
 * Called when an order is completed
 */
export function trackSocialProofPurchase(
  productId: string,
  orderId: string,
  quantity: number
): void {
  const db = getDb();
  
  try {
    // OWASP: Validate inputs
    if (typeof productId !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(productId)) {
      console.warn(`Invalid product ID format: ${productId}`);
      return;
    }
    if (typeof orderId !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(orderId)) {
      console.warn(`Invalid order ID format: ${orderId}`);
      return;
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
      console.warn(`Invalid quantity: ${quantity}`);
      return;
    }
    
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO social_proof_purchases (product_id, order_id, quantity, purchased_at)
      VALUES (?, ?, ?, ?)
    `).run(productId, orderId, quantity, now);
    
    // Clean up old records (older than 24 hours)
    db.prepare(`
      DELETE FROM social_proof_purchases
      WHERE purchased_at < ?
    `).run(now - (24 * 60 * 60 * 1000));
  } finally {
    db.close();
  }
}

/**
 * Track purchases for all products in an order
 */
export function trackOrderPurchases(orderId: string, orderItems: Array<{ productId: string; quantity: number }>): void {
  const db = getDb();
  
  try {
    // OWASP: Validate order ID format
    if (typeof orderId !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(orderId)) {
      console.warn(`Invalid order ID format: ${orderId}`);
      return;
    }
    
    // OWASP: Validate and filter order items
    const validProductIdPattern = /^[a-zA-Z0-9._-]{1,100}$/;
    const validItems = orderItems.filter(item => {
      if (!item || typeof item.productId !== 'string' || !validProductIdPattern.test(item.productId)) {
        console.warn(`Invalid product ID in order items: ${item?.productId}`);
        return false;
      }
      if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) {
        console.warn(`Invalid quantity in order items: ${item.quantity}`);
        return false;
      }
      return true;
    });
    
    if (validItems.length === 0) {
      return;
    }
    
    const now = Date.now();
    const insertStmt = db.prepare(`
      INSERT INTO social_proof_purchases (product_id, order_id, quantity, purchased_at)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const item of validItems) {
      insertStmt.run(item.productId, orderId, item.quantity, now);
    }
    
    // Clean up old records (older than 24 hours)
    db.prepare(`
      DELETE FROM social_proof_purchases
      WHERE purchased_at < ?
    `).run(now - (24 * 60 * 60 * 1000));
  } finally {
    db.close();
  }
}

// ============================================================================
// RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get social proof data for a single product
 */
export function getSocialProofData(productId: string): SocialProofData | null {
  const db = getDb();
  
  try {
    // OWASP: Validate product ID format to prevent injection
    if (typeof productId !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(productId)) {
      console.warn(`Invalid product ID format: ${productId}`);
      return null;
    }
    
    // Get recent views (last 5 minutes)
    const viewsResult = db.prepare(`
      SELECT 
        COUNT(*) as view_count,
        COUNT(DISTINCT sessionId) as unique_viewers
      FROM product_views
      WHERE idProduct = ? 
        AND viewedAt >= datetime('now', '-5 minutes')
    `).get(productId) as { view_count: number; unique_viewers: number } | undefined;
    
    // Get recent purchases (last hour)
    const purchasesResult = db.prepare(`
      SELECT 
        COUNT(*) as purchase_count,
        SUM(quantity) as total_quantity
      FROM social_proof_purchases
      WHERE product_id = ?
        AND purchased_at >= (strftime('%s', 'now') - 3600) * 1000
    `).get(productId) as { purchase_count: number; total_quantity: number | null } | undefined;
    
    return {
      productId,
      recentViews: viewsResult?.view_count || 0,
      uniqueViewers: viewsResult?.unique_viewers || 0,
      recentPurchases: purchasesResult?.purchase_count || 0,
      totalQuantityPurchased: purchasesResult?.total_quantity || 0,
    };
  } finally {
    db.close();
  }
}

/**
 * Get social proof data for multiple products
 */
export function getSocialProofDataBatch(productIds: string[]): Map<string, SocialProofData> {
  const db = getDb();
  const result = new Map<string, SocialProofData>();
  
  try {
    if (productIds.length === 0) {
      return result;
    }
    
    // OWASP: Validate and sanitize product IDs to prevent injection
    // Only allow alphanumeric, hyphens, underscores, and dots (max 100 chars)
    const validProductIdPattern = /^[a-zA-Z0-9._-]{1,100}$/;
    const sanitizedProductIds = productIds.filter(id => {
      if (typeof id !== 'string' || !validProductIdPattern.test(id)) {
        console.warn(`Invalid product ID filtered out: ${id}`);
        return false;
      }
      return true;
    });
    
    if (sanitizedProductIds.length === 0) {
      return result;
    }
    
    const placeholders = sanitizedProductIds.map(() => '?').join(',');
    
    // Get recent views (last 5 minutes) for all products
    const viewsResults = db.prepare(`
      SELECT 
        idProduct,
        COUNT(*) as view_count,
        COUNT(DISTINCT sessionId) as unique_viewers
      FROM product_views
      WHERE idProduct IN (${placeholders})
        AND viewedAt >= datetime('now', '-5 minutes')
      GROUP BY idProduct
    `).all(...sanitizedProductIds) as Array<{ idProduct: string; view_count: number; unique_viewers: number }>;
    
    // Get recent purchases (last hour) for all products
    const purchasesResults = db.prepare(`
      SELECT 
        product_id,
        COUNT(*) as purchase_count,
        SUM(quantity) as total_quantity
      FROM social_proof_purchases
      WHERE product_id IN (${placeholders})
        AND purchased_at >= (strftime('%s', 'now') - 3600) * 1000
      GROUP BY product_id
    `).all(...sanitizedProductIds) as Array<{ product_id: string; purchase_count: number; total_quantity: number | null }>;
    
    // Initialize all products with zero counts
    for (const productId of sanitizedProductIds) {
      result.set(productId, {
        productId,
        recentViews: 0,
        uniqueViewers: 0,
        recentPurchases: 0,
        totalQuantityPurchased: 0,
      });
    }
    
    // Update with view data
    for (const view of viewsResults) {
      const data = result.get(view.idProduct);
      if (data) {
        data.recentViews = view.view_count;
        data.uniqueViewers = view.unique_viewers;
      }
    }
    
    // Update with purchase data
    for (const purchase of purchasesResults) {
      const data = result.get(purchase.product_id);
      if (data) {
        data.recentPurchases = purchase.purchase_count;
        data.totalQuantityPurchased = purchase.total_quantity || 0;
      }
    }
    
    return result;
  } finally {
    db.close();
  }
}

/**
 * Check if social proof is enabled for a product
 */
export function isSocialProofEnabled(productId: string): boolean {
  const db = getDb();
  
  try {
    // OWASP: Validate product ID format
    if (typeof productId !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(productId)) {
      return false;
    }
    
    const result = db.prepare(`
      SELECT social_proof_enabled
      FROM products
      WHERE id = ?
    `).get(productId) as { social_proof_enabled: number | null } | undefined;
    
    // Default to enabled if not set
    return result?.social_proof_enabled !== 0;
  } finally {
    db.close();
  }
}

/**
 * Enable or disable social proof for a product
 */
export function setSocialProofEnabled(productId: string, enabled: boolean): void {
  const db = getDb();
  
  try {
    // OWASP: Validate product ID format
    if (typeof productId !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(productId)) {
      throw new Error('Invalid product ID format');
    }
    
    db.prepare(`
      UPDATE products
      SET social_proof_enabled = ?
      WHERE id = ?
    `).run(enabled ? 1 : 0, productId);
  } finally {
    db.close();
  }
}

