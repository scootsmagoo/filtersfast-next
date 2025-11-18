/**
 * Product Recommendations Database Operations
 * Handles tracking views, purchases, and generating recommendations
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type { Product } from '../types/product';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

// ============================================================================
// TYPES
// ============================================================================

export type RecommendationType =
  | 'frequently_bought_together'
  | 'similar'
  | 'trending'
  | 'cross_sell'
  | 'upsell'
  | 'recently_viewed'
  | 'personalized';

export interface ProductView {
  idView: number;
  idProduct: string;
  userId: string | null;
  sessionId: string | null;
  viewedAt: number;
  viewDuration: number | null;
  referrerUrl: string | null;
  sourceType: string | null;
  recommendationType: string | null;
}

export interface CoPurchase {
  idCoPurchase: number;
  idProduct1: string;
  idProduct2: string;
  coPurchaseCount: number;
  lastPurchasedAt: number;
  firstPurchasedAt: number;
  confidenceScore: number;
}

export interface ProductRecommendation {
  idRecommendation: number;
  idProduct: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  rank: number;
  score: number;
  algorithm: string | null;
  algorithmVersion: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RecommendationClick {
  idClick: number;
  idProduct: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  userId: string | null;
  sessionId: string | null;
  clickedAt: number;
  position: number | null;
  convertedToPurchase: boolean;
  convertedAt: number | null;
  orderId: string | null;
}

export interface UserProductInteraction {
  idInteraction: number;
  userId: string;
  idProduct: string;
  interactionType: 'view' | 'cart_add' | 'purchase' | 'wishlist_add';
  interactedAt: number;
  quantity: number;
  orderId: string | null;
  sessionId: string | null;
}

export interface RecommendationPerformance {
  idPerformance: number;
  idProduct: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  periodStart: number;
  periodEnd: number;
  impressions: number;
  clicks: number;
  purchases: number;
  revenue: number;
  clickThroughRate: number;
  conversionRate: number;
  revenuePerImpression: number;
  lastUpdated: number;
}

// ============================================================================
// PRODUCT VIEWS
// ============================================================================

/**
 * Track a product view
 */
export function trackProductView(data: {
  idProduct: string;
  userId?: string | null;
  sessionId?: string | null;
  viewDuration?: number | null;
  referrerUrl?: string | null;
  sourceType?: string | null;
  recommendationType?: string | null;
}): number {
  const db = getDb();
  
  // Sanitize and limit input lengths to prevent DoS
  const sanitized = {
    idProduct: String(data.idProduct || '').substring(0, 100),
    userId: data.userId ? String(data.userId).substring(0, 100) : null,
    sessionId: data.sessionId ? String(data.sessionId).substring(0, 200) : null,
    viewDuration: data.viewDuration && typeof data.viewDuration === 'number' 
      ? Math.max(0, Math.min(3600, Math.floor(data.viewDuration))) 
      : null,
    referrerUrl: data.referrerUrl ? String(data.referrerUrl).substring(0, 2048) : null,
    sourceType: data.sourceType ? String(data.sourceType).substring(0, 50) : null,
    recommendationType: data.recommendationType ? String(data.recommendationType).substring(0, 50) : null,
  };
  
  const stmt = db.prepare(`
    INSERT INTO product_views (
      idProduct, userId, sessionId, viewDuration,
      referrerUrl, sourceType, recommendationType
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    sanitized.idProduct,
    sanitized.userId,
    sanitized.sessionId,
    sanitized.viewDuration,
    sanitized.referrerUrl,
    sanitized.sourceType,
    sanitized.recommendationType
  );
  
  db.close();
  return result.lastInsertRowid as number;
}

/**
 * Get recent product views for a user
 */
export function getRecentProductViews(
  userId: string | null,
  sessionId: string | null,
  limit: number = 10
): ProductView[] {
  const db = getDb();
  
  let query = `
    SELECT * FROM product_views
    WHERE (userId = ? OR sessionId = ?)
    ORDER BY viewedAt DESC
    LIMIT ?
  `;
  
  const rows = db.prepare(query).all(userId || null, sessionId || null, limit) as any[];
  db.close();
  
  return rows.map(row => ({
    idView: row.idView,
    idProduct: row.idProduct,
    userId: row.userId,
    sessionId: row.sessionId,
    viewedAt: new Date(row.viewedAt).getTime(),
    viewDuration: row.viewDuration,
    referrerUrl: row.referrerUrl,
    sourceType: row.sourceType,
    recommendationType: row.recommendationType,
  }));
}

// ============================================================================
// CO-PURCHASES
// ============================================================================

/**
 * Record products bought together in an order
 */
export function recordCoPurchase(productIds: string[]): void {
  if (productIds.length < 2 || productIds.length > 100) return; // Limit to prevent DoS
  
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO product_co_purchases (
      idProduct1, idProduct2, coPurchaseCount,
      lastPurchasedAt, firstPurchasedAt, confidenceScore
    ) VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 50)
    ON CONFLICT(idProduct1, idProduct2) DO UPDATE SET
      coPurchaseCount = coPurchaseCount + 1,
      lastPurchasedAt = CURRENT_TIMESTAMP,
      confidenceScore = CASE
        WHEN coPurchaseCount + 1 >= 10 THEN 90
        WHEN coPurchaseCount + 1 >= 5 THEN 75
        WHEN coPurchaseCount + 1 >= 3 THEN 60
        ELSE 50
      END
  `);
  
  // Sanitize product IDs and record all pairs (ensuring product1 < product2)
  const sanitizedIds = productIds
    .map(id => String(id || '').substring(0, 100))
    .filter(id => id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id));
  
  if (sanitizedIds.length < 2) {
    db.close();
    return;
  }
  
  for (let i = 0; i < sanitizedIds.length; i++) {
    for (let j = i + 1; j < sanitizedIds.length; j++) {
      const product1 = sanitizedIds[i] < sanitizedIds[j] ? sanitizedIds[i] : sanitizedIds[j];
      const product2 = sanitizedIds[i] < sanitizedIds[j] ? sanitizedIds[j] : sanitizedIds[i];
      stmt.run(product1, product2);
    }
  }
  
  db.close();
}

