/**
 * Product Database Operations
 * Helper functions for CRUD operations on products
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { stringifyCsv } from '../utils/csv';
import type { 
  Product, 
  ProductFilters, 
  ProductListResponse, 
  ProductStats, 
  ProductHistoryEntry,
  ProductCategory,
  ProductFormData,
  ProductStatus,
  ProductImportRow,
  BulkStatusUpdateInput,
  BulkStatusUpdateResult,
  BulkPriceUpdateInput,
  BulkPriceUpdateResult,
  BulkInventoryUpdateInput,
  BulkInventoryUpdateResult,
  ProductImportOptions,
  ProductImportResult
} from '../types/product';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely parse JSON with fallback
 */
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Convert database row to Product object
 */
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    brand: row.brand,
    description: row.description,
    shortDescription: row.short_description,
    type: row.type,
    status: row.status,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    costPrice: row.cost_price,
    trackInventory: Boolean(row.track_inventory),
    inventoryQuantity: row.inventory_quantity,
    lowStockThreshold: row.low_stock_threshold,
    allowBackorder: Boolean(row.allow_backorder),
    dimensions: safeJsonParse(row.dimensions, null),
    mervRating: row.merv_rating,
    features: safeJsonParse(row.features, []),
    specifications: safeJsonParse(row.specifications, {}),
    compatibleModels: safeJsonParse(row.compatible_models, []),
    images: safeJsonParse(row.images, []),
    primaryImage: row.primary_image,
    hasVariants: Boolean(row.has_variants),
    variants: safeJsonParse(row.variants, []),
    categoryIds: safeJsonParse(row.category_ids, []),
    tags: safeJsonParse(row.tags, []),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    rating: row.rating,
    reviewCount: row.review_count,
    isFeatured: Boolean(row.is_featured),
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    madeInUSA: Boolean(row.made_in_usa),
    freeShipping: Boolean(row.free_shipping),
    badges: safeJsonParse(row.badges, []),
    subscriptionEligible: Boolean(row.subscription_eligible),
    subscriptionDiscount: row.subscription_discount,
    relatedProductIds: safeJsonParse(row.related_product_ids, []),
    crossSellProductIds: safeJsonParse(row.cross_sell_product_ids, []),
    weight: row.weight,
    requiresShipping: Boolean(row.requires_shipping),
    shippingClass: row.shipping_class,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    publishedAt: row.published_at,
    viewCount: row.view_count,
    orderCount: row.order_count,
    revenue: row.revenue
  };
}

/**
 * Generate unique slug from name
 */
export function generateSlug(name: string, existingId?: string): string {
  const db = getDb();
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?')
      .get(slug, existingId || '');
    
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  db.close();
  return slug;
}

/**
 * Generate unique SKU
 */
export function generateSKU(brand: string, type: string): string {
  const db = getDb();
  const prefix = `${brand.substring(0, 2).toUpperCase()}-${type.substring(0, 2).toUpperCase()}`;
  
  let counter = 1000;
  let sku = `${prefix}-${counter}`;
  
  while (true) {
    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (!existing) break;
    counter++;
    sku = `${prefix}-${counter}`;
  }
  
  db.close();
  return sku;
}

// ============================================================================
// PRODUCT CRUD OPERATIONS
// ============================================================================

/**
 * Get product by ID
 */
export function getProductById(id: string): Product | null {
  const db = getDb();
  
  try {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!row) return null;
    return rowToProduct(row);
  } finally {
    db.close();
  }
}

/**
 * Get product by SKU
 */
export function getProductBySKU(sku: string): Product | null {
  const db = getDb();
  
  try {
    const row = db.prepare('SELECT * FROM products WHERE sku = ?').get(sku);
    if (!row) return null;
    return rowToProduct(row);
  } finally {
    db.close();
  }
}

/**
 * Get product by slug
 */
export function getProductBySlug(slug: string): Product | null {
  const db = getDb();
  
  try {
    const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug);
    if (!row) return null;
    return rowToProduct(row);
  } finally {
    db.close();
  }
}

/**
 * List products with filters and pagination
 */
