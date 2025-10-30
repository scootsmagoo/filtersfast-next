/**
 * Giveaways Database Module
 * 
 * Handles all database operations for the giveaway/sweepstakes system.
 * Supports creating campaigns, managing entries, and selecting winners.
 */

import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'filtersfast.db'));

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

/**
 * Initialize giveaway tables
 */
export function initGiveawayTables() {
  // Giveaways table - stores campaign information
  db.exec(`
    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_name TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      product_name TEXT,
      product_url TEXT,
      product_image_url TEXT,
      prize_description TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      winner_id INTEGER,
      winner_notified INTEGER DEFAULT 0,
      winner_selected_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (winner_id) REFERENCES giveaway_entries(id)
    )
  `);

  // Giveaway entries table - stores participant entries
  db.exec(`
    CREATE TABLE IF NOT EXISTS giveaway_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      giveaway_id INTEGER NOT NULL,
      customer_id INTEGER,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      entry_date TEXT DEFAULT CURRENT_TIMESTAMP,
      is_winner INTEGER DEFAULT 0,
      UNIQUE(giveaway_id, email),
      FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_giveaways_dates ON giveaways(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_giveaways_active ON giveaways(is_active);
    CREATE INDEX IF NOT EXISTS idx_giveaway_entries_giveaway ON giveaway_entries(giveaway_id);
    CREATE INDEX IF NOT EXISTS idx_giveaway_entries_email ON giveaway_entries(email);
  `);

  console.log('✅ Giveaway tables initialized');
}

/**
 * Create a new giveaway campaign
 */
