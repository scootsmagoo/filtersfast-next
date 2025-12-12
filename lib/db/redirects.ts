/**
 * URL Redirect Management Database Functions
 * 
 * Handles URL redirects for SEO preservation and migration.
 * Supports 301/302 redirects, pattern matching, and analytics.
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'filtersfast.db');

export interface Redirect {
  id: number;
  source_path: string;
  destination_path: string;
  redirect_type: '301' | '302';
  is_regex: boolean;
  is_active: boolean;
  description?: string;
  hit_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateRedirectInput {
  source_path: string;
  destination_path: string;
  redirect_type?: '301' | '302';
  is_regex?: boolean;
  is_active?: boolean;
  description?: string;
  created_by?: string;
}

/**
 * Initialize redirects table
 */
export function initRedirectsTable() {
  const db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_path TEXT NOT NULL,
      destination_path TEXT NOT NULL,
      redirect_type TEXT NOT NULL DEFAULT '301' CHECK(redirect_type IN ('301', '302')),
      is_regex INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      hit_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT,
      UNIQUE(source_path)
    );

    CREATE INDEX IF NOT EXISTS idx_redirects_source ON redirects(source_path);
    CREATE INDEX IF NOT EXISTS idx_redirects_active ON redirects(is_active);
    CREATE INDEX IF NOT EXISTS idx_redirects_type ON redirects(redirect_type);
  `);
  
  db.close();
  console.log('✅ Redirects table initialized');
}

/**
 * Create a new redirect
 */
export function createRedirect(input: CreateRedirectInput): Redirect {
  const db = new Database(dbPath);
  
  try {
    const stmt = db.prepare(`
      INSERT INTO redirects (
        source_path,
        destination_path,
        redirect_type,
        is_regex,
        is_active,
        description,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      input.source_path,
      input.destination_path,
      input.redirect_type || '301',
      input.is_regex ? 1 : 0,
      input.is_active !== false ? 1 : 0,
      input.description || null,
      input.created_by || null
    );
    
    const redirect = db.prepare('SELECT * FROM redirects WHERE id = ?').get(result.lastInsertRowid) as Redirect;
    
    return redirect;
  } finally {
    db.close();
  }
}

/**
 * Get all redirects with optional filters
 */
