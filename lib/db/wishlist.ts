/**
 * Wishlist Database Functions
 * Handles storing and retrieving user wishlists and wishlist items
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: number;
}

export interface WishlistWithItems extends Wishlist {
  items: WishlistItem[];
  itemCount: number;
}

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

/**
 * Initialize wishlist tables
 */
export function initWishlistTables() {
  const db = getDb();
  
  try {
    // Temporarily disable foreign key checks during table creation
    db.pragma('foreign_keys = OFF');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT DEFAULT 'My Wishlist',
        is_default INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wishlist_items (
        id TEXT PRIMARY KEY,
        wishlist_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(wishlist_id, product_id)
      );

      CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
      CREATE INDEX IF NOT EXISTS idx_wishlists_user_default ON wishlists(user_id, is_default);
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
    `);
    
    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
    
    console.log('✅ Wishlist tables initialized');
  } catch (error) {
    console.error('Error initializing wishlist tables:', error);
    // Re-enable foreign keys even on error
    try {
      db.pragma('foreign_keys = ON');
    } catch {}
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get or create default wishlist for a user
 */
export function getOrCreateDefaultWishlist(userId: string): Wishlist {
  const db = getDb();
  
  try {
    // Ensure tables exist (auto-initialize if needed)
    try {
      db.prepare('SELECT 1 FROM wishlists LIMIT 1').get();
    } catch (error: any) {
      // Tables don't exist, initialize them
      if (error.message?.includes('no such table')) {
        db.close();
        initWishlistTables();
        return getOrCreateDefaultWishlist(userId); // Retry after initialization
      }
      throw error;
    }
    
    // Try to get existing default wishlist
    const getStmt = db.prepare(`
      SELECT 
        id,
        user_id as userId,
        name,
        is_default as isDefault,
        created_at as createdAt,
        updated_at as updatedAt
      FROM wishlists
      WHERE user_id = ? AND is_default = 1
      LIMIT 1
    `);
    
    let wishlist = getStmt.get(userId) as Wishlist | undefined;
    
    if (!wishlist) {
      // Create default wishlist
      const now = Date.now();
      const id = randomUUID();
      
      const createStmt = db.prepare(`
        INSERT INTO wishlists (id, user_id, name, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      createStmt.run(id, userId, 'My Wishlist', 1, now, now);
      
      wishlist = {
        id,
        userId,
        name: 'My Wishlist',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      };
    }
    
    return wishlist;
  } catch (error) {
    console.error('Error in getOrCreateDefaultWishlist:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get all wishlists for a user
 */
export function getUserWishlists(userId: string): Wishlist[] {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        id,
        user_id as userId,
        name,
        is_default as isDefault,
        created_at as createdAt,
        updated_at as updatedAt
      FROM wishlists
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at ASC
    `);
    
    const wishlists = stmt.all(userId) as Wishlist[];
    
    // Convert SQLite integers to booleans
    return wishlists.map(w => ({
      ...w,
      isDefault: Boolean(w.isDefault),
    }));
  } finally {
    db.close();
  }
}

/**
 * Get wishlist by ID
 */
export function getWishlistById(wishlistId: string, userId: string): Wishlist | null {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        id,
        user_id as userId,
        name,
        is_default as isDefault,
        created_at as createdAt,
        updated_at as updatedAt
      FROM wishlists
      WHERE id = ? AND user_id = ?
    `);
    
    const wishlist = stmt.get(wishlistId, userId) as Wishlist | undefined;
    
    if (!wishlist) {
      return null;
    }
    
    return {
      ...wishlist,
      isDefault: Boolean(wishlist.isDefault),
    };
  } finally {
    db.close();
  }
}

/**
 * Create a new wishlist
 */
export function createWishlist(userId: string, name: string): Wishlist {
  const db = getDb();
  
  try {
    const now = Date.now();
    const id = randomUUID();
    
    // If this is the first wishlist, make it default
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?').get(userId) as { count: number };
    const isDefault = existingCount.count === 0 ? 1 : 0;
    
    const stmt = db.prepare(`
      INSERT INTO wishlists (id, user_id, name, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, userId, name, isDefault, now, now);
    
    return {
      id,
      userId,
      name,
      isDefault: Boolean(isDefault),
      createdAt: now,
      updatedAt: now,
    };
  } finally {
    db.close();
  }
}

/**
 * Update wishlist name
 */
export function updateWishlist(wishlistId: string, userId: string, name: string): boolean {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      UPDATE wishlists
      SET name = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(name, Date.now(), wishlistId, userId);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Delete wishlist
 */
export function deleteWishlist(wishlistId: string, userId: string): boolean {
  const db = getDb();
  
  try {
    const stmt = db.prepare('DELETE FROM wishlists WHERE id = ? AND user_id = ?');
    const result = stmt.run(wishlistId, userId);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Add product to wishlist
 */
export function addToWishlist(wishlistId: string, productId: string, userId: string): boolean {
  const db = getDb();
  
  try {
    // Ensure tables exist (auto-initialize if needed)
    try {
      db.prepare('SELECT 1 FROM wishlists LIMIT 1').get();
    } catch (error: any) {
      // Tables don't exist, initialize them
      if (error.message?.includes('no such table')) {
        db.close();
        initWishlistTables();
        // Retry after initialization - need to get a new db connection
        const retryDb = getDb();
        try {
          const wishlistCheck = retryDb.prepare('SELECT id FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, userId);
          if (!wishlistCheck) {
            retryDb.close();
            return false;
          }
          
          const id = randomUUID();
          const now = Date.now();
          
          const stmt = retryDb.prepare(`
            INSERT OR IGNORE INTO wishlist_items (id, wishlist_id, product_id, created_at)
            VALUES (?, ?, ?, ?)
          `);
          
          const result = stmt.run(id, wishlistId, productId, now);
          
          // Update wishlist updated_at
          if (result.changes > 0) {
            retryDb.prepare('UPDATE wishlists SET updated_at = ? WHERE id = ?').run(now, wishlistId);
          }
          
          retryDb.close();
          return result.changes > 0;
        } finally {
          retryDb.close();
        }
      }
      throw error;
    }
    
    // Verify wishlist belongs to user
    const wishlistCheck = db.prepare('SELECT id FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, userId);
    if (!wishlistCheck) {
      return false;
    }
    
    const id = randomUUID();
    const now = Date.now();
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO wishlist_items (id, wishlist_id, product_id, created_at)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(id, wishlistId, productId, now);
    
    // Update wishlist updated_at
    if (result.changes > 0) {
      db.prepare('UPDATE wishlists SET updated_at = ? WHERE id = ?').run(now, wishlistId);
    }
    
    return result.changes > 0;
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    return false;
  } finally {
    db.close();
  }
}

/**
 * Remove product from wishlist
 */
export function removeFromWishlist(wishlistId: string, productId: string, userId: string): boolean {
  const db = getDb();
  
  try {
    // Verify wishlist belongs to user
    const wishlistCheck = db.prepare('SELECT id FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, userId);
    if (!wishlistCheck) {
      return false;
    }
    
    const stmt = db.prepare(`
      DELETE FROM wishlist_items
      WHERE wishlist_id = ? AND product_id = ?
    `);
    
    const result = stmt.run(wishlistId, productId);
    
    // Update wishlist updated_at
    if (result.changes > 0) {
      db.prepare('UPDATE wishlists SET updated_at = ? WHERE id = ?').run(Date.now(), wishlistId);
    }
    
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Check if product is in wishlist
 */
export function isProductInWishlist(wishlistId: string, productId: string, userId: string): boolean {
  const db = getDb();
  
  try {
    // Ensure tables exist (auto-initialize if needed)
    try {
      db.prepare('SELECT 1 FROM wishlists LIMIT 1').get();
    } catch (error: any) {
      // Tables don't exist, initialize them
      if (error.message?.includes('no such table')) {
        db.close();
        initWishlistTables();
        // Retry after initialization
        return isProductInWishlist(wishlistId, productId, userId);
      }
      throw error;
    }
    
    // Verify wishlist belongs to user
    const wishlistCheck = db.prepare('SELECT id FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, userId);
    if (!wishlistCheck) {
      return false;
    }
    
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM wishlist_items
      WHERE wishlist_id = ? AND product_id = ?
    `);
    
    const result = stmt.get(wishlistId, productId) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error in isProductInWishlist:', error);
    return false;
  } finally {
    db.close();
  }
}

/**
 * Get wishlist items with product details
 */
export function getWishlistItems(wishlistId: string, userId: string): WishlistItem[] {
  const db = getDb();
  
  try {
    // Verify wishlist belongs to user
    const wishlistCheck = db.prepare('SELECT id FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, userId);
    if (!wishlistCheck) {
      return [];
    }
    
    const stmt = db.prepare(`
      SELECT 
        id,
        wishlist_id as wishlistId,
        product_id as productId,
        created_at as createdAt
      FROM wishlist_items
      WHERE wishlist_id = ?
      ORDER BY created_at DESC
    `);
    
    return stmt.all(wishlistId) as WishlistItem[];
  } finally {
    db.close();
  }
}

/**
 * Get wishlist with items count
 */
export function getWishlistWithItemCount(wishlistId: string, userId: string): WishlistWithItems | null {
  const db = getDb();
  
  try {
    const wishlist = getWishlistById(wishlistId, userId);
    if (!wishlist) {
      return null;
    }
    
    const items = getWishlistItems(wishlistId, userId);
    
    return {
      ...wishlist,
      items,
      itemCount: items.length,
    };
  } finally {
    db.close();
  }
}

/**
 * Get all products in user's default wishlist
 */
export function getDefaultWishlistProductIds(userId: string): string[] {
  const db = getDb();
  
  try {
    const defaultWishlist = getOrCreateDefaultWishlist(userId);
    const items = getWishlistItems(defaultWishlist.id, userId);
    return items.map(item => item.productId);
  } finally {
    db.close();
  }
}

/**
 * Check if product is in user's default wishlist
 */
export function isProductInDefaultWishlist(productId: string, userId: string): boolean {
  try {
    const defaultWishlist = getOrCreateDefaultWishlist(userId);
    return isProductInWishlist(defaultWishlist.id, productId, userId);
  } catch (error) {
    console.error('Error checking if product is in default wishlist:', error);
    // Return false on error - better to allow adding than to block due to a check error
    return false;
  }
}

/**
 * Add product to default wishlist
 */
export function addToDefaultWishlist(productId: string, userId: string): boolean {
  try {
    const defaultWishlist = getOrCreateDefaultWishlist(userId);
    return addToWishlist(defaultWishlist.id, productId, userId);
  } catch (error) {
    console.error('Error adding to default wishlist:', error);
    return false;
  }
}

/**
 * Remove product from default wishlist
 */
export function removeFromDefaultWishlist(productId: string, userId: string): boolean {
  const db = getDb();
  
  try {
    const defaultWishlist = getOrCreateDefaultWishlist(userId);
    return removeFromWishlist(defaultWishlist.id, productId, userId);
  } finally {
    db.close();
  }
}

