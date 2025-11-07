/**
 * SKU Compatibility Database Operations
 * Helper functions for managing product SKU compatibility
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

export interface SKUCompatibility {
  id: number;
  idProduct: number;
  skuBrand: string;
  skuValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface SKUCompatibilityInput {
  skuBrand: string;
  skuValue: string;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all compatible SKUs for a product
 */
export function getProductCompatibility(idProduct: number): SKUCompatibility[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT id, idProduct, skuBrand, skuValue, createdAt, updatedAt
      FROM product_sku_compatibility
      WHERE idProduct = ?
      ORDER BY skuBrand, skuValue
    `).all(idProduct) as SKUCompatibility[];
    
    return rows;
  } finally {
    db.close();
  }
}

/**
 * Get a single compatibility record by ID
 */
export function getCompatibilityById(id: number): SKUCompatibility | null {
  const db = getDb();
  try {
    const row = db.prepare(`
      SELECT id, idProduct, skuBrand, skuValue, createdAt, updatedAt
      FROM product_sku_compatibility
      WHERE id = ?
    `).get(id) as SKUCompatibility | undefined;
    
    return row || null;
  } finally {
    db.close();
  }
}

/**
 * Add a new compatible SKU to a product
 */
export function addCompatibility(idProduct: number, compatibility: SKUCompatibilityInput): SKUCompatibility {
  const db = getDb();
  try {
    // Validate product exists
    const product = db.prepare('SELECT idProduct FROM products WHERE idProduct = ?').get(idProduct);
    if (!product) {
      throw new Error('Product not found');
    }

    // Sanitize inputs (trim and validate length)
    const skuBrand = compatibility.skuBrand.trim().substring(0, 100).toUpperCase();
    const skuValue = compatibility.skuValue.trim().substring(0, 100).toUpperCase();
    
    if (!skuBrand || !skuValue) {
      throw new Error('Brand and SKU are required');
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO product_sku_compatibility (idProduct, skuBrand, skuValue, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      idProduct,
      skuBrand,
      skuValue,
      now,
      now
    );
    
    const newRecord = getCompatibilityById(result.lastInsertRowid as number);
    if (!newRecord) {
      throw new Error('Failed to retrieve newly created compatibility record');
    }
    
    return newRecord;
  } finally {
    db.close();
  }
}

/**
 * Update an existing compatibility record
 */
export function updateCompatibility(id: number, compatibility: SKUCompatibilityInput, expectedProductId?: number): SKUCompatibility {
  const db = getDb();
  try {
    // Validate ID is positive and within reasonable range
    if (id < 1 || id > 2147483647) {
      throw new Error('Invalid compatibility ID');
    }

    // Verify record exists and get product ID for validation
    const existing = getCompatibilityById(id);
    if (!existing) {
      throw new Error('Compatibility record not found');
    }

    // Security check: verify ownership if expectedProductId provided
    if (expectedProductId !== undefined && existing.idProduct !== expectedProductId) {
      throw new Error('Compatibility record does not belong to the specified product');
    }

    // Validate product still exists
    const product = db.prepare('SELECT idProduct FROM products WHERE idProduct = ?').get(existing.idProduct);
    if (!product) {
      throw new Error('Product not found');
    }

    // Sanitize inputs
    const skuBrand = compatibility.skuBrand.trim().substring(0, 100).toUpperCase();
    const skuValue = compatibility.skuValue.trim().substring(0, 100).toUpperCase();
    
    if (!skuBrand || !skuValue) {
      throw new Error('Brand and SKU are required');
    }

    const now = new Date().toISOString();
    // Include idProduct in WHERE clause for additional security
    db.prepare(`
      UPDATE product_sku_compatibility
      SET skuBrand = ?, skuValue = ?, updatedAt = ?
      WHERE id = ? AND idProduct = ?
    `).run(
      skuBrand,
      skuValue,
      now,
      id,
      existing.idProduct
    );
    
    const updated = getCompatibilityById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated compatibility record');
    }
    
    return updated;
  } finally {
    db.close();
  }
}

/**
 * Delete a compatibility record
 */
export function deleteCompatibility(id: number): boolean {
  const db = getDb();
  try {
    // Validate ID is positive and within reasonable range
    if (id < 1 || id > 2147483647) {
      throw new Error('Invalid compatibility ID');
    }

    // Verify record exists before deletion
    const existing = getCompatibilityById(id);
    if (!existing) {
      return false;
    }

    const result = db.prepare(`
      DELETE FROM product_sku_compatibility
      WHERE id = ?
    `).run(id);
    
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Bulk update compatibility records for a product
 */
export function bulkUpdateCompatibility(
  idProduct: number,
  compatibilities: Array<{ id?: number; skuBrand: string; skuValue: string }>
): { added: number; updated: number; deleted: number } {
  const db = getDb();
  try {
    // Validate product exists
    const product = db.prepare('SELECT idProduct FROM products WHERE idProduct = ?').get(idProduct);
    if (!product) {
      throw new Error('Product not found');
    }

    // Limit bulk operations to prevent abuse
    if (compatibilities.length > 500) {
      throw new Error('Too many compatibilities. Maximum 500 allowed per operation.');
    }

    const transaction = db.transaction(() => {
      const existing = getProductCompatibility(idProduct);
      const existingIds = new Set(existing.map(c => c.id));
      const inputIds = new Set(compatibilities.filter(c => c.id).map(c => c.id!));
      
      // Validate all provided IDs belong to this product (security check)
      for (const compat of compatibilities) {
        if (compat.id && compat.id > 0 && compat.id < 1000000) {
          const existingRecord = getCompatibilityById(compat.id);
          if (existingRecord && existingRecord.idProduct !== idProduct) {
            throw new Error(`Compatibility record ${compat.id} does not belong to product ${idProduct}`);
          }
        }
      }
      
      // Delete removed records (limit to prevent abuse)
      const toDelete = existing.filter(c => !inputIds.has(c.id));
      let deleted = 0;
      const maxDeletions = 500; // Safety limit
      for (const record of toDelete.slice(0, maxDeletions)) {
        deleteCompatibility(record.id);
        deleted++;
      }
      
      // Update or insert records
      let added = 0;
      let updated = 0;
      const now = new Date().toISOString();
      
      for (const compat of compatibilities) {
        // Sanitize inputs
        const skuBrand = compat.skuBrand.trim().substring(0, 100).toUpperCase();
        const skuValue = compat.skuValue.trim().substring(0, 100).toUpperCase();
        
        // Skip invalid entries
        if (!skuBrand || !skuValue) {
          continue;
        }

        // Validate ID is positive and within reasonable range
        if (compat.id && (compat.id < 1 || compat.id > 2147483647)) {
          continue;
        }

        if (compat.id && existingIds.has(compat.id)) {
          // Update existing (with idProduct check for security)
          db.prepare(`
            UPDATE product_sku_compatibility
            SET skuBrand = ?, skuValue = ?, updatedAt = ?
            WHERE id = ? AND idProduct = ?
          `).run(
            skuBrand,
            skuValue,
            now,
            compat.id,
            idProduct
          );
          updated++;
        } else {
          // Insert new
          db.prepare(`
            INSERT INTO product_sku_compatibility (idProduct, skuBrand, skuValue, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            idProduct,
            skuBrand,
            skuValue,
            now,
            now
          );
          added++;
        }
      }
      
      return { added, updated, deleted };
    });
    
    return transaction();
  } finally {
    db.close();
  }
}

