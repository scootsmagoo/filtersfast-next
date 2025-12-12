/**
 * Category Database Operations
 * Helper functions for CRUD operations on categories
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type { 
  Category, 
  CategoryWithChildren,
  CategoryFormData,
  CategoryProduct
} from '../types/category';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // Ensure tables exist
  initializeTables(db);
  
  return db;
}

/**
 * Initialize categories tables if they don't exist
 */
function initializeTables(db: Database.Database) {
  try {
    // Check if categories table exists
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='categories'
    `).get();
    
    if (!tableCheck) {
      const now = Date.now();
      
      // Create categories table
      db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          idCategory INTEGER PRIMARY KEY,
          categoryDesc TEXT NOT NULL,
          idParentCategory INTEGER NOT NULL DEFAULT 0,
          categoryFeatured TEXT NOT NULL DEFAULT 'N',
          categoryHTML TEXT,
          categoryHTMLLong TEXT,
          sortOrder INTEGER,
          categoryGraphic TEXT,
          categoryImage TEXT,
          categoryContentLocation INTEGER NOT NULL DEFAULT 0,
          categoryType TEXT DEFAULT '',
          hideFromListings INTEGER NOT NULL DEFAULT 0,
          pagname TEXT,
          metatitle TEXT,
          metadesc TEXT,
          metacat TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(idParentCategory);
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(categoryType);
        CREATE INDEX IF NOT EXISTS idx_categories_featured ON categories(categoryFeatured);
        CREATE INDEX IF NOT EXISTS idx_categories_pagname ON categories(pagname);
        
        CREATE TABLE IF NOT EXISTS categories_products (
          idCatProd INTEGER PRIMARY KEY,
          idCategory INTEGER NOT NULL,
          idProduct INTEGER NOT NULL,
          UNIQUE(idCategory, idProduct)
        );
        
        CREATE INDEX IF NOT EXISTS idx_categories_products_category ON categories_products(idCategory);
        CREATE INDEX IF NOT EXISTS idx_categories_products_product ON categories_products(idProduct);
      `);
      
      // Create root category if it doesn't exist
      db.prepare(`
        INSERT OR IGNORE INTO categories (
          idCategory,
          categoryDesc,
          idParentCategory,
          categoryFeatured,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(1, 'Root', 0, 'N', now, now);
    }
  } catch (error) {
    console.error('Error initializing categories tables:', error);
    // Don't throw - let the calling function handle it
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert database row to Category object
 */
function rowToCategory(row: any): Category {
  return {
    id: row.idCategory,
    categoryDesc: row.categoryDesc,
    idParentCategory: row.idParentCategory,
    categoryFeatured: row.categoryFeatured || 'N',
    categoryHTML: row.categoryHTML || null,
    categoryHTMLLong: row.categoryHTMLLong || null,
    sortOrder: row.sortOrder !== null && row.sortOrder !== undefined ? row.sortOrder : null,
    categoryGraphic: row.categoryGraphic || null,
    categoryImage: row.categoryImage || null,
    categoryContentLocation: row.categoryContentLocation || 0,
    categoryType: row.categoryType || '',
    hideFromListings: row.hideFromListings || 0,
    pagname: row.pagname || null,
    metatitle: row.metatitle || null,
    metadesc: row.metadesc || null,
    metacat: row.metacat || null,
    createdAt: row.createdAt || Date.now(),
    updatedAt: row.updatedAt || Date.now()
  };
}

/**
 * Normalize page name for URL
 */
function normalizePageName(name: string): string {
  let normalized = name.toLowerCase().trim();
  normalized = normalized.replace(/\.asp$/, ''); // Remove .asp if present
  normalized = normalized.replace(/\s+/g, '-'); // Replace spaces with hyphens
  normalized = normalized.replace(/[^a-z0-9\-]/g, '-'); // Replace invalid chars
  normalized = normalized.replace(/-+/g, '-'); // Replace multiple hyphens
  normalized = normalized.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Ensure it contains '-cat' and ends with '.asp'
  if (!normalized.includes('-cat')) {
    normalized = normalized + '-cat';
  }
  if (!normalized.endsWith('.asp')) {
    normalized = normalized + '.asp';
  }
  
  return normalized;
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get all categories
 */
export function listCategories(parentId?: number): CategoryWithChildren[] {
  const db = getDb();
  
  try {
    let query = `
      SELECT 
        c.*,
        p.categoryDesc as parentCategoryDesc,
        (SELECT COUNT(*) FROM categories_products cp WHERE cp.idCategory = c.idCategory) as productCount
      FROM categories c
      LEFT JOIN categories p ON c.idParentCategory = p.idCategory
    `;
    
    const params: any[] = [];
    
    if (parentId !== undefined) {
      query += ' WHERE c.idParentCategory = ?';
      params.push(parentId);
    }
    
    query += ' ORDER BY c.sortOrder ASC, c.categoryDesc ASC';
    
    const rows = db.prepare(query).all(...params) as any[];
    
    const categories = rows.map(row => {
      const category = rowToCategory(row);
      return {
        ...category,
        parentCategoryDesc: row.parentCategoryDesc || null,
        productCount: row.productCount || 0
      } as CategoryWithChildren;
    });
    
    return categories;
  } finally {
    db.close();
  }
}

/**
 * Get category by ID
 */
export function getCategoryById(id: number): CategoryWithChildren | null {
  const db = getDb();
  
  try {
    const row = db.prepare(`
      SELECT 
        c.*,
        p.categoryDesc as parentCategoryDesc,
        (SELECT COUNT(*) FROM categories_products cp WHERE cp.idCategory = c.idCategory) as productCount
      FROM categories c
      LEFT JOIN categories p ON c.idParentCategory = p.idCategory
      WHERE c.idCategory = ?
    `).get(id) as any;
    
    if (!row) return null;
    
    const category = rowToCategory(row);
    return {
      ...category,
      parentCategoryDesc: row.parentCategoryDesc || null,
      productCount: row.productCount || 0
    } as CategoryWithChildren;
  } finally {
    db.close();
  }
}

/**
 * Get category tree (hierarchical structure)
 */
export function getCategoryTree(rootId: number = 1): CategoryWithChildren[] {
  const allCategories = listCategories();
  
  function buildTree(parentId: number): CategoryWithChildren[] {
    return allCategories
      .filter(cat => cat.idParentCategory === parentId)
      .map(cat => ({
        ...cat,
        children: buildTree(cat.id)
      }));
  }
  
  return buildTree(rootId);
}

/**
 * Get all child categories recursively
 */
export function getChildCategories(parentId: number): number[] {
  const db = getDb();
  
  try {
    const children: number[] = [];
    
    function getChildren(id: number) {
      const rows = db.prepare(`
        SELECT idCategory FROM categories WHERE idParentCategory = ?
      `).all(id) as any[];
      
      for (const row of rows) {
        children.push(row.idCategory);
        getChildren(row.idCategory); // Recursive
      }
    }
    
    getChildren(parentId);
    return children;
  } finally {
    db.close();
  }
}

/**
 * Check if category can be parent (not a child of target)
 */
export function canBeParent(categoryId: number, targetParentId: number): boolean {
  if (categoryId === targetParentId) return false;
  
  const children = getChildCategories(categoryId);
  return !children.includes(targetParentId);
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Create new category
 */
export function createCategory(data: CategoryFormData, userId?: string): Category {
  const db = getDb();
  
  try {
    // Validate parent category exists
    if (data.idParentCategory !== 0) {
      const parent = db.prepare('SELECT idCategory FROM categories WHERE idCategory = ?').get(data.idParentCategory);
      if (!parent) {
        throw new Error('Invalid parent category');
      }
    }
    
    // Normalize page name if provided
    let pagname = data.pagname || null;
    if (pagname) {
      pagname = normalizePageName(pagname);
      
      // Check for duplicate page names
      const existing = db.prepare('SELECT idCategory FROM categories WHERE LOWER(pagname) = LOWER(?)').get(pagname);
      if (existing) {
        throw new Error('URL has already been defined');
      }
    }
    
    const now = Date.now();
    
    const result = db.prepare(`
      INSERT INTO categories (
        categoryDesc, idParentCategory, categoryFeatured, categoryHTML,
        categoryHTMLLong, sortOrder, categoryGraphic, categoryImage,
        categoryContentLocation, categoryType, hideFromListings,
        pagname, metatitle, metadesc, metacat, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.categoryDesc,
      data.idParentCategory,
      data.categoryFeatured || 'N',
      data.categoryHTML || null,
      data.categoryHTMLLong || null,
      data.sortOrder || null,
      data.categoryGraphic || null,
      data.categoryImage || null,
      data.categoryContentLocation ?? 0,
      data.categoryType || '',
      data.hideFromListings ?? 0,
      pagname,
      data.metatitle || null,
      data.metadesc || null,
      data.metacat || null,
      now,
      now
    );
    
    return getCategoryById(result.lastInsertRowid as number)!;
  } finally {
    db.close();
  }
}

