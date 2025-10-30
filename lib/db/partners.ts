/**
 * Partner Landing Pages Database Functions
 * 
 * Manages partner organizations and their landing pages
 */

import Database from 'better-sqlite3';
import { 
  Partner, 
  CreatePartnerInput, 
  UpdatePartnerInput,
  PartnerStats,
  ContentBlock
} from '@/lib/types/partner';

const db = new Database('filtersfast.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize partners table
 */
export function initPartnersTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('charity', 'corporate', 'discount_program')),
      short_description TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      hero_image TEXT,
      partnership_start_date TEXT,
      mission_statement TEXT,
      website_url TEXT,
      discount_code TEXT,
      discount_description TEXT,
      meta_title TEXT,
      meta_description TEXT,
      content_blocks TEXT NOT NULL DEFAULT '[]', -- JSON array of content blocks
      active INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug);
    CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
    CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(active);
    CREATE INDEX IF NOT EXISTS idx_partners_display_order ON partners(display_order);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS partner_views (
      id TEXT PRIMARY KEY,
      partner_id TEXT NOT NULL,
      user_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      viewed_at TEXT NOT NULL,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_partner_views_partner_id ON partner_views(partner_id);
    CREATE INDEX IF NOT EXISTS idx_partner_views_viewed_at ON partner_views(viewed_at);
  `);
}

/**
 * Convert database row to Partner object
 */
function rowToPartner(row: any): Partner {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    shortDescription: row.short_description,
    description: row.description || undefined,
    logo: row.logo || undefined,
    heroImage: row.hero_image || undefined,
    partnershipStartDate: row.partnership_start_date ? new Date(row.partnership_start_date) : undefined,
    missionStatement: row.mission_statement || undefined,
    websiteUrl: row.website_url || undefined,
    discountCode: row.discount_code || undefined,
    discountDescription: row.discount_description || undefined,
    metaTitle: row.meta_title || undefined,
    metaDescription: row.meta_description || undefined,
    contentBlocks: JSON.parse(row.content_blocks) as ContentBlock[],
    active: row.active === 1,
    featured: row.featured === 1,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get all active partners
 */
export function getActivePartners(): Partner[] {
  ensureTablesInitialized();
  const stmt = db.prepare(`
    SELECT * FROM partners
    WHERE active = 1
    ORDER BY 
      featured DESC,
      display_order ASC,
      name ASC
  `);
  
  const rows = stmt.all();
  return rows.map(rowToPartner);
}

/**
 * Get all partners (admin)
 */
export function getAllPartners(): Partner[] {
  ensureTablesInitialized();
  const stmt = db.prepare(`
    SELECT * FROM partners
    ORDER BY display_order ASC, name ASC
  `);
  
  const rows = stmt.all();
  return rows.map(rowToPartner);
}

/**
 * Get partner by ID
 */
export function getPartnerById(id: string): Partner | null {
  ensureTablesInitialized();
  const stmt = db.prepare('SELECT * FROM partners WHERE id = ?');
  const row = stmt.get(id);
  
  return row ? rowToPartner(row) : null;
}

/**
 * Get partner by slug
 */
export function getPartnerBySlug(slug: string): Partner | null {
  const stmt = db.prepare('SELECT * FROM partners WHERE slug = ?');
  const row = stmt.get(slug);
  
  return row ? rowToPartner(row) : null;
}

/**
 * Get partners by type
 */
export function getPartnersByType(type: string): Partner[] {
  const stmt = db.prepare(`
    SELECT * FROM partners
    WHERE type = ? AND active = 1
    ORDER BY display_order ASC, name ASC
  `);
  
  const rows = stmt.all(type);
  return rows.map(rowToPartner);
}

/**
 * Get featured partners
 */
export function getFeaturedPartners(): Partner[] {
  const stmt = db.prepare(`
    SELECT * FROM partners
    WHERE featured = 1 AND active = 1
    ORDER BY display_order ASC, name ASC
  `);
  
  const rows = stmt.all();
  return rows.map(rowToPartner);
}

/**
 * Create new partner
 */
export function createPartner(input: CreatePartnerInput): Partner {
  ensureTablesInitialized();
  const id = `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO partners (
      id, name, slug, type, short_description, description,
      logo, hero_image, partnership_start_date, mission_statement,
      website_url, discount_code, discount_description,
      meta_title, meta_description, content_blocks,
      active, featured, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    input.name,
    input.slug,
    input.type,
    input.shortDescription,
    input.description || null,
    input.logo || null,
    input.heroImage || null,
    input.partnershipStartDate?.toISOString() || null,
    input.missionStatement || null,
    input.websiteUrl || null,
    input.discountCode || null,
    input.discountDescription || null,
    input.metaTitle || null,
    input.metaDescription || null,
    JSON.stringify(input.contentBlocks || []),
    input.active ? 1 : 0,
    input.featured ? 1 : 0,
    input.displayOrder || 0,
    now,
    now
  );
  
  return getPartnerById(id)!;
}