export interface CreateGiveawayInput {
  campaignName: string;
  title: string;
  description: string;
  productName?: string;
  productUrl?: string;
  productImageUrl?: string;
  prizeDescription: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export function createGiveaway(input: CreateGiveawayInput) {
  const stmt = db.prepare(`
    INSERT INTO giveaways (
      campaign_name, title, description, product_name, product_url,
      product_image_url, prize_description, start_date, end_date, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.campaignName,
    input.title,
    input.description,
    input.productName || null,
    input.productUrl || null,
    input.productImageUrl || null,
    input.prizeDescription,
    input.startDate,
    input.endDate,
    input.isActive !== false ? 1 : 0
  );

  return { id: result.lastInsertRowid };
}

/**
 * Update an existing giveaway
 */
export interface UpdateGiveawayInput extends Partial<CreateGiveawayInput> {
  id: number;
}

export function updateGiveaway(input: UpdateGiveawayInput) {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.description !== undefined) {
    fields.push('description = ?');
    values.push(input.description);
  }
  if (input.productName !== undefined) {
    fields.push('product_name = ?');
    values.push(input.productName);
  }
  if (input.productUrl !== undefined) {
    fields.push('product_url = ?');
    values.push(input.productUrl);
  }
  if (input.productImageUrl !== undefined) {
    fields.push('product_image_url = ?');
    values.push(input.productImageUrl);
  }
  if (input.prizeDescription !== undefined) {
    fields.push('prize_description = ?');
    values.push(input.prizeDescription);
  }
  if (input.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(input.startDate);
  }
  if (input.endDate !== undefined) {
    fields.push('end_date = ?');
    values.push(input.endDate);
  }
  if (input.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(input.isActive ? 1 : 0);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(input.id);

  const stmt = db.prepare(`
    UPDATE giveaways 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

/**
 * Get a giveaway by ID
 */
export function getGiveawayById(id: number) {
  const stmt = db.prepare(`
    SELECT 
      g.*,
      (SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = g.id) as entry_count,
      w.first_name as winner_first_name,
      w.last_name as winner_last_name,
      w.email as winner_email
    FROM giveaways g
    LEFT JOIN giveaway_entries w ON g.winner_id = w.id
    WHERE g.id = ?
  `);
  
  return stmt.get(id);
}

/**
 * Get a giveaway by campaign name
 */
export function getGiveawayByCampaignName(campaignName: string) {
  const stmt = db.prepare(`
    SELECT 
      g.*,
      (SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = g.id) as entry_count
    FROM giveaways g
    WHERE g.campaign_name = ?
  `);
  
  return stmt.get(campaignName);
}

/**
 * Get all active giveaways (within date range and marked active)
 */
export function getActiveGiveaways() {
  const stmt = db.prepare(`
    SELECT 
      g.*,
      (SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = g.id) as entry_count
    FROM giveaways g
    WHERE g.is_active = 1
      AND date(g.start_date) <= date('now')
      AND date(g.end_date) >= date('now')
    ORDER BY g.end_date ASC
  `);
  
  return stmt.all();
}

/**
 * Get all giveaways with pagination and filtering
 */
export interface GetGiveawaysOptions {
  limit?: number;
  offset?: number;
  status?: 'active' | 'upcoming' | 'ended' | 'all';
}

export function getAllGiveaways(options: GetGiveawaysOptions = {}) {
  const { limit = 50, offset = 0, status = 'all' } = options;
  
  let whereClause = '';
  if (status === 'active') {
    whereClause = `WHERE g.is_active = 1 
      AND date(g.start_date) <= date('now') 
      AND date(g.end_date) >= date('now')`;
  } else if (status === 'upcoming') {
    whereClause = `WHERE date(g.start_date) > date('now')`;
  } else if (status === 'ended') {
    whereClause = `WHERE date(g.end_date) < date('now')`;
  }

  const stmt = db.prepare(`
    SELECT 
      g.*,
      (SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = g.id) as entry_count,
      w.first_name as winner_first_name,
      w.last_name as winner_last_name,
      w.email as winner_email
    FROM giveaways g
    LEFT JOIN giveaway_entries w ON g.winner_id = w.id
    ${whereClause}
    ORDER BY g.created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  return stmt.all(limit, offset);
}

/**
 * Delete a giveaway (and all its entries via CASCADE)
 */
export function deleteGiveaway(id: number) {
  const stmt = db.prepare('DELETE FROM giveaways WHERE id = ?');
  stmt.run(id);
}

/**
 * Submit a giveaway entry
 */
export interface CreateEntryInput {
  giveawayId: number;
  customerId?: number;
  firstName: string;
  lastName: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export function createEntry(input: CreateEntryInput) {
  const stmt = db.prepare(`
    INSERT INTO giveaway_entries (
      giveaway_id, customer_id, first_name, last_name, email, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const result = stmt.run(
      input.giveawayId,
      input.customerId || null,
      input.firstName,
      input.lastName,
      input.email.toLowerCase(),
      input.ipAddress || null,
      input.userAgent || null
    );

    return { id: result.lastInsertRowid, success: true };
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return { success: false, error: 'duplicate_entry' };
    }
    throw error;
  }
}

/**
 * Check if email has already entered a giveaway
 */
export function hasEntered(giveawayId: number, email: string): boolean {
  const stmt = db.prepare(`
    SELECT 1 FROM giveaway_entries 
    WHERE giveaway_id = ? AND LOWER(email) = LOWER(?)
  `);
  
  return stmt.get(giveawayId, email) !== undefined;
}

/**
 * Get all entries for a giveaway
 */
export function getEntriesByGiveaway(giveawayId: number) {
  const stmt = db.prepare(`
    SELECT * FROM giveaway_entries 
    WHERE giveaway_id = ?
    ORDER BY entry_date DESC
  `);
  
  return stmt.all(giveawayId);
}

/**
 * Select a random winner from giveaway entries
 */
export function selectRandomWinner(giveawayId: number) {
  // Get all eligible entries (non-winners)
  const entries = db.prepare(`
    SELECT id FROM giveaway_entries 
    WHERE giveaway_id = ? AND is_winner = 0
  `).all(giveawayId) as Array<{ id: number }>;

  if (entries.length === 0) {
    return null;
  }

  // Select random entry
  const randomIndex = Math.floor(Math.random() * entries.length);
  const winnerId = entries[randomIndex].id;

  // Update giveaway with winner
  db.prepare(`
    UPDATE giveaways 
    SET winner_id = ?, winner_selected_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(winnerId, giveawayId);

  // Mark entry as winner
  db.prepare(`
    UPDATE giveaway_entries 
    SET is_winner = 1
    WHERE id = ?
  `).run(winnerId);

  // Return winner details
  return db.prepare(`
    SELECT * FROM giveaway_entries WHERE id = ?
  `).get(winnerId);
}

/**
 * Mark winner as notified
 */
export function markWinnerNotified(giveawayId: number) {
  const stmt = db.prepare(`
    UPDATE giveaways 
    SET winner_notified = 1
    WHERE id = ?
  `);
  
  stmt.run(giveawayId);
}

/**
 * Get giveaway statistics
 */
export function getGiveawayStats() {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_giveaways,
      SUM(CASE WHEN is_active = 1 
          AND date(start_date) <= date('now') 
          AND date(end_date) >= date('now') 
          THEN 1 ELSE 0 END) as active_giveaways,
      SUM(CASE WHEN date(end_date) < date('now') THEN 1 ELSE 0 END) as ended_giveaways,
      SUM(CASE WHEN winner_id IS NOT NULL THEN 1 ELSE 0 END) as winners_selected
    FROM giveaways
  `).get();

  const totalEntries = db.prepare(`
    SELECT COUNT(*) as count FROM giveaway_entries
  `).get() as { count: number };

  return {
    ...stats,
    total_entries: totalEntries.count
  };
}

export { db };

