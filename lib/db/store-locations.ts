/**
 * Store / Dealer Locator Database Operations
 * Manages CRUD for physical locations tied to tax regions and shipping zones
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type {
  StoreLocation,
  StoreLocationFilters,
  StoreLocationFormData,
  StoreLocationStatus,
  StoreLocationType,
} from '@/lib/types/store-location';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

const LOCATION_TYPES: StoreLocationType[] = ['retail', 'dealer', 'distributor', 'service_center'];
const LOCATION_STATUSES: StoreLocationStatus[] = ['active', 'inactive'];

let isInitialized = false;

/**
 * Initialize database tables (idempotent)
 */
export function initStoreLocationTables(): void {
  if (isInitialized) return;

  const db = getDb();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS store_locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        location_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        website TEXT,
        google_place_id TEXT,
        latitude REAL,
        longitude REAL,
        hours_json TEXT,
        services_json TEXT,
        notes TEXT,
        shipping_zone_id TEXT,
        tax_region_code TEXT,
        tax_rate_override REAL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (shipping_zone_id) REFERENCES shipping_zones(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_store_locations_status ON store_locations(status);
      CREATE INDEX IF NOT EXISTS idx_store_locations_state ON store_locations(state);
      CREATE INDEX IF NOT EXISTS idx_store_locations_type ON store_locations(location_type);
      CREATE INDEX IF NOT EXISTS idx_store_locations_zone ON store_locations(shipping_zone_id);
      CREATE INDEX IF NOT EXISTS idx_store_locations_city ON store_locations(city);
    `);

    isInitialized = true;
  } finally {
    db.close();
  }
}

function normalizeStatus(status?: StoreLocationStatus): StoreLocationStatus {
  if (status && LOCATION_STATUSES.includes(status)) {
    return status;
  }
  return 'active';
}

function normalizeType(type: StoreLocationType): StoreLocationType {
  if (!LOCATION_TYPES.includes(type)) {
    throw new Error(`Invalid location type: ${type}`);
  }
  return type;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function generateUniqueSlug(name: string, existingId?: string): string {
  const base = toSlug(name);
  let slug = base || `location-${Date.now()}`;
  let counter = 1;

  const db = getDb();

  try {
    while (true) {
      const row = db
        .prepare(
          `SELECT id FROM store_locations WHERE slug = ? ${existingId ? 'AND id != ?' : ''} LIMIT 1`
        )
        .get(existingId ? [slug, existingId] : [slug]);

      if (!row) {
        break;
      }

      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  } finally {
    db.close();
  }
}

function rowToStoreLocation(row: any): StoreLocation {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    locationType: row.location_type,
    status: row.status,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    email: row.email,
    website: row.website,
    googlePlaceId: row.google_place_id,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    hours: safeJsonParse<Record<string, string> | null>(row.hours_json, null),
    services: safeJsonParse<string[] | null>(row.services_json, null),
    notes: row.notes,
    shippingZoneId: row.shipping_zone_id,
    shippingZoneName: row.shipping_zone_name || null,
    taxRegionCode: row.tax_region_code,
    taxRateOverride:
      row.tax_rate_override !== null && row.tax_rate_override !== undefined
        ? Number(row.tax_rate_override)
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFilterQuery(filters: StoreLocationFilters | undefined) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (!filters) {
    return { conditions, params };
  }

  if (filters.onlyActive) {
    conditions.push(`sl.status = 'active'`);
  }

  if (filters.states && filters.states.length > 0) {
    const placeholders = filters.states.map(() => '?').join(', ');
    conditions.push(`UPPER(sl.state) IN (${placeholders})`);
    params.push(...filters.states.map((state) => state.toUpperCase()));
  }

  if (filters.types && filters.types.length > 0) {
    const placeholders = filters.types.map(() => '?').join(', ');
    conditions.push(`sl.location_type IN (${placeholders})`);
    params.push(...filters.types);
  }

  if (filters.search) {
    const searchTerm = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(
      `(LOWER(sl.name) LIKE ? OR LOWER(sl.city) LIKE ? OR LOWER(sl.state) LIKE ? OR LOWER(sl.postal_code) LIKE ?)`
    );
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  return { conditions, params };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export function getStoreLocations(filters?: StoreLocationFilters): StoreLocation[] {
  initStoreLocationTables();
  const db = getDb();

  try {
    const { conditions, params } = buildFilterQuery(filters);

    let sql = `
      SELECT sl.*, sz.name AS shipping_zone_name
      FROM store_locations sl
      LEFT JOIN shipping_zones sz ON sl.shipping_zone_id = sz.id
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY sl.name ASC';

    if (filters?.limit && filters.limit > 0) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = db.prepare(sql).all(...params);
    return rows.map(rowToStoreLocation);
  } finally {
    db.close();
  }
}