export function getAllRedirects(options?: {
  activeOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): { redirects: Redirect[]; total: number } {
  const db = new Database(dbPath);
  
  try {
    let query = 'SELECT * FROM redirects WHERE 1=1';
    const params: any[] = [];
    
    if (options?.activeOnly) {
      query += ' AND is_active = 1';
    }
    
    if (options?.search) {
      query += ' AND (source_path LIKE ? OR destination_path LIKE ? OR description LIKE ?)';
      const searchParam = `%${options.search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const { count } = db.prepare(countQuery).get(...params) as { count: number };
    
    // Add pagination
    query += ' ORDER BY created_at DESC';
    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
    
    const redirects = db.prepare(query).all(...params) as Redirect[];
    
    return { redirects, total: count };
  } finally {
    db.close();
  }
}

/**
 * Get active redirects (for middleware)
 */
export function getActiveRedirects(): Redirect[] {
  const db = new Database(dbPath);
  
  try {
    const redirects = db.prepare(`
      SELECT * FROM redirects 
      WHERE is_active = 1 
      ORDER BY is_regex ASC, source_path ASC
    `).all() as Redirect[];
    
    return redirects;
  } finally {
    db.close();
  }
}

/**
 * Get redirect by ID
 */
export function getRedirectById(id: number): Redirect | null {
  const db = new Database(dbPath);
  
  try {
    const redirect = db.prepare('SELECT * FROM redirects WHERE id = ?').get(id) as Redirect | undefined;
    return redirect || null;
  } finally {
    db.close();
  }
}

/**
 * Update a redirect
 */
export function updateRedirect(id: number, updates: Partial<CreateRedirectInput>): Redirect | null {
  const db = new Database(dbPath);
  
  try {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.source_path !== undefined) {
      fields.push('source_path = ?');
      values.push(updates.source_path);
    }
    if (updates.destination_path !== undefined) {
      fields.push('destination_path = ?');
      values.push(updates.destination_path);
    }
    if (updates.redirect_type !== undefined) {
      fields.push('redirect_type = ?');
      values.push(updates.redirect_type);
    }
    if (updates.is_regex !== undefined) {
      fields.push('is_regex = ?');
      values.push(updates.is_regex ? 1 : 0);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active ? 1 : 0);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    
    if (fields.length === 0) {
      return getRedirectById(id);
    }
    
    fields.push('updated_at = datetime("now")');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE redirects 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return getRedirectById(id);
  } finally {
    db.close();
  }
}

/**
 * Delete a redirect
 */
export function deleteRedirect(id: number): boolean {
  const db = new Database(dbPath);
  
  try {
    const stmt = db.prepare('DELETE FROM redirects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Increment hit count for a redirect
 */
export function incrementRedirectHitCount(id: number): void {
  const db = new Database(dbPath);
  
  try {
    db.prepare(`
      UPDATE redirects 
      SET hit_count = hit_count + 1,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  } finally {
    db.close();
  }
}

/**
 * Find matching redirect for a given path
 */
export function findMatchingRedirect(requestPath: string): Redirect | null {
  const activeRedirects = getActiveRedirects();
  
  // First try exact matches (non-regex)
  for (const redirect of activeRedirects) {
    if (!redirect.is_regex && redirect.source_path === requestPath) {
      return redirect;
    }
  }
  
  // Then try regex matches
  for (const redirect of activeRedirects) {
    if (redirect.is_regex) {
      try {
        const regex = new RegExp(redirect.source_path);
        if (regex.test(requestPath)) {
          return redirect;
        }
      } catch (e) {
        console.error(`Invalid regex pattern: ${redirect.source_path}`, e);
      }
    }
  }
  
  return null;
}

/**
 * Bulk create redirects
 */
export function bulkCreateRedirects(redirects: CreateRedirectInput[]): {
  created: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
} {
  const db = new Database(dbPath);
  const errors: Array<{ row: number; error: string }> = [];
  let created = 0;
  let failed = 0;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO redirects (
        source_path,
        destination_path,
        redirect_type,
        is_regex,
        is_active,
        description,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction((redirectsToCreate: CreateRedirectInput[]) => {
      redirectsToCreate.forEach((redirect, index) => {
        try {
          stmt.run(
            redirect.source_path,
            redirect.destination_path,
            redirect.redirect_type || '301',
            redirect.is_regex ? 1 : 0,
            redirect.is_active !== false ? 1 : 0,
            redirect.description || null,
            redirect.created_by || null
          );
          created++;
        } catch (error) {
          failed++;
          errors.push({
            row: index + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    });
    
    transaction(redirects);
    
    return { created, failed, errors };
  } finally {
    db.close();
  }
}

/**
 * Get redirect statistics
 */
export function getRedirectStats(): {
  total: number;
  active: number;
  inactive: number;
  regex: number;
  permanent: number;
  temporary: number;
  totalHits: number;
  topRedirects: Array<{ id: number; source_path: string; destination_path: string; hit_count: number }>;
} {
  const db = new Database(dbPath);
  
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN is_regex = 1 THEN 1 ELSE 0 END) as regex,
        SUM(CASE WHEN redirect_type = '301' THEN 1 ELSE 0 END) as permanent,
        SUM(CASE WHEN redirect_type = '302' THEN 1 ELSE 0 END) as temporary,
        SUM(hit_count) as totalHits
      FROM redirects
    `).get() as any;
    
    const topRedirects = db.prepare(`
      SELECT id, source_path, destination_path, hit_count
      FROM redirects
      WHERE is_active = 1
      ORDER BY hit_count DESC
      LIMIT 10
    `).all() as any[];
    
    return {
      total: stats.total || 0,
      active: stats.active || 0,
      inactive: stats.inactive || 0,
      regex: stats.regex || 0,
      permanent: stats.permanent || 0,
      temporary: stats.temporary || 0,
      totalHits: stats.totalHits || 0,
      topRedirects
    };
  } finally {
    db.close();
  }
}