/**
 * Get frequently bought together products
 */
export function getFrequentlyBoughtTogether(
  idProduct: string,
  limit: number = 10
): CoPurchase[] {
  const db = getDb();
  
  const query = `
    SELECT * FROM product_co_purchases
    WHERE (idProduct1 = ? OR idProduct2 = ?)
    ORDER BY coPurchaseCount DESC, confidenceScore DESC
    LIMIT ?
  `;
  
  const rows = db.prepare(query).all(idProduct, idProduct, limit) as any[];
  db.close();
  
  return rows.map(row => ({
    idCoPurchase: row.idCoPurchase,
    idProduct1: row.idProduct1,
    idProduct2: row.idProduct2,
    coPurchaseCount: row.coPurchaseCount,
    lastPurchasedAt: new Date(row.lastPurchasedAt).getTime(),
    firstPurchasedAt: new Date(row.firstPurchasedAt).getTime(),
    confidenceScore: row.confidenceScore,
  }));
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * Save a recommendation
 */
export function saveRecommendation(data: {
  idProduct: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  rank: number;
  score: number;
  algorithm?: string | null;
  algorithmVersion?: number;
}): number {
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO product_recommendations (
      idProduct, recommendedProductId, recommendationType,
      rank, score, algorithm, algorithmVersion
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(idProduct, recommendedProductId, recommendationType) DO UPDATE SET
      rank = excluded.rank,
      score = excluded.score,
      algorithm = excluded.algorithm,
      algorithmVersion = excluded.algorithmVersion,
      updatedAt = CURRENT_TIMESTAMP
  `);
  
  const result = stmt.run(
    data.idProduct,
    data.recommendedProductId,
    data.recommendationType,
    data.rank,
    data.score,
    data.algorithm || null,
    data.algorithmVersion || 1
  );
  
  db.close();
  return result.lastInsertRowid as number;
}

/**
 * Get recommendations for a product
 */
export function getRecommendations(
  idProduct: string,
  recommendationType?: RecommendationType,
  limit: number = 10
): ProductRecommendation[] {
  const db = getDb();
  
  let query = `
    SELECT pr.* FROM product_recommendations pr
    INNER JOIN products p ON pr.recommendedProductId = p.id
    WHERE pr.idProduct = ?
      AND pr.isActive = 1
      AND p.status = 'active'
  `;
  
  const params: any[] = [idProduct];
  
  if (recommendationType) {
    query += ` AND pr.recommendationType = ?`;
    params.push(recommendationType);
  }
  
  query += ` ORDER BY pr.rank ASC LIMIT ?`;
  params.push(limit);
  
  const rows = db.prepare(query).all(...params) as any[];
  db.close();
  
  return rows.map(row => ({
    idRecommendation: row.idRecommendation,
    idProduct: row.idProduct,
    recommendedProductId: row.recommendedProductId,
    recommendationType: row.recommendationType as RecommendationType,
    rank: row.rank,
    score: row.score,
    algorithm: row.algorithm,
    algorithmVersion: row.algorithmVersion,
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  }));
}

/**
 * Clear recommendations for a product (before regenerating)
 */
export function clearRecommendations(
  idProduct: string,
  recommendationType?: RecommendationType
): void {
  const db = getDb();
  
  if (recommendationType) {
    const stmt = db.prepare(`
      DELETE FROM product_recommendations
      WHERE idProduct = ? AND recommendationType = ?
    `);
    stmt.run(idProduct, recommendationType);
  } else {
    const stmt = db.prepare(`
      DELETE FROM product_recommendations
      WHERE idProduct = ?
    `);
    stmt.run(idProduct);
  }
  
  db.close();
}

// ============================================================================
// RECOMMENDATION CLICKS
// ============================================================================

/**
 * Track a recommendation click
 */
export function trackRecommendationClick(data: {
  idProduct: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  userId?: string | null;
  sessionId?: string | null;
  position?: number | null;
}): number {
  const db = getDb();
  
  // Sanitize and validate inputs
  const sanitized = {
    idProduct: String(data.idProduct || '').substring(0, 100),
    recommendedProductId: String(data.recommendedProductId || '').substring(0, 100),
    recommendationType: data.recommendationType,
    userId: data.userId ? String(data.userId).substring(0, 100) : null,
    sessionId: data.sessionId ? String(data.sessionId).substring(0, 200) : null,
    position: data.position && typeof data.position === 'number'
      ? Math.max(1, Math.min(1000, Math.floor(data.position)))
      : null,
  };
  
  const stmt = db.prepare(`
    INSERT INTO recommendation_clicks (
      idProduct, recommendedProductId, recommendationType,
      userId, sessionId, position
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    sanitized.idProduct,
    sanitized.recommendedProductId,
    sanitized.recommendationType,
    sanitized.userId,
    sanitized.sessionId,
    sanitized.position
  );
  
  db.close();
  return result.lastInsertRowid as number;
}

/**
 * Mark a recommendation click as converted to purchase
 */
export function markRecommendationClickConverted(
  idClick: number,
  orderId: string
): void {
  const db = getDb();
  
  const stmt = db.prepare(`
    UPDATE recommendation_clicks
    SET convertedToPurchase = 1,
        convertedAt = CURRENT_TIMESTAMP,
        orderId = ?
    WHERE idClick = ?
  `);
  
  stmt.run(orderId, idClick);
  db.close();
}

// ============================================================================
// USER INTERACTIONS
// ============================================================================

/**
 * Track a user-product interaction
 */
export function trackUserInteraction(data: {
  userId: string;
  idProduct: string;
  interactionType: 'view' | 'cart_add' | 'purchase' | 'wishlist_add';
  quantity?: number;
  orderId?: string | null;
  sessionId?: string | null;
}): number {
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO user_product_interactions (
      userId, idProduct, interactionType, quantity, orderId, sessionId
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.userId,
    data.idProduct,
    data.interactionType,
    data.quantity || 1,
    data.orderId || null,
    data.sessionId || null
  );
  
  db.close();
  return result.lastInsertRowid as number;
}

/**
 * Get user's product interaction history
 */
export function getUserProductHistory(
  userId: string,
  interactionType?: 'view' | 'cart_add' | 'purchase' | 'wishlist_add',
  limit: number = 50
): UserProductInteraction[] {
  const db = getDb();
  
  let query = `
    SELECT * FROM user_product_interactions
    WHERE userId = ?
  `;
  
  const params: any[] = [userId];
  
  if (interactionType) {
    query += ` AND interactionType = ?`;
    params.push(interactionType);
  }
  
  query += ` ORDER BY interactedAt DESC LIMIT ?`;
  params.push(limit);
  
  const rows = db.prepare(query).all(...params) as any[];
  db.close();
  
  return rows.map(row => ({
    idInteraction: row.idInteraction,
    userId: row.userId,
    idProduct: row.idProduct,
    interactionType: row.interactionType,
    interactedAt: new Date(row.interactedAt).getTime(),
    quantity: row.quantity,
    orderId: row.orderId,
    sessionId: row.sessionId,
  }));
}

// ============================================================================
// RECOMMENDATION PERFORMANCE
// ============================================================================

/**
 * Update recommendation performance metrics
 */
export function updateRecommendationPerformance(data: {
  idProduct: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  periodStart: number;
  periodEnd: number;
  impressions?: number;
  clicks?: number;
  purchases?: number;
  revenue?: number;
}): void {
  const db = getDb();
  
  // Calculate metrics
  const impressions = data.impressions || 0;
  const clicks = data.clicks || 0;
  const purchases = data.purchases || 0;
  const revenue = data.revenue || 0;
  
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const conversionRate = clicks > 0 ? purchases / clicks : 0;
  const revenuePerImpression = impressions > 0 ? revenue / impressions : 0;
  
  const stmt = db.prepare(`
    INSERT INTO recommendation_performance (
      idProduct, recommendedProductId, recommendationType,
      periodStart, periodEnd, impressions, clicks, purchases, revenue,
      clickThroughRate, conversionRate, revenuePerImpression
    ) VALUES (?, ?, ?, DATE(?, 'unixepoch'), DATE(?, 'unixepoch'), ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(idProduct, recommendedProductId, recommendationType, periodStart, periodEnd) DO UPDATE SET
      impressions = impressions + excluded.impressions,
      clicks = clicks + excluded.clicks,
      purchases = purchases + excluded.purchases,
      revenue = revenue + excluded.revenue,
      clickThroughRate = CASE
        WHEN impressions + excluded.impressions > 0
        THEN CAST(clicks + excluded.clicks AS REAL) / CAST(impressions + excluded.impressions AS REAL)
        ELSE 0
      END,
      conversionRate = CASE
        WHEN clicks + excluded.clicks > 0
        THEN CAST(purchases + excluded.purchases AS REAL) / CAST(clicks + excluded.clicks AS REAL)
        ELSE 0
      END,
      revenuePerImpression = CASE
        WHEN impressions + excluded.impressions > 0
        THEN (revenue + excluded.revenue) / CAST(impressions + excluded.impressions AS REAL)
        ELSE 0
      END,
      lastUpdated = CURRENT_TIMESTAMP
  `);
  
  stmt.run(
    data.idProduct,
    data.recommendedProductId,
    data.recommendationType,
    Math.floor(data.periodStart / 1000),
    Math.floor(data.periodEnd / 1000),
    impressions,
    clicks,
    purchases,
    revenue,
    ctr,
    conversionRate,
    revenuePerImpression
  );
  
  db.close();
}

/**
 * Get recommendation performance metrics
 */
export function getRecommendationPerformance(
  idProduct: string,
  recommendationType?: RecommendationType,
  days: number = 30
): RecommendationPerformance[] {
  const db = getDb();
  
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);
  
  let query = `
    SELECT * FROM recommendation_performance
    WHERE idProduct = ?
      AND periodStart >= DATE(?, 'unixepoch')
  `;
  
  const params: any[] = [idProduct, Math.floor(periodStart.getTime() / 1000)];
  
  if (recommendationType) {
    query += ` AND recommendationType = ?`;
    params.push(recommendationType);
  }
  
  query += ` ORDER BY periodStart DESC`;
  
  const rows = db.prepare(query).all(...params) as any[];
  db.close();
  
  return rows.map(row => ({
    idPerformance: row.idPerformance,
    idProduct: row.idProduct,
    recommendedProductId: row.recommendedProductId,
    recommendationType: row.recommendationType as RecommendationType,
    periodStart: new Date(row.periodStart).getTime(),
    periodEnd: new Date(row.periodEnd).getTime(),
    impressions: row.impressions,
    clicks: row.clicks,
    purchases: row.purchases,
    revenue: row.revenue,
    clickThroughRate: row.clickThroughRate,
    conversionRate: row.conversionRate,
    revenuePerImpression: row.revenuePerImpression,
    lastUpdated: new Date(row.lastUpdated).getTime(),
  }));
}

