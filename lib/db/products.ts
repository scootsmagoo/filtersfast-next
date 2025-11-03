/**
 * Product Database Operations
 * Helper functions for CRUD operations on products
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type { 
  Product, 
  ProductFilters, 
  ProductListResponse, 
  ProductStats, 
  ProductHistoryEntry,
  ProductCategory,
  ProductFormData
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
    const dimensions = (data.height || data.width || data.depth) ? JSON.stringify({
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
      data.trackInventory ? 1 : 0, data.inventoryQuantity, data.lowStockThreshold, data.allowBackorder ? 1 : 0,
      dimensions, data.mervRating, features, specs, compatModels,
      images, data.primaryImage, 0, '[]',
      JSON.stringify(data.categoryIds), JSON.stringify(data.tags),
      data.metaTitle, data.metaDescription, data.metaKeywords,
      data.isFeatured ? 1 : 0, data.isNew ? 1 : 0, data.isBestSeller ? 1 : 0, 
      data.madeInUSA ? 1 : 0, data.freeShipping ? 1 : 0, '[]',
      data.subscriptionEligible ? 1 : 0, data.subscriptionDiscount,
      '[]', '[]',
      data.weight, 1, null,
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

