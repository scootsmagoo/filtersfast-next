/**
 * Inventory Management Database Functions
 * Provides database access for inventory operations
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Initialize inventory tables if they don't exist
 */
export function initInventoryTables() {
  // This assumes the tables are created via the inventory-schema.sql script
  // This function just ensures the database connection works
  try {
    db.prepare('SELECT 1').get()
    return true
  } catch (error) {
    console.error('Failed to initialize inventory tables:', error)
    return false
  }
}

// ============================================================================
// Export the database connection
// ============================================================================

export { db }
export default db