/**
 * Update existing partner
 */
export function updatePartner(input: UpdatePartnerInput): Partner {
  const existing = getPartnerById(input.id);
  if (!existing) {
    throw new Error('Partner not found');
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.slug !== undefined) {
    updates.push('slug = ?');
    values.push(input.slug);
  }
  if (input.type !== undefined) {
    updates.push('type = ?');
    values.push(input.type);
  }
  if (input.shortDescription !== undefined) {
    updates.push('short_description = ?');
    values.push(input.shortDescription);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description || null);
  }
  if (input.logo !== undefined) {
    updates.push('logo = ?');
    values.push(input.logo || null);
  }
  if (input.heroImage !== undefined) {
    updates.push('hero_image = ?');
    values.push(input.heroImage || null);
  }
  if (input.partnershipStartDate !== undefined) {
    updates.push('partnership_start_date = ?');
    values.push(input.partnershipStartDate?.toISOString() || null);
  }
  if (input.missionStatement !== undefined) {
    updates.push('mission_statement = ?');
    values.push(input.missionStatement || null);
  }
  if (input.websiteUrl !== undefined) {
    updates.push('website_url = ?');
    values.push(input.websiteUrl || null);
  }
  if (input.discountCode !== undefined) {
    updates.push('discount_code = ?');
    values.push(input.discountCode || null);
  }
  if (input.discountDescription !== undefined) {
    updates.push('discount_description = ?');
    values.push(input.discountDescription || null);
  }
  if (input.metaTitle !== undefined) {
    updates.push('meta_title = ?');
    values.push(input.metaTitle || null);
  }
  if (input.metaDescription !== undefined) {
    updates.push('meta_description = ?');
    values.push(input.metaDescription || null);
  }
  if (input.contentBlocks !== undefined) {
    updates.push('content_blocks = ?');
    values.push(JSON.stringify(input.contentBlocks));
  }
  if (input.active !== undefined) {
    updates.push('active = ?');
    values.push(input.active ? 1 : 0);
  }
  if (input.featured !== undefined) {
    updates.push('featured = ?');
    values.push(input.featured ? 1 : 0);
  }
  if (input.displayOrder !== undefined) {
    updates.push('display_order = ?');
    values.push(input.displayOrder);
  }
  
  if (updates.length === 0) {
    return existing;
  }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(input.id);
  
  const stmt = db.prepare(`
    UPDATE partners
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  return getPartnerById(input.id)!;
}

/**
 * Delete partner
 */
export function deletePartner(id: string): boolean {
  const stmt = db.prepare('DELETE FROM partners WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Track partner page view
 */
export function trackPartnerView(
  partnerId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): void {
  const id = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const stmt = db.prepare(`
    INSERT INTO partner_views (id, partner_id, user_id, ip_address, user_agent, viewed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    partnerId,
    userId || null,
    ipAddress || null,
    userAgent || null,
    new Date().toISOString()
  );
}

/**
 * Get partner view statistics
 */
export function getPartnerStats(
  partnerId: string,
  startDate: Date,
  endDate: Date
): PartnerStats {
  const partner = getPartnerById(partnerId);
  if (!partner) {
    throw new Error('Partner not found');
  }
  
  const stmt = db.prepare(`
    SELECT COUNT(*) as view_count
    FROM partner_views
    WHERE partner_id = ?
    AND viewed_at >= ?
    AND viewed_at <= ?
  `);
  
  const result = stmt.get(
    partnerId,
    startDate.toISOString(),
    endDate.toISOString()
  ) as any;
  
  return {
    partnerId,
    partnerName: partner.name,
    views: result?.view_count || 0,
    periodStart: startDate,
    periodEnd: endDate,
  };
}

/**
 * Get all partner stats
 */
export function getAllPartnerStats(startDate: Date, endDate: Date): PartnerStats[] {
  const partners = getAllPartners();
  return partners.map(partner => getPartnerStats(partner.id, startDate, endDate));
}

/**
 * Check if slug is available
 */
export function isSlugAvailable(slug: string, excludeId?: string): boolean {
  const stmt = excludeId
    ? db.prepare('SELECT id FROM partners WHERE slug = ? AND id != ?')
    : db.prepare('SELECT id FROM partners WHERE slug = ?');
  
  const result = excludeId ? stmt.get(slug, excludeId) : stmt.get(slug);
  return !result;
}

/**
 * Generate unique slug from name
 */
export function generateUniqueSlug(name: string, excludeId?: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (isSlugAvailable(slug, excludeId)) {
    return slug;
  }
  
  // Add number suffix if slug exists
  let counter = 1;
  while (!isSlugAvailable(`${slug}-${counter}`, excludeId)) {
    counter++;
  }
  
  return `${slug}-${counter}`;
}

// Initialize tables on first use (lazy initialization)
let tablesInitialized = false;

function ensureTablesInitialized() {
  if (!tablesInitialized) {
    try {
      initPartnersTable();
      tablesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize partners tables:', error);
      throw error;
    }
  }
}

