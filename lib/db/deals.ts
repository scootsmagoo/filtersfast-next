/**
 * Deal Database Operations
 * Helper functions for CRUD operations on deals
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type { 
  Deal, 
  DealFormData
} from '../types/deal';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // Ensure tables exist
  initializeTables(db);
  
  return db;
}

/**
 * Initialize deals table if it doesn't exist
 */
function initializeTables(db: Database.Database) {
  try {
    // Check if deals table exists
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='deal'
    `).get();
    
    if (!tableCheck) {
      // Create deals table
      db.exec(`
        CREATE TABLE IF NOT EXISTS deal (
          iddeal INTEGER PRIMARY KEY AUTOINCREMENT,
          dealdiscription TEXT NOT NULL,
          startprice REAL NOT NULL,
          endprice REAL NOT NULL,
          units INTEGER NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          validFrom INTEGER,
          validTo INTEGER,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_deal_active ON deal(active);
        CREATE INDEX IF NOT EXISTS idx_deal_validFrom ON deal(validFrom);
        CREATE INDEX IF NOT EXISTS idx_deal_validTo ON deal(validTo);
        CREATE INDEX IF NOT EXISTS idx_deal_price_range ON deal(startprice, endprice);
      `);
    }
  } catch (error) {
    console.error('Error initializing deals table:', error);
    // Don't throw - let the calling function handle it
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert DealFormData to Deal (for inserts/updates)
 */
function formDataToDeal(data: DealFormData, existingDeal?: Deal): Partial<Deal> {
  const now = Date.now();
  // Sanitize description to prevent XSS
  const sanitizedDescription = data.dealdiscription
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .substring(0, 100); // Enforce max length
  
  const deal: Partial<Deal> = {
    dealdiscription: sanitizedDescription,
    startprice: Math.max(0, Math.min(999999.99, data.startprice)),
    endprice: Math.max(0, Math.min(999999.99, data.endprice)),
    units: Math.max(0, Math.min(999, data.units)),
    active: data.active ?? 1,
    updatedAt: now,
  };

  // Convert ISO date strings to timestamps with validation
  if (data.validFrom) {
    const fromDate = new Date(data.validFrom);
    if (!isNaN(fromDate.getTime())) {
      deal.validFrom = fromDate.getTime();
    } else {
      deal.validFrom = null;
    }
  } else {
    deal.validFrom = null;
  }

  if (data.validTo) {
    const toDate = new Date(data.validTo);
    if (!isNaN(toDate.getTime())) {
      deal.validTo = toDate.getTime();
    } else {
      deal.validTo = null;
    }
  }

  // Set createdAt only for new deals
  if (!existingDeal) {
    deal.createdAt = now;
  }

  return deal;
}

/**
 * Convert database row to Deal object
 */
function rowToDeal(row: any): Deal {
  return {
    iddeal: row.iddeal,
    dealdiscription: row.dealdiscription,
    startprice: row.startprice,
    endprice: row.endprice,
    units: row.units,
    active: row.active,
    validFrom: row.validFrom,
    validTo: row.validTo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get all deals
 */
export function getAllDeals(): Deal[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM deal
      ORDER BY createdAt DESC
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(rowToDeal);
  } catch (error) {
    console.error('Error getting all deals:', error);
    throw new Error('Failed to get deals');
  } finally {
    db.close();
  }
}

/**
 * Get active deals (for public display)
 */
export function getActiveDeals(): Deal[] {
  const db = getDb();
  try {
    const now = Date.now();
    const stmt = db.prepare(`
      SELECT * FROM deal
      WHERE active = 1
        AND (validFrom IS NULL OR validFrom <= ?)
        AND (validTo IS NULL OR validTo >= ?)
      ORDER BY startprice ASC
    `);
    
    const rows = stmt.all(now, now) as any[];
    return rows.map(rowToDeal);
  } catch (error) {
    console.error('Error getting active deals:', error);
    throw new Error('Failed to get active deals');
  } finally {
    db.close();
  }
}

/**
 * Get deal by ID
 */
export function getDealById(iddeal: number): Deal | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM deal
      WHERE iddeal = ?
    `);
    
    const row = stmt.get(iddeal) as any;
    return row ? rowToDeal(row) : null;
  } catch (error) {
    console.error('Error getting deal by ID:', error);
    throw new Error('Failed to get deal');
  } finally {
    db.close();
  }
}

