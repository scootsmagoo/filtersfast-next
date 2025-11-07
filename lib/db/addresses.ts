/**
 * Saved Address Database Operations
 * Helper functions for CRUD operations on saved addresses
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type {
  SavedAddress,
  AddressFormData
} from '../types/address';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // Ensure tables exist
  initializeTables(db);
  
  return db;
}

/**
 * Initialize saved_addresses table if it doesn't exist
 */
function initializeTables(db: Database.Database) {
  try {
    // Check if saved_addresses table exists
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='saved_addresses'
    `).get();
    
    if (!tableCheck) {
      // Create saved_addresses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS saved_addresses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          label TEXT NOT NULL,
          name TEXT NOT NULL,
          address_line1 TEXT NOT NULL,
          address_line2 TEXT,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          postal_code TEXT NOT NULL,
          country TEXT NOT NULL DEFAULT 'US',
          phone TEXT,
          is_default INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON saved_addresses(user_id);
        CREATE INDEX IF NOT EXISTS idx_saved_addresses_is_default ON saved_addresses(user_id, is_default);
      `);
    }
  } catch (error) {
    console.error('Error initializing saved_addresses table:', error);
  }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all addresses for a user
 */
export function getUserAddresses(userId: string): SavedAddress[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, user_id, label, name, address_line1, address_line2, city, state, postal_code, country, phone, is_default, created_at, updated_at
      FROM saved_addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `);
    return stmt.all(userId) as SavedAddress[];
  } finally {
    db.close();
  }
}

/**
 * Get a single address by ID
 */
export function getAddressById(id: number, userId: string): SavedAddress | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, user_id, label, name, address_line1, address_line2, city, state, postal_code, country, phone, is_default, created_at, updated_at
      FROM saved_addresses
      WHERE id = ? AND user_id = ?
    `);
    return stmt.get(id, userId) as SavedAddress | null;
  } finally {
    db.close();
  }
}

/**
 * Create a new address
 */
export function createAddress(userId: string, data: AddressFormData): SavedAddress {
  const db = getDb();
  const now = Date.now();
  try {
    // Sanitize inputs to prevent XSS
    const sanitize = (str: string | null | undefined): string | null => {
      if (!str) return null;
      return str
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
    };
    
    // If this is set as default, unset all other defaults for this user
    if (data.is_default === 1) {
      const unsetDefault = db.prepare(`
        UPDATE saved_addresses
        SET is_default = 0, updated_at = ?
        WHERE user_id = ? AND is_default = 1
      `);
      unsetDefault.run(now, userId);
    }
    
    const stmt = db.prepare(`
      INSERT INTO saved_addresses (user_id, label, name, address_line1, address_line2, city, state, postal_code, country, phone, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      userId,
      sanitize(data.label) || '',
      sanitize(data.name) || '',
      sanitize(data.address_line1) || '',
      sanitize(data.address_line2) || null,
      sanitize(data.city) || '',
      sanitize(data.state) || '',
      sanitize(data.postal_code) || '',
      sanitize(data.country) || 'US',
      sanitize(data.phone) || null,
      data.is_default ?? 0,
      now,
      now
    );
    const newAddress = getAddressById(info.lastInsertRowid as number, userId);
    if (!newAddress) throw new Error('Failed to retrieve new address');
    return newAddress;
  } finally {
    db.close();
  }
}

/**
 * Update an existing address
 */
export function updateAddress(id: number, userId: string, data: Partial<AddressFormData>): SavedAddress {
  const db = getDb();
  const now = Date.now();
  try {
    const existingAddress = getAddressById(id, userId);
    if (!existingAddress) throw new Error('Address not found');

    // Sanitize inputs to prevent XSS
    const sanitize = (str: string | null | undefined): string | null => {
      if (!str) return null;
      return str
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
    };

    // If this is set as default, unset all other defaults for this user
    if (data.is_default === 1) {
      const unsetDefault = db.prepare(`
        UPDATE saved_addresses
        SET is_default = 0, updated_at = ?
        WHERE user_id = ? AND is_default = 1 AND id != ?
      `);
      unsetDefault.run(now, userId, id);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.label !== undefined) {
      updates.push('label = ?');
      values.push(sanitize(data.label) || '');
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(sanitize(data.name) || '');
    }
    if (data.address_line1 !== undefined) {
      updates.push('address_line1 = ?');
      values.push(sanitize(data.address_line1) || '');
    }
    if (data.address_line2 !== undefined) {
      updates.push('address_line2 = ?');
      values.push(sanitize(data.address_line2) || null);
    }
    if (data.city !== undefined) {
      updates.push('city = ?');
      values.push(sanitize(data.city) || '');
    }
    if (data.state !== undefined) {
      updates.push('state = ?');
      values.push(sanitize(data.state) || '');
    }
    if (data.postal_code !== undefined) {
      updates.push('postal_code = ?');
      values.push(sanitize(data.postal_code) || '');
    }
    if (data.country !== undefined) {
      updates.push('country = ?');
      values.push(sanitize(data.country) || 'US');
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(sanitize(data.phone) || null);
    }
    if (data.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(data.is_default);
    }

    updates.push('updated_at = ?');
    values.push(now);

    if (updates.length === 1 && updates[0] === 'updated_at = ?') {
      return existingAddress; // No actual changes other than timestamp
    }

    const stmt = db.prepare(`
      UPDATE saved_addresses
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(...values, id, userId);

    const updatedAddress = getAddressById(id, userId);
    if (!updatedAddress) throw new Error('Failed to retrieve updated address');
    return updatedAddress;
  } finally {
    db.close();
  }
}

/**
 * Delete an address by ID
 */
export function deleteAddress(id: number, userId: string): void {
  const db = getDb();
  try {
    const stmt = db.prepare('DELETE FROM saved_addresses WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  } finally {
    db.close();
  }
}

/**
 * Set an address as default
 */
export function setDefaultAddress(id: number, userId: string): SavedAddress {
  const db = getDb();
  const now = Date.now();
  try {
    // Unset all other defaults
    const unsetDefault = db.prepare(`
      UPDATE saved_addresses
      SET is_default = 0, updated_at = ?
      WHERE user_id = ? AND is_default = 1
    `);
    unsetDefault.run(now, userId);
    
    // Set this one as default
    const setDefault = db.prepare(`
      UPDATE saved_addresses
      SET is_default = 1, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    setDefault.run(now, id, userId);
    
    const updatedAddress = getAddressById(id, userId);
    if (!updatedAddress) throw new Error('Address not found');
    return updatedAddress;
  } finally {
    db.close();
  }
}