/**
 * Update category
 */
export function updateCategory(id: number, data: CategoryFormData, userId?: string): Category {
  const db = getDb();
  
  try {
    // Check category exists
    const existing = getCategoryById(id);
    if (!existing) {
      throw new Error('Category not found');
    }
    
    // Validate parent category
    if (data.idParentCategory !== undefined) {
      if (data.idParentCategory !== 0) {
        const parent = db.prepare('SELECT idCategory FROM categories WHERE idCategory = ?').get(data.idParentCategory);
        if (!parent) {
          throw new Error('Invalid parent category');
        }
      }
      
      // Check not linking to itself
      if (id === data.idParentCategory) {
        throw new Error('Category cannot be linked to itself');
      }
      
      // Check not linking to its own child
      if (!canBeParent(id, data.idParentCategory)) {
        throw new Error('Category cannot be linked to one of its own sub-categories');
      }
    }
    
    const now = Date.now();
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.categoryDesc !== undefined) {
      updates.push('categoryDesc = ?');
      values.push(data.categoryDesc);
    }
    if (data.idParentCategory !== undefined) {
      updates.push('idParentCategory = ?');
      values.push(data.idParentCategory);
    }
    if (data.categoryFeatured !== undefined) {
      updates.push('categoryFeatured = ?');
      values.push(data.categoryFeatured);
    }
    if (data.categoryHTML !== undefined) {
      updates.push('categoryHTML = ?');
      values.push(data.categoryHTML);
    }
    if (data.categoryHTMLLong !== undefined) {
      updates.push('categoryHTMLLong = ?');
      values.push(data.categoryHTMLLong);
    }
    if (data.sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      values.push(data.sortOrder);
    }
    if (data.categoryGraphic !== undefined) {
      updates.push('categoryGraphic = ?');
      values.push(data.categoryGraphic);
    }
    if (data.categoryImage !== undefined) {
      updates.push('categoryImage = ?');
      values.push(data.categoryImage);
    }
    if (data.categoryContentLocation !== undefined) {
      updates.push('categoryContentLocation = ?');
      values.push(data.categoryContentLocation);
    }
    if (data.categoryType !== undefined) {
      updates.push('categoryType = ?');
      values.push(data.categoryType);
    }
    if (data.hideFromListings !== undefined) {
      updates.push('hideFromListings = ?');
      values.push(data.hideFromListings);
    }
    if (data.metatitle !== undefined) {
      updates.push('metatitle = ?');
      values.push(data.metatitle);
    }
    if (data.metadesc !== undefined) {
      updates.push('metadesc = ?');
      values.push(data.metadesc);
    }
    if (data.metacat !== undefined) {
      updates.push('metacat = ?');
      values.push(data.metacat);
    }
    
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    
    db.prepare(`
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE idCategory = ?
    `).run(...values);
    
    return getCategoryById(id)!;
  } finally {
    db.close();
  }
}