/**
 * Get applicable deal for cart total
 * Returns the deal that matches the cart total (if any)
 */
export function getApplicableDeal(cartTotal: number): Deal | null {
  const db = getDb();
  try {
    const now = Date.now();
    const stmt = db.prepare(`
      SELECT * FROM deal
      WHERE active = 1
        AND startprice <= ?
        AND endprice >= ?
        AND (validFrom IS NULL OR validFrom <= ?)
        AND (validTo IS NULL OR validTo >= ?)
      ORDER BY startprice DESC
      LIMIT 1
    `);
    
    const row = stmt.get(cartTotal, cartTotal, now, now) as any;
    return row ? rowToDeal(row) : null;
  } catch (error) {
    console.error('Error getting applicable deal:', error);
    return null;
  } finally {
    db.close();
  }
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Create a new deal
 */
export function createDeal(data: DealFormData): Deal {
  const db = getDb();
  try {
    const deal = formDataToDeal(data);
    
    const stmt = db.prepare(`
      INSERT INTO deal (
        dealdiscription,
        startprice,
        endprice,
        units,
        active,
        validFrom,
        validTo,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      deal.dealdiscription,
      deal.startprice,
      deal.endprice,
      deal.units,
      deal.active,
      deal.validFrom,
      deal.validTo,
      deal.createdAt,
      deal.updatedAt
    );
    
    const newDeal = getDealById(result.lastInsertRowid as number);
    if (!newDeal) {
      throw new Error('Failed to retrieve created deal');
    }
    
    return newDeal;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw new Error('Failed to create deal');
  } finally {
    db.close();
  }
}

/**
 * Update an existing deal
 */
export function updateDeal(iddeal: number, data: DealFormData): Deal {
  const db = getDb();
  try {
    const existingDeal = getDealById(iddeal);
    if (!existingDeal) {
      throw new Error('Deal not found');
    }
    
    const deal = formDataToDeal(data, existingDeal);
    
    const stmt = db.prepare(`
      UPDATE deal SET
        dealdiscription = ?,
        startprice = ?,
        endprice = ?,
        units = ?,
        active = ?,
        validFrom = ?,
        validTo = ?,
        updatedAt = ?
      WHERE iddeal = ?
    `);
    
    stmt.run(
      deal.dealdiscription,
      deal.startprice,
      deal.endprice,
      deal.units,
      deal.active,
      deal.validFrom,
      deal.validTo,
      deal.updatedAt,
      iddeal
    );
    
    const updatedDeal = getDealById(iddeal);
    if (!updatedDeal) {
      throw new Error('Failed to retrieve updated deal');
    }
    
    return updatedDeal;
  } catch (error) {
    console.error('Error updating deal:', error);
    throw new Error('Failed to update deal');
  } finally {
    db.close();
  }
}

/**
 * Delete a deal
 */
export function deleteDeal(iddeal: number): boolean {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      DELETE FROM deal
      WHERE iddeal = ?
    `);
    
    const result = stmt.run(iddeal);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw new Error('Failed to delete deal');
  } finally {
    db.close();
  }
}

/**
 * Delete multiple deals
 */
export function deleteDeals(ids: number[]): number {
  const db = getDb();
  try {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`
      DELETE FROM deal
      WHERE iddeal IN (${placeholders})
    `);
    
    const result = stmt.run(...ids);
    return result.changes;
  } catch (error) {
    console.error('Error deleting deals:', error);
    throw new Error('Failed to delete deals');
  } finally {
    db.close();
  }
}