export function getStoreLocationById(id: string): StoreLocation | null {
  initStoreLocationTables();
  const db = getDb();

  try {
    const row = db
      .prepare(
        `
        SELECT sl.*, sz.name AS shipping_zone_name
        FROM store_locations sl
        LEFT JOIN shipping_zones sz ON sl.shipping_zone_id = sz.id
        WHERE sl.id = ?
      `
      )
      .get(id);

    if (!row) return null;
    return rowToStoreLocation(row);
  } finally {
    db.close();
  }
}

export function getStoreLocationBySlug(slug: string): StoreLocation | null {
  initStoreLocationTables();
  const db = getDb();

  try {
    const row = db
      .prepare(
        `
        SELECT sl.*, sz.name AS shipping_zone_name
        FROM store_locations sl
        LEFT JOIN shipping_zones sz ON sl.shipping_zone_id = sz.id
        WHERE sl.slug = ?
      `
      )
      .get(slug);

    if (!row) return null;
    return rowToStoreLocation(row);
  } finally {
    db.close();
  }
}

export function createStoreLocation(data: StoreLocationFormData): StoreLocation {
  initStoreLocationTables();
  const db = getDb();

  try {
    const now = Date.now();
    const id = randomUUID();
    const status = normalizeStatus(data.status);
    const type = normalizeType(data.locationType);
    const country = data.country || 'US';

    const slug = data.slug && data.slug.trim().length > 0 ? toSlug(data.slug) : generateUniqueSlug(data.name);
    const finalSlug = generateUniqueSlug(slug, undefined);

    const stmt = db.prepare(`
      INSERT INTO store_locations (
        id, name, slug, location_type, status,
        address_line1, address_line2, city, state, postal_code, country,
        phone, email, website, google_place_id,
        latitude, longitude, hours_json, services_json, notes,
        shipping_zone_id, tax_region_code, tax_rate_override,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name.trim(),
      finalSlug,
      type,
      status,
      data.addressLine1.trim(),
      data.addressLine2?.trim() || null,
      data.city.trim(),
      data.state.trim(),
      data.postalCode.trim(),
      country.trim(),
      data.phone?.trim() || null,
      data.email?.trim() || null,
      data.website?.trim() || null,
      data.googlePlaceId?.trim() || null,
      data.latitude ?? null,
      data.longitude ?? null,
      data.hours ? JSON.stringify(data.hours) : null,
      data.services ? JSON.stringify(data.services) : null,
      data.notes?.trim() || null,
      data.shippingZoneId || null,
      data.taxRegionCode?.trim().toUpperCase() || null,
      data.taxRateOverride ?? null,
      now,
      now
    );

    return getStoreLocationById(id)!;
  } finally {
    db.close();
  }
}

export function updateStoreLocation(id: string, updates: StoreLocationFormData): StoreLocation {
  initStoreLocationTables();
  const existing = getStoreLocationById(id);
  if (!existing) {
    throw new Error('Store location not found');
  }

  const db = getDb();

  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }

    if (updates.slug !== undefined) {
      const slugCandidate = updates.slug.trim().length > 0 ? toSlug(updates.slug) : generateUniqueSlug(updates.name || existing.name, id);
      fields.push('slug = ?');
      values.push(generateUniqueSlug(slugCandidate, id));
    }

    if (updates.locationType !== undefined) {
      fields.push('location_type = ?');
      values.push(normalizeType(updates.locationType));
    }

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(normalizeStatus(updates.status));
    }

    if (updates.addressLine1 !== undefined) {
      fields.push('address_line1 = ?');
      values.push(updates.addressLine1.trim());
    }

    if (updates.addressLine2 !== undefined) {
      fields.push('address_line2 = ?');
      values.push(updates.addressLine2?.trim() || null);
    }

    if (updates.city !== undefined) {
      fields.push('city = ?');
      values.push(updates.city.trim());
    }

    if (updates.state !== undefined) {
      fields.push('state = ?');
      values.push(updates.state.trim());
    }

    if (updates.postalCode !== undefined) {
      fields.push('postal_code = ?');
      values.push(updates.postalCode.trim());
    }

    if (updates.country !== undefined) {
      fields.push('country = ?');
      values.push((updates.country || 'US').trim());
    }

    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone?.trim() || null);
    }

    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email?.trim() || null);
    }

    if (updates.website !== undefined) {
      fields.push('website = ?');
      values.push(updates.website?.trim() || null);
    }

    if (updates.googlePlaceId !== undefined) {
      fields.push('google_place_id = ?');
      values.push(updates.googlePlaceId?.trim() || null);
    }

    if (updates.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(updates.latitude ?? null);
    }

    if (updates.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(updates.longitude ?? null);
    }

    if (updates.hours !== undefined) {
      fields.push('hours_json = ?');
      values.push(updates.hours ? JSON.stringify(updates.hours) : null);
    }

    if (updates.services !== undefined) {
      fields.push('services_json = ?');
      values.push(updates.services ? JSON.stringify(updates.services) : null);
    }

    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes?.trim() || null);
    }

    if (updates.shippingZoneId !== undefined) {
      fields.push('shipping_zone_id = ?');
      values.push(updates.shippingZoneId || null);
    }

    if (updates.taxRegionCode !== undefined) {
      fields.push('tax_region_code = ?');
      values.push(updates.taxRegionCode?.trim().toUpperCase() || null);
    }

    if (updates.taxRateOverride !== undefined) {
      fields.push('tax_rate_override = ?');
      values.push(updates.taxRateOverride ?? null);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const sql = `
      UPDATE store_locations
      SET ${fields.join(', ')}
      WHERE id = ?
    `;

    db.prepare(sql).run(...values);

    return getStoreLocationById(id)!;
  } finally {
    db.close();
  }
}

export function deleteStoreLocation(id: string): boolean {
  initStoreLocationTables();
  const db = getDb();

  try {
    const result = db.prepare('DELETE FROM store_locations WHERE id = ?').run(id);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

export function deleteStoreLocations(ids: string[]): number {
  if (!ids || ids.length === 0) return 0;
  initStoreLocationTables();
  const db = getDb();

  try {
    const placeholders = ids.map(() => '?').join(', ');
    const result = db
      .prepare(`DELETE FROM store_locations WHERE id IN (${placeholders})`)
      .run(...ids);
    return result.changes ?? 0;
  } finally {
    db.close();
  }
}

export function countStoreLocations(): number {
  initStoreLocationTables();
  const db = getDb();

  try {
    const row = db.prepare('SELECT COUNT(*) as total FROM store_locations').get() as { total: number };
    return row?.total ?? 0;
  } finally {
    db.close();
  }
}

export function getActiveStoreLocations(): StoreLocation[] {
  return getStoreLocations({ onlyActive: true });
}