/**
 * Delete category
 */
export function deleteCategory(id: number): void {
  const db = getDb();
  
  try {
    // Check category exists
    const category = getCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Don't allow deleting root category (idParentCategory = 0)
    if (category.idParentCategory === 0) {
      throw new Error('Cannot delete root category');
    }
    
    // Delete category-product associations
    db.prepare('DELETE FROM categories_products WHERE idCategory = ?').run(id);
    
    // Delete category
    db.prepare('DELETE FROM categories WHERE idCategory = ?').run(id);
  } finally {
    db.close();
  }
}

// ============================================================================
// CATEGORY-PRODUCT ASSOCIATIONS
// ============================================================================

/**
 * Get products in a category
 */
export function getCategoryProducts(categoryId: number): CategoryProduct[] {
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT 
        cp.idCatProd,
        cp.idCategory,
        cp.idProduct,
        p.sku,
        p.name as description,
        p.status
      FROM categories_products cp
      LEFT JOIN products p ON cp.idProduct = CAST(p.id AS TEXT)
      WHERE cp.idCategory = ?
      ORDER BY cp.idCatProd ASC
    `).all(categoryId) as any[];
    
    return rows.map(row => ({
      idCatProd: row.idCatProd,
      idCategory: row.idCategory,
      idProduct: row.idProduct,
      product: row.sku ? {
        id: String(row.idProduct),
        sku: row.sku,
        name: row.description || '',
        description: row.description || null,
        status: row.status || 'active'
      } : undefined
    }));
  } finally {
    db.close();
  }
}

/**
 * Add products to category
 */
export function addProductsToCategory(categoryId: number, productIds: number[]): void {
  const db = getDb();
  
  try {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO categories_products (idCategory, idProduct)
      VALUES (?, ?)
    `);
    
    const insertMany = db.transaction((ids: number[]) => {
      for (const productId of ids) {
        insert.run(categoryId, productId);
      }
    });
    
    insertMany(productIds);
  } finally {
    db.close();
  }
}

/**
 * Add products to category by SKU
 */
export function addProductsToCategoryBySku(categoryId: number, skus: string[]): void {
  const db = getDb();
  
  try {
    // First, get product IDs from SKUs
    const productIds: number[] = [];
    
    for (const sku of skus) {
      const row = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku) as any;
      if (row) {
        productIds.push(parseInt(row.id));
      }
    }
    
    if (productIds.length > 0) {
      addProductsToCategory(categoryId, productIds);
    }
  } finally {
    db.close();
  }
}

/**
 * Remove product from category
 */
export function removeProductFromCategory(categoryId: number, productId: number): void {
  const db = getDb();
  
  try {
    db.prepare(`
      DELETE FROM categories_products 
      WHERE idCategory = ? AND idProduct = ?
    `).run(categoryId, productId);
  } finally {
    db.close();
  }
}