export function listProducts(filters: ProductFilters = {}): ProductListResponse {
  const db = getDb();
  
  try {
    const {
      status,
      type,
      brand,
      categoryId,
      search,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      mervRating,
      sortBy = 'updated',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = filters;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    // Apply filters
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    if (categoryId) {
      // Sanitize categoryId to prevent injection (alphanumeric, hyphens only)
      const safeCategoryId = categoryId.replace(/[^a-zA-Z0-9\-]/g, '');
      query += ' AND category_ids LIKE ?';
      params.push(`%"${safeCategoryId}"%`);
    }

    if (search) {
      // Sanitize search input (already validated in API, but double-check)
      const safeSearch = search.substring(0, 200);
      query += ' AND (name LIKE ? OR sku LIKE ? OR brand LIKE ? OR description LIKE ?)';
      const searchTerm = `%${safeSearch}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (minPrice !== undefined) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }

    if (inStock) {
      query += ' AND inventory_quantity > 0';
    }

    if (isFeatured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(isFeatured ? 1 : 0);
    }

    if (mervRating) {
      query += ' AND merv_rating = ?';
      params.push(mervRating);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Apply sorting
    const validSortColumns: Record<string, string> = {
      name: 'name',
      price: 'price',
      created: 'created_at',
      updated: 'updated_at',
      popularity: 'order_count'
    };

    const sortColumn = validSortColumns[sortBy] || 'updated_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Apply pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const rows = db.prepare(query).all(...params);
    const products = rows.map(rowToProduct);

    return {
      products,
      total,
      limit,
      offset,
      hasMore: offset + products.length < total
    };
  } finally {
    db.close();
  }
}

/**
 * Create new product
 */
export function createProduct(data: ProductFormData, userId: string, userName: string): Product {
  const db = getDb();
  
  try {
    const now = Date.now();
    const id = `prod-${now}-${Math.random().toString(36).substring(7)}`;
    const slug = generateSlug(data.name);
    const isGiftCard = data.type === 'gift-card';

    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, slug, sku, brand, description, short_description, type, status,
        price, compare_at_price, cost_price,
        track_inventory, inventory_quantity, low_stock_threshold, allow_backorder,
        dimensions, merv_rating, features, specifications, compatible_models,
        images, primary_image, has_variants, variants,
        category_ids, tags,
        meta_title, meta_description, meta_keywords,
        is_featured, is_new, is_best_seller, made_in_usa, free_shipping, badges,
        subscription_eligible, subscription_discount,
        related_product_ids, cross_sell_product_ids,
        weight, requires_shipping, shipping_class,
        created_at, updated_at, created_by, updated_by, published_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    // Parse JSON fields
    const features = data.features ? JSON.stringify(data.features.split('\n').filter(f => f.trim())) : '[]';
    const specs = data.specifications ? JSON.stringify(Object.fromEntries(
      data.specifications.split('\n').map(line => {
        const [key, ...valueParts] = line.split(':');
        return [key?.trim(), valueParts.join(':').trim()];
      }).filter(([k, v]) => k && v)
    )) : '{}';
    const compatModels = data.compatibleModels ? JSON.stringify(
      data.compatibleModels.split('\n').filter(m => m.trim())
    ) : '[]';
    const dimensions = isGiftCard ? null : (data.height || data.width || data.depth) ? JSON.stringify({
      height: data.height,
      width: data.width,
      depth: data.depth,
      weight: data.weight
    }) : null;
    const images = data.primaryImage ? JSON.stringify([
      { url: data.primaryImage, alt: data.name, isPrimary: true, sortOrder: 0 }
    ]) : '[]';

    stmt.run(
      id, data.name, slug, data.sku, data.brand, data.description, data.shortDescription,
      data.type, data.status,
      data.price, data.compareAtPrice, data.costPrice,
      isGiftCard ? 0 : (data.trackInventory ? 1 : 0),
      isGiftCard ? 0 : data.inventoryQuantity,
      isGiftCard ? 0 : data.lowStockThreshold,
      isGiftCard ? 0 : (data.allowBackorder ? 1 : 0),
      dimensions, data.mervRating, features, specs, compatModels,
      images, data.primaryImage, 0, '[]',
      JSON.stringify(data.categoryIds), JSON.stringify(data.tags),
      data.metaTitle, data.metaDescription, data.metaKeywords,
      data.isFeatured ? 1 : 0, data.isNew ? 1 : 0, data.isBestSeller ? 1 : 0, 
      data.madeInUSA ? 1 : 0, isGiftCard ? 1 : (data.freeShipping ? 1 : 0), '[]',
      isGiftCard ? 0 : (data.subscriptionEligible ? 1 : 0),
      isGiftCard ? 0 : data.subscriptionDiscount,
      '[]', '[]',
      isGiftCard ? 0 : data.weight,
      isGiftCard ? 0 : 1,
      null,
      now, now, userId, userId, data.status === 'active' ? now : null
    );

    // Log history
    logProductHistory(id, 'created', {}, userId, userName, 'Product created');

    return getProductById(id)!;
  } finally {
    db.close();
  }
}

/**
 * Update product
 */
export function updateProduct(id: string, data: Partial<ProductFormData>, userId: string, userName: string): Product {
  const db = getDb();
  
  try {
    const existing = getProductById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const now = Date.now();
    const updates: string[] = [];
    const params: any[] = [];
    const changes: Record<string, { old: any; new: any }> = {};

    // Helper to add update field
    const addUpdate = (field: string, value: any, dbField: string, oldValue: any) => {
      if (value !== undefined && value !== oldValue) {
        updates.push(`${dbField} = ?`);
        params.push(value);
        changes[field] = { old: oldValue, new: value };
      }
    };

    // Basic fields
    if (data.name) addUpdate('name', data.name, 'name', existing.name);
    if (data.brand) addUpdate('brand', data.brand, 'brand', existing.brand);
    if (data.description !== undefined) addUpdate('description', data.description, 'description', existing.description);
    if (data.shortDescription !== undefined) addUpdate('shortDescription', data.shortDescription, 'short_description', existing.shortDescription);
    if (data.type) addUpdate('type', data.type, 'type', existing.type);
    if (data.status) addUpdate('status', data.status, 'status', existing.status);
    
    // Pricing
    if (data.price !== undefined) addUpdate('price', data.price, 'price', existing.price);
    if (data.compareAtPrice !== undefined) addUpdate('compareAtPrice', data.compareAtPrice, 'compare_at_price', existing.compareAtPrice);
    if (data.costPrice !== undefined) addUpdate('costPrice', data.costPrice, 'cost_price', existing.costPrice);
    
    // Inventory
    if (data.trackInventory !== undefined) addUpdate('trackInventory', data.trackInventory ? 1 : 0, 'track_inventory', existing.trackInventory);
    if (data.inventoryQuantity !== undefined) addUpdate('inventoryQuantity', data.inventoryQuantity, 'inventory_quantity', existing.inventoryQuantity);
    if (data.lowStockThreshold !== undefined) addUpdate('lowStockThreshold', data.lowStockThreshold, 'low_stock_threshold', existing.lowStockThreshold);
    if (data.allowBackorder !== undefined) addUpdate('allowBackorder', data.allowBackorder ? 1 : 0, 'allow_backorder', existing.allowBackorder);

    // Flags
    if (data.isFeatured !== undefined) addUpdate('isFeatured', data.isFeatured ? 1 : 0, 'is_featured', existing.isFeatured);
    if (data.isNew !== undefined) addUpdate('isNew', data.isNew ? 1 : 0, 'is_new', existing.isNew);
    if (data.isBestSeller !== undefined) addUpdate('isBestSeller', data.isBestSeller ? 1 : 0, 'is_best_seller', existing.isBestSeller);
    if (data.madeInUSA !== undefined) addUpdate('madeInUSA', data.madeInUSA ? 1 : 0, 'made_in_usa', existing.madeInUSA);
    if (data.freeShipping !== undefined) addUpdate('freeShipping', data.freeShipping ? 1 : 0, 'free_shipping', existing.freeShipping);

    const nextType = data.type ?? existing.type;
    const enforceGiftCardDefaults = nextType === 'gift-card';
    const hasUpdateFor = (column: string) => updates.some(update => update.startsWith(`${column} =`));

    if (enforceGiftCardDefaults) {
      const enforceBooleanField = (
        fieldKey: keyof typeof changes,
        column: string,
        desired: number,
        current: boolean
      ) => {
        if (!hasUpdateFor(column) && Number(current) !== desired) {
          updates.push(`${column} = ?`);
          params.push(desired);
          changes[fieldKey as string] = { old: current, new: Boolean(desired) };
        }
      };

      const enforceNumericField = (
        fieldKey: keyof typeof changes,
        column: string,
        desired: number,
        current: number
      ) => {
        if (!hasUpdateFor(column) && current !== desired) {
          updates.push(`${column} = ?`);
          params.push(desired);
          changes[fieldKey as string] = { old: current, new: desired };
        }
      };

      if (!hasUpdateFor('dimensions') && existing.dimensions !== null) {
        updates.push('dimensions = ?');
        params.push(null);
        changes.dimensions = { old: existing.dimensions, new: null };
      }

      enforceBooleanField('trackInventory', 'track_inventory', 0, existing.trackInventory);
      enforceNumericField('inventoryQuantity', 'inventory_quantity', 0, existing.inventoryQuantity);
      enforceNumericField('lowStockThreshold', 'low_stock_threshold', 0, existing.lowStockThreshold);
      enforceBooleanField('allowBackorder', 'allow_backorder', 0, existing.allowBackorder);
      enforceBooleanField('subscriptionEligible', 'subscription_eligible', 0, existing.subscriptionEligible);
      enforceNumericField('subscriptionDiscount', 'subscription_discount', 0, existing.subscriptionDiscount);
      enforceBooleanField('freeShipping', 'free_shipping', 1, existing.freeShipping);

      if (!hasUpdateFor('weight') && existing.weight !== 0) {
        updates.push('weight = ?');
        params.push(0);
        changes.weight = { old: existing.weight, new: 0 };
      }

      if (!hasUpdateFor('requires_shipping') && existing.requiresShipping) {
        updates.push('requires_shipping = ?');
        params.push(0);
        changes.requiresShipping = { old: existing.requiresShipping, new: false };
      }
    }

    // Always update timestamps and user
    updates.push('updated_at = ?', 'updated_by = ?');
    params.push(now, userId);

    if (updates.length === 2) {
      // Only timestamp/user updates, no actual changes
      db.close();
      return existing;
    }

    // Execute update
    params.push(id);
    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);

    // Log history
    logProductHistory(id, 'updated', changes, userId, userName, 'Product updated');

    return getProductById(id)!;
  } finally {
    db.close();
  }
}

/**
 * Delete product (soft delete by archiving)
 */
export function deleteProduct(id: string, userId: string, userName: string): boolean {
  const db = getDb();
  
  try {
    const existing = getProductById(id);
    if (!existing) return false;

    // Soft delete: archive the product
    db.prepare('UPDATE products SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?')
      .run('archived', Date.now(), userId, id);

    // Log history
    logProductHistory(id, 'deleted', {}, userId, userName, 'Product archived');

    return true;
  } finally {
    db.close();
  }
}

/**
 * Permanently delete product (hard delete)
 */
export function permanentlyDeleteProduct(id: string, userId: string, userName: string): boolean {
  const db = getDb();
  
  try {
    const existing = getProductById(id);
    if (!existing) return false;

    // Log before deletion
    logProductHistory(id, 'deleted', {}, userId, userName, 'Product permanently deleted');

    // Hard delete
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    return true;
  } finally {
    db.close();
  }
}

// ============================================================================
// PRODUCT HISTORY & AUDIT LOG
// ============================================================================

/**
 * Log product history entry with audit details
 */
export function logProductHistory(
  productId: string,
  action: ProductHistoryEntry['action'],
  changes: Record<string, { old: any; new: any }>,
  userId: string,
  userName: string,
  notes?: string,
  ipAddress?: string,
  userAgent?: string
): void {
  const db = getDb();
  
  try {
    const id = `hist-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Enhanced audit logging with IP and user agent
    const auditDetails = {
      changes,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.substring(0, 200) : null
    };
    
    db.prepare(`
      INSERT INTO product_history 
      (id, product_id, action, changes, performed_by, performed_by_name, timestamp, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, productId, action, JSON.stringify(auditDetails), userId, userName, Date.now(), notes || null
    );
  } catch (error) {
    // Don't fail the operation if logging fails
    console.error('Failed to log product history:', error);
  } finally {
    db.close();
  }
}

/**
 * Get product history
 */
export function getProductHistory(productId: string, limit = 50): ProductHistoryEntry[] {
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT * FROM product_history 
      WHERE product_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(productId, limit);

    return rows.map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      action: row.action,
      changes: safeJsonParse(row.changes, {}),
      performedBy: row.performed_by,
      performedByName: row.performed_by_name,
      timestamp: row.timestamp,
      notes: row.notes
    }));
  } finally {
    db.close();
  }
}

// ============================================================================
// PRODUCT CATEGORIES
// ============================================================================

/**
 * Get all categories
 */
export function getAllCategories(): ProductCategory[] {
  const db = getDb();
  
  try {
    const rows = db.prepare('SELECT * FROM product_categories WHERE is_active = 1 ORDER BY sort_order, name').all();
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      parentId: row.parent_id
    }));
  } finally {
    db.close();
  }
}

// ============================================================================
// PRODUCT STATISTICS
// ============================================================================

/**
 * Get product statistics
 */
export function getProductStats(): ProductStats {
  const db = getDb();
  
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'out-of-stock' THEN 1 ELSE 0 END) as outOfStock,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
        SUM(CASE WHEN inventory_quantity <= low_stock_threshold AND status = 'active' THEN 1 ELSE 0 END) as lowStock,
        AVG(price) as avgPrice,
        SUM(inventory_quantity * cost_price) as totalInventoryValue
      FROM products
    `).get() as any;

    const typeStats = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM products
      GROUP BY type
    `).all() as any[];

    const brandStats = db.prepare(`
      SELECT brand, COUNT(*) as count
      FROM products
      GROUP BY brand
      ORDER BY count DESC
      LIMIT 10
    `).all() as any[];

    const productsByType: Record<string, number> = {};
    typeStats.forEach((row: any) => {
      productsByType[row.type] = row.count;
    });

    const productsByBrand: Record<string, number> = {};
    brandStats.forEach((row: any) => {
      productsByBrand[row.brand] = row.count;
    });

    return {
      totalProducts: stats.total || 0,
      activeProducts: stats.active || 0,
      draftProducts: stats.draft || 0,
      outOfStockProducts: stats.outOfStock || 0,
      archivedProducts: stats.archived || 0,
      lowStockProducts: stats.lowStock || 0,
      productsByType,
      productsByBrand,
      averagePrice: stats.avgPrice || 0,
      totalInventoryValue: stats.totalInventoryValue || 0,
      revenueByProduct: []  // TODO: Calculate from orders
    };
  } finally {
    db.close();
  }
}

/**
 * Get distinct brands
 */
export function getBrands(): string[] {
  const db = getDb();
  
  try {
    const rows = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand').all();
    return rows.map((row: any) => row.brand);
  } finally {
    db.close();
  }
}

/**
 * Increment product view count
 */
export function incrementProductViews(productId: string, userId?: string, sessionId?: string, ipAddress?: string): void {
  const db = getDb();
  
  try {
    const now = Date.now();
    const viewId = `view-${now}-${Math.random().toString(36).substring(7)}`;
    
    // Log view
    db.prepare(`
      INSERT INTO product_views (id, product_id, user_id, session_id, ip_address, viewed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(viewId, productId, userId || null, sessionId || null, ipAddress || null, now);

    // Increment count
    db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(productId);
  } finally {
    db.close();
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

function normalizeProductIdMap<T extends { productId: string }>(entries: T[]): Map<string, T> {
  const map = new Map<string, T>();
  entries.forEach((entry) => {
    const id = entry.productId?.trim();
    if (!id) return;
    map.set(id, { ...map.get(id), ...entry });
  });
  return map;
}

function createChangeRecord(oldValue: any, newValue: any) {
  return { old: oldValue, new: newValue };
}

export function bulkUpdateProductStatus(
  updates: BulkStatusUpdateInput[],
  userId: string,
  userName: string,
  note?: string
): BulkStatusUpdateResult {
  const aggregated = normalizeProductIdMap(updates);
  const productIds = Array.from(aggregated.keys());

  if (productIds.length === 0) {
    return { updated: 0, skipped: 0, notFound: [], errors: [] };
  }

  const db = getDb();

  try {
    const placeholders = productIds.map(() => '?').join(',');
    const existingRows = db
      .prepare(`SELECT id, status FROM products WHERE id IN (${placeholders})`)
      .all(...productIds) as Array<{ id: string; status: string }>;
    const existingMap = new Map(existingRows.map((row) => [row.id, row]));

    const notFound: string[] = [];
    const errors: Array<{ productId: string; error: string }> = [];
    const changes: Array<{ productId: string; change: { status: { old: string; new: string } } }> = [];
    let updated = 0;
    let skipped = 0;
    const now = Date.now();

    const transaction = db.transaction(() => {
      productIds.forEach((productId) => {
        const update = aggregated.get(productId);
        const existing = existingMap.get(productId);

        if (!update || !existing) {
          notFound.push(productId);
          return;
        }

        const targetStatus = update.newStatus;
        if (existing.status === targetStatus) {
          skipped++;
          return;
        }

        try {
          db.prepare(
            `
            UPDATE products
            SET status = ?, updated_at = ?, updated_by = ?, published_at = CASE WHEN ? = 'active' THEN COALESCE(published_at, ?) ELSE NULL END
            WHERE id = ?
          `
          ).run(targetStatus, now, userId, targetStatus, now, productId);

          updated++;
          changes.push({
            productId,
            change: {
              status: {
                old: existing.status,
                new: targetStatus
              }
            }
          });
        } catch (error) {
          errors.push({
            productId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    });

    transaction();

    changes.forEach(({ productId, change }) => {
      logProductHistory(
        productId,
        'status-changed',
        change,
        userId,
        userName,
        note || 'Bulk status update'
      );
    });

    return {
      updated,
      skipped,
      notFound,
      errors
    };
  } finally {
    db.close();
  }
}

export function bulkUpdateProductPrices(
  updates: BulkPriceUpdateInput[],
  userId: string,
  userName: string,
  note?: string
): BulkPriceUpdateResult {
  const aggregated = normalizeProductIdMap(updates);
  const productIds = Array.from(aggregated.keys());

  if (productIds.length === 0) {
    return { updated: 0, skipped: 0, notFound: [], errors: [] };
  }

  const db = getDb();

  try {
    const placeholders = productIds.map(() => '?').join(',');
    const existingRows = db
      .prepare(
        `SELECT id, price, compare_at_price, cost_price FROM products WHERE id IN (${placeholders})`
      )
      .all(...productIds) as Array<{
        id: string
        price: number
        compare_at_price: number | null
        cost_price: number | null
      }>;

    const existingMap = new Map(existingRows.map((row) => [row.id, row]));

    const notFound: string[] = [];
    const errors: Array<{ productId: string; error: string }> = [];
    const changes: Array<{ productId: string; change: Record<string, { old: any; new: any }> }> =
      [];
    let updated = 0;
    let skipped = 0;
    const now = Date.now();

    const transaction = db.transaction(() => {
      productIds.forEach((productId) => {
        const update = aggregated.get(productId);
        const existing = existingMap.get(productId);

        if (!update || !existing) {
          notFound.push(productId);
          return;
        }

        const setClauses: string[] = [];
        const params: any[] = [];
        const changeRecord: Record<string, { old: any; new: any }> = {};

        if (update.price !== undefined && update.price !== existing.price) {
          setClauses.push('price = ?');
          params.push(update.price);
          changeRecord.price = createChangeRecord(existing.price, update.price);
        }

        if (update.compareAtPrice !== undefined && update.compareAtPrice !== existing.compare_at_price) {
          setClauses.push('compare_at_price = ?');
          params.push(update.compareAtPrice);
          changeRecord.compareAtPrice = createChangeRecord(existing.compare_at_price, update.compareAtPrice);
        }

        if (update.costPrice !== undefined && update.costPrice !== existing.cost_price) {
          setClauses.push('cost_price = ?');
          params.push(update.costPrice);
          changeRecord.costPrice = createChangeRecord(existing.cost_price, update.costPrice);
        }

        if (setClauses.length === 0) {
          skipped++;
          return;
        }

        setClauses.push('updated_at = ?');
        setClauses.push('updated_by = ?');
        params.push(now, userId, productId);

        try {
          const query = `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`;
          db.prepare(query).run(...params);
          updated++;
          changes.push({ productId, change: changeRecord });
        } catch (error) {
          errors.push({
            productId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    });

    transaction();

    changes.forEach(({ productId, change }) => {
      logProductHistory(
        productId,
        'price-changed',
        change,
        userId,
        userName,
        note || 'Bulk price update'
      );
    });

    return {
      updated,
      skipped,
      notFound,
      errors
    };
  } finally {
    db.close();
  }
}

export function bulkUpdateProductInventory(
  updates: BulkInventoryUpdateInput[],
  userId: string,
  userName: string,
  note?: string
): BulkInventoryUpdateResult {
  const aggregated = normalizeProductIdMap(updates);
  const productIds = Array.from(aggregated.keys());

  if (productIds.length === 0) {
    return { updated: 0, skipped: 0, notFound: [], errors: [] };
  }

  const db = getDb();

  try {
    const placeholders = productIds.map(() => '?').join(',');
    const existingRows = db
      .prepare(
        `SELECT id, inventory_quantity, low_stock_threshold, allow_backorder, track_inventory FROM products WHERE id IN (${placeholders})`
      )
      .all(...productIds) as Array<{
        id: string
        inventory_quantity: number
        low_stock_threshold: number
        allow_backorder: number
        track_inventory: number
      }>;

    const existingMap = new Map(existingRows.map((row) => [row.id, row]));

    const notFound: string[] = [];
    const errors: Array<{ productId: string; error: string }> = [];
    const changes: Array<{ productId: string; change: Record<string, { old: any; new: any }> }> =
      [];
    let updated = 0;
    let skipped = 0;
    const now = Date.now();

    const transaction = db.transaction(() => {
      productIds.forEach((productId) => {
        const update = aggregated.get(productId);
        const existing = existingMap.get(productId);

        if (!update || !existing) {
          notFound.push(productId);
          return;
        }

        const setClauses: string[] = [];
        const params: any[] = [];
        const changeRecord: Record<string, { old: any; new: any }> = {};

        if (
          update.inventoryQuantity !== undefined &&
          update.inventoryQuantity !== existing.inventory_quantity
        ) {
          setClauses.push('inventory_quantity = ?');
          params.push(update.inventoryQuantity);
          changeRecord.inventoryQuantity = createChangeRecord(
            existing.inventory_quantity,
            update.inventoryQuantity
          );
        }

        if (
          update.lowStockThreshold !== undefined &&
          update.lowStockThreshold !== existing.low_stock_threshold
        ) {
          setClauses.push('low_stock_threshold = ?');
          params.push(update.lowStockThreshold);
          changeRecord.lowStockThreshold = createChangeRecord(
            existing.low_stock_threshold,
            update.lowStockThreshold
          );
        }

        if (update.allowBackorder !== undefined) {
          const allowBackorderInt = update.allowBackorder ? 1 : 0;
          if (allowBackorderInt !== existing.allow_backorder) {
            setClauses.push('allow_backorder = ?');
            params.push(allowBackorderInt);
            changeRecord.allowBackorder = createChangeRecord(
              existing.allow_backorder === 1,
              update.allowBackorder
            );
          }
        }

        if (update.trackInventory !== undefined) {
          const trackInventoryInt = update.trackInventory ? 1 : 0;
          if (trackInventoryInt !== existing.track_inventory) {
            setClauses.push('track_inventory = ?');
            params.push(trackInventoryInt);
            changeRecord.trackInventory = createChangeRecord(
              existing.track_inventory === 1,
              update.trackInventory
            );
          }
        }

        if (setClauses.length === 0) {
          skipped++;
          return;
        }

        setClauses.push('updated_at = ?');
        setClauses.push('updated_by = ?');
        params.push(now, userId, productId);

        try {
          const query = `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`;
          db.prepare(query).run(...params);
          updated++;
          changes.push({ productId, change: changeRecord });
        } catch (error) {
          errors.push({
            productId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    });

    transaction();

    changes.forEach(({ productId, change }) => {
      logProductHistory(
        productId,
        'inventory-adjusted',
        change,
        userId,
        userName,
        note || 'Bulk inventory update'
      );
    });

    return {
      updated,
      skipped,
      notFound,
      errors
    };
  } finally {
    db.close();
  }
}

export function processProductImportRows(
  rows: ProductImportRow[],
  options: ProductImportOptions = {},
  userId: string,
  userName: string
): ProductImportResult {
  const config: Required<Omit<ProductImportOptions, 'defaultStatus'>> & Pick<ProductImportOptions, 'defaultStatus'> = {
    allowCreate: false,
    updateInventory: true,
    updatePricing: true,
    updateStatus: true,
    ...options
  };

  type AggregatedImportRecord = {
    sku: string
    rowNumbers: number[]
    status?: string
    price?: number
    compareAtPrice?: number | null
    costPrice?: number | null
    inventoryQuantity?: number
    lowStockThreshold?: number
    allowBackorder?: boolean
    trackInventory?: boolean
  };

  const failures: ProductImportResult['failures'] = [];
  const updateMap = new Map<string, AggregatedImportRecord>();

  const uniqueSkus = Array.from(
    new Set(
      rows
        .map((row) => row.sku?.trim())
        .filter((sku): sku is string => !!sku)
    )
  );

  const db = getDb();
  let skuLookup = new Map<string, { id: string; sku: string }>();

  if (uniqueSkus.length > 0) {
    try {
      const placeholders = uniqueSkus.map(() => '?').join(',');
      const existingRows = db
        .prepare(`SELECT id, sku FROM products WHERE sku IN (${placeholders})`)
        .all(...uniqueSkus) as Array<{ id: string; sku: string }>;
      skuLookup = new Map(existingRows.map((row) => [row.sku, row]));
    } finally {
      db.close();
    }
  } else {
    db.close();
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const sku = row.sku?.trim();

    if (!sku) {
      failures.push({ rowNumber, sku: '', error: 'Missing SKU' });
      return;
    }

    const productRef = skuLookup.get(sku);
    if (!productRef) {
      if (config.allowCreate) {
        failures.push({
          rowNumber,
          sku,
          error: 'Creating new products via CSV import is not supported yet.'
        });
      } else {
        failures.push({ rowNumber, sku, error: 'Product not found' });
      }
      return;
    }

    let record = updateMap.get(productRef.id);
    if (!record) {
      record = {
        sku,
        rowNumbers: []
      };
      updateMap.set(productRef.id, record);
    }

    record.rowNumbers.push(rowNumber);

    if (config.updateStatus && row.status) {
      const normalizedStatus = row.status.toString().toLowerCase() as ProductStatus;
      const allowedStatuses: ProductStatus[] = ['active', 'draft', 'archived', 'out-of-stock'];
      if (allowedStatuses.includes(normalizedStatus)) {
        record.status = normalizedStatus;
      } else {
        failures.push({ rowNumber, sku, error: `Invalid status value "${row.status}"` });
      }
    }

    if (config.updatePricing) {
      if (row.price !== undefined && row.price !== null && row.price !== '') {
        const priceValue = typeof row.price === 'string' ? parseFloat(row.price) : row.price;
        if (!Number.isFinite(priceValue)) {
          failures.push({ rowNumber, sku, error: 'Invalid price value' });
        } else {
          record.price = priceValue;
        }
      }

      if (row.compareAtPrice !== undefined) {
        const compareValue =
          row.compareAtPrice === null || row.compareAtPrice === ''
            ? null
            : typeof row.compareAtPrice === 'string'
            ? parseFloat(row.compareAtPrice)
            : row.compareAtPrice;

        if (compareValue !== null && !Number.isFinite(compareValue)) {
          failures.push({ rowNumber, sku, error: 'Invalid compare_at_price value' });
        } else {
          record.compareAtPrice = compareValue;
        }
      }

      if (row.costPrice !== undefined) {
        const costValue =
          row.costPrice === null || row.costPrice === ''
            ? null
            : typeof row.costPrice === 'string'
            ? parseFloat(row.costPrice)
            : row.costPrice;

        if (costValue !== null && !Number.isFinite(costValue)) {
          failures.push({ rowNumber, sku, error: 'Invalid cost_price value' });
        } else {
          record.costPrice = costValue;
        }
      }
    }

    if (config.updateInventory) {
      if (row.inventoryQuantity !== undefined && row.inventoryQuantity !== null && row.inventoryQuantity !== '') {
        const inventoryValue =
          typeof row.inventoryQuantity === 'string'
            ? parseInt(row.inventoryQuantity, 10)
            : row.inventoryQuantity;
        if (!Number.isFinite(inventoryValue)) {
          failures.push({ rowNumber, sku, error: 'Invalid inventory quantity' });
        } else {
          record.inventoryQuantity = inventoryValue;
        }
      }

      if (row.lowStockThreshold !== undefined && row.lowStockThreshold !== null && row.lowStockThreshold !== '') {
        const thresholdValue =
          typeof row.lowStockThreshold === 'string'
            ? parseInt(row.lowStockThreshold, 10)
            : row.lowStockThreshold;
        if (!Number.isFinite(thresholdValue)) {
          failures.push({ rowNumber, sku, error: 'Invalid low stock threshold' });
        } else {
          record.lowStockThreshold = thresholdValue;
        }
      }

      if (row.allowBackorder !== undefined && row.allowBackorder !== null && row.allowBackorder !== '') {
        const allowBackorder =
          typeof row.allowBackorder === 'string'
            ? ['true', '1', 'yes', 'y'].includes(row.allowBackorder.toLowerCase())
            : Boolean(row.allowBackorder);
        record.allowBackorder = allowBackorder;
      }

      if (row.trackInventory !== undefined && row.trackInventory !== null && row.trackInventory !== '') {
        const trackInventory =
          typeof row.trackInventory === 'string'
            ? ['true', '1', 'yes', 'y'].includes(row.trackInventory.toLowerCase())
            : Boolean(row.trackInventory);
        record.trackInventory = trackInventory;
      }
    }

    updateMap.set(productRef.id, record);
  });

  const statusUpdates: BulkStatusUpdateInput[] = [];
  const priceUpdates: BulkPriceUpdateInput[] = [];
  const inventoryUpdates: BulkInventoryUpdateInput[] = [];

  updateMap.forEach((record, productId) => {
    if (record.status) {
      statusUpdates.push({ productId, newStatus: record.status as any });
    }

    if (
      record.price !== undefined ||
      record.compareAtPrice !== undefined ||
      record.costPrice !== undefined
    ) {
      priceUpdates.push({
        productId,
        price: record.price,
        compareAtPrice: record.compareAtPrice,
        costPrice: record.costPrice
      });
    }

    if (
      record.inventoryQuantity !== undefined ||
      record.lowStockThreshold !== undefined ||
      record.allowBackorder !== undefined ||
      record.trackInventory !== undefined
    ) {
      inventoryUpdates.push({
        productId,
        inventoryQuantity: record.inventoryQuantity,
        lowStockThreshold: record.lowStockThreshold,
        allowBackorder: record.allowBackorder,
        trackInventory: record.trackInventory
      });
    }
  });

  const statusResult =
    statusUpdates.length > 0
      ? bulkUpdateProductStatus(statusUpdates, userId, userName, 'CSV import')
      : { updated: 0, skipped: 0, notFound: [], errors: [] };

  const priceResult =
    priceUpdates.length > 0
      ? bulkUpdateProductPrices(priceUpdates, userId, userName, 'CSV import')
      : { updated: 0, skipped: 0, notFound: [], errors: [] };

  const inventoryResult =
    inventoryUpdates.length > 0
      ? bulkUpdateProductInventory(inventoryUpdates, userId, userName, 'CSV import')
      : { updated: 0, skipped: 0, notFound: [], errors: [] };

  const uniqueUpdatedProducts = new Set<string>();
  statusResult.updated && statusUpdates.forEach((u) => uniqueUpdatedProducts.add(u.productId));
  priceResult.updated && priceUpdates.forEach((u) => uniqueUpdatedProducts.add(u.productId));
  inventoryResult.updated &&
    inventoryUpdates.forEach((u) => uniqueUpdatedProducts.add(u.productId));

  const processedRows = rows.length - failures.length;

  statusResult.errors.forEach((err) =>
    failures.push({ rowNumber: 0, sku: err.productId, error: err.error })
  );
  priceResult.errors.forEach((err) =>
    failures.push({ rowNumber: 0, sku: err.productId, error: err.error })
  );
  inventoryResult.errors.forEach((err) =>
    failures.push({ rowNumber: 0, sku: err.productId, error: err.error })
  );

  return {
    totalRows: rows.length,
    processedRows,
    created: 0,
    updated: uniqueUpdatedProducts.size,
    skipped:
      statusResult.skipped + priceResult.skipped + inventoryResult.skipped +
      (updateMap.size - uniqueUpdatedProducts.size),
    statusUpdates: statusResult.updated,
    priceUpdates: priceResult.updated,
    inventoryUpdates: inventoryResult.updated,
    failures
  };
}

export function generateProductExportCsv(options?: {
  filters?: ProductFilters
  columns?: string[]
}): { fileName: string; rowCount: number; csv: string } {
  const defaultColumns = [
    'id',
    'sku',
    'name',
    'status',
    'type',
    'brand',
    'price',
    'compareAtPrice',
    'costPrice',
    'inventoryQuantity',
    'lowStockThreshold',
    'allowBackorder',
    'trackInventory',
    'subscriptionEligible',
    'subscriptionDiscount',
    'updatedAt'
  ];

  const columns = options?.columns && options.columns.length > 0 ? options.columns : defaultColumns;
  const listResult = listProducts({
    ...(options?.filters || {}),
    limit: 100000,
    offset: 0
  });

  const rows = listResult.products.map((product) => {
    const row: Record<string, any> = {};
    columns.forEach((column) => {
      switch (column) {
        case 'id':
          row[column] = product.id;
          break;
        case 'sku':
          row[column] = product.sku;
          break;
        case 'name':
          row[column] = product.name;
          break;
        case 'status':
          row[column] = product.status;
          break;
        case 'type':
          row[column] = product.type;
          break;
        case 'brand':
          row[column] = product.brand;
          break;
        case 'price':
          row[column] = product.price;
          break;
        case 'compareAtPrice':
          row[column] = product.compareAtPrice ?? '';
          break;
        case 'costPrice':
          row[column] = product.costPrice ?? '';
          break;
        case 'inventoryQuantity':
          row[column] = product.inventoryQuantity;
          break;
        case 'lowStockThreshold':
          row[column] = product.lowStockThreshold;
          break;
        case 'allowBackorder':
          row[column] = product.allowBackorder ? 'TRUE' : 'FALSE';
          break;
        case 'trackInventory':
          row[column] = product.trackInventory ? 'TRUE' : 'FALSE';
          break;
        case 'subscriptionEligible':
          row[column] = product.subscriptionEligible ? 'TRUE' : 'FALSE';
          break;
        case 'subscriptionDiscount':
          row[column] = product.subscriptionDiscount;
          break;
        case 'updatedAt':
          row[column] = new Date(product.updatedAt).toISOString();
          break;
        default:
          row[column] = product[column as keyof typeof product] ?? '';
      }
    });
    return row;
  });

  const { stringifyCsv } = require('../utils/csv') as {
    stringifyCsv: (rows: Array<Record<string, any>>, options?: { headers?: string[] }) => string
  };

  const csv = stringifyCsv(rows, { headers: columns });
  const timestamp = new Date().toISOString().replace(/[:]/g, '').replace(/\..+$/, '');
  const fileName = `products-export-${timestamp}.csv`;

  return {
    fileName,
    rowCount: rows.length,
    csv
  };
}