/**
 * Merge compatibility records from one product to another
 * Used when merging/consolidating products
 */
export function mergeCompatibility(fromProductId: number, toProductId: number): number {
  const db = getDb();
  try {
    // Validate both products exist
    const fromProduct = db.prepare('SELECT idProduct FROM products WHERE idProduct = ?').get(fromProductId);
    const toProduct = db.prepare('SELECT idProduct FROM products WHERE idProduct = ?').get(toProductId);
    
    if (!fromProduct) {
      throw new Error('Source product not found');
    }
    if (!toProduct) {
      throw new Error('Target product not found');
    }
    if (fromProductId === toProductId) {
      throw new Error('Cannot merge product to itself');
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE product_sku_compatibility
      SET idProduct = ?, updatedAt = ?
      WHERE idProduct = ?
    `).run(toProductId, now, fromProductId);
    
    return result.changes;
  } finally {
    db.close();
  }
}

/**
 * Search for products by compatible SKU
 */
export function findProductsByCompatibleSKU(skuBrand: string, skuValue: string): Array<{ idProduct: number; sku: string; name: string }> {
  const db = getDb();
  try {
    // Sanitize and validate inputs
    const brand = skuBrand.trim().substring(0, 100).toUpperCase();
    const value = skuValue.trim().substring(0, 100).toUpperCase();
    
    if (!brand || !value) {
      return [];
    }

    const rows = db.prepare(`
      SELECT DISTINCT p.idProduct, p.sku, p.description as name
      FROM products p
      INNER JOIN product_sku_compatibility c ON p.idProduct = c.idProduct
      WHERE c.skuBrand = ? AND c.skuValue = ?
      AND p.active = 1
      ORDER BY p.sku
      LIMIT 100
    `).all(brand, value) as Array<{ idProduct: number; sku: string; name: string }>;
    
    return rows;
  } finally {
    db.close();
  }
}

/**
 * Get compatibility statistics for a product
 */
export function getCompatibilityStats(idProduct: number): {
  totalCompatibleSKUs: number;
  uniqueBrands: number;
  brands: string[];
} {
  const db = getDb();
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalCompatibleSKUs,
        COUNT(DISTINCT skuBrand) as uniqueBrands,
        GROUP_CONCAT(DISTINCT skuBrand) as brands
      FROM product_sku_compatibility
      WHERE idProduct = ?
    `).get(idProduct) as {
      totalCompatibleSKUs: number;
      uniqueBrands: number;
      brands: string | null;
    };
    
    return {
      totalCompatibleSKUs: stats.totalCompatibleSKUs || 0,
      uniqueBrands: stats.uniqueBrands || 0,
      brands: stats.brands ? stats.brands.split(',') : []
    };
  } finally {
    db.close();
  }
}

