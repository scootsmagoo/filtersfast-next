/**
 * Shipping Configuration Database Operations
 * Manages carrier configurations, shipping zones, and rules
 */

import Database from 'better-sqlite3';
import path from 'path';
import type {
  ShippingConfig,
  ShippingCarrier,
  ShippingOriginAddress,
  PackageDimensions,
  ShippingZone,
  ShippingRule,
  ZoneRate,
} from '@/lib/types/shipping';

const dbPath = path.join(process.cwd(), 'filtersfast.db');

/**
 * Initialize shipping tables in the database
 */
export function initShippingTables() {
  const db = new Database(dbPath);

  try {
    // Shipping Configurations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS shipping_configs (
        id TEXT PRIMARY KEY,
        carrier TEXT NOT NULL UNIQUE,
        is_active INTEGER NOT NULL DEFAULT 0,
        api_credentials TEXT NOT NULL,
        origin_address TEXT NOT NULL,
        default_package_dimensions TEXT,
        markup_percentage REAL,
        markup_fixed REAL,
        free_shipping_threshold REAL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Shipping Zones table
    db.exec(`
      CREATE TABLE IF NOT EXISTS shipping_zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        countries TEXT,
        states TEXT,
        zip_code_ranges TEXT,
        rates TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Shipping Rules table
    db.exec(`
      CREATE TABLE IF NOT EXISTS shipping_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        conditions TEXT NOT NULL,
        actions TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Shipment History table
    db.exec(`
      CREATE TABLE IF NOT EXISTS shipment_history (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        carrier TEXT NOT NULL,
        service_code TEXT NOT NULL,
        service_name TEXT NOT NULL,
        tracking_number TEXT NOT NULL,
        label_url TEXT,
        rate REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL,
        origin_address TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        carrier_shipment_id TEXT,
        raw_response TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        label_format TEXT,
        metadata TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // Ensure new columns exist for legacy databases
    const shipmentColumns = db.prepare(`PRAGMA table_info(shipment_history)`).all() as any[];
    const shipmentColumnNames = new Set(shipmentColumns.map((col) => col.name as string));

    if (!shipmentColumnNames.has('label_format')) {
      db.exec(`ALTER TABLE shipment_history ADD COLUMN label_format TEXT`);
    }

    if (!shipmentColumnNames.has('metadata')) {
      db.exec(`ALTER TABLE shipment_history ADD COLUMN metadata TEXT`);
    }

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_shipping_configs_carrier ON shipping_configs(carrier);
      CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON shipping_zones(is_active);
      CREATE INDEX IF NOT EXISTS idx_shipping_rules_priority ON shipping_rules(priority);
      CREATE INDEX IF NOT EXISTS idx_shipment_history_order ON shipment_history(order_id);
      CREATE INDEX IF NOT EXISTS idx_shipment_history_tracking ON shipment_history(tracking_number);
    `);

    console.log('✓ Shipping tables initialized');
  } catch (error) {
    console.error('Error initializing shipping tables:', error);
    throw error;
  } finally {
    db.close();
  }
}

// ==================== Shipping Config Operations ====================

/**
 * Get all shipping configurations
 */
export function getAllShippingConfigs(): ShippingConfig[] {
  const db = new Database(dbPath);
  
  try {
    const configs = db.prepare(`
      SELECT * FROM shipping_configs
      ORDER BY carrier
    `).all() as any[];

    return configs.map(config => ({
      ...config,
      is_active: Boolean(config.is_active),
      api_credentials: JSON.parse(config.api_credentials),
      origin_address: JSON.parse(config.origin_address),
      default_package_dimensions: config.default_package_dimensions 
        ? JSON.parse(config.default_package_dimensions) 
        : undefined,
    }));
  } finally {
    db.close();
  }
}

/**
 * Get shipping configuration by carrier
 */
export function getShippingConfig(carrier: ShippingCarrier): ShippingConfig | null {
  const db = new Database(dbPath);
  
  try {
    const config = db.prepare(`
      SELECT * FROM shipping_configs WHERE carrier = ?
    `).get(carrier) as any;

    if (!config) return null;

    return {
      ...config,
      is_active: Boolean(config.is_active),
      api_credentials: JSON.parse(config.api_credentials),
      origin_address: JSON.parse(config.origin_address),
      default_package_dimensions: config.default_package_dimensions 
        ? JSON.parse(config.default_package_dimensions) 
        : undefined,
    };
  } finally {
    db.close();
  }
}

/**
 * Get all active shipping carriers
 */
export function getActiveCarriers(): ShippingConfig[] {
  const db = new Database(dbPath);
  
  try {
    const configs = db.prepare(`
      SELECT * FROM shipping_configs
      WHERE is_active = 1
      ORDER BY carrier
    `).all() as any[];

    return configs.map(config => ({
      ...config,
      is_active: Boolean(config.is_active),
      api_credentials: JSON.parse(config.api_credentials),
      origin_address: JSON.parse(config.origin_address),
      default_package_dimensions: config.default_package_dimensions 
        ? JSON.parse(config.default_package_dimensions) 
        : undefined,
    }));
  } finally {
    db.close();
  }
}

/**
 * Create or update shipping configuration
 */
export function upsertShippingConfig(config: Partial<ShippingConfig> & { carrier: ShippingCarrier }): ShippingConfig {
  const db = new Database(dbPath);
  
  try {
    const existing = getShippingConfig(config.carrier);
    const now = Date.now();

    if (existing) {
      // Update existing config
      db.prepare(`
        UPDATE shipping_configs
        SET
          is_active = ?,
          api_credentials = ?,
          origin_address = ?,
          default_package_dimensions = ?,
          markup_percentage = ?,
          markup_fixed = ?,
          free_shipping_threshold = ?,
          updated_at = ?
        WHERE carrier = ?
      `).run(
        config.is_active !== undefined ? Number(config.is_active) : Number(existing.is_active),
        config.api_credentials ? JSON.stringify(config.api_credentials) : JSON.stringify(existing.api_credentials),
        config.origin_address ? JSON.stringify(config.origin_address) : JSON.stringify(existing.origin_address),
        config.default_package_dimensions ? JSON.stringify(config.default_package_dimensions) : (existing.default_package_dimensions ? JSON.stringify(existing.default_package_dimensions) : null),
        config.markup_percentage !== undefined ? config.markup_percentage : existing.markup_percentage,
        config.markup_fixed !== undefined ? config.markup_fixed : existing.markup_fixed,
        config.free_shipping_threshold !== undefined ? config.free_shipping_threshold : existing.free_shipping_threshold,
        now,
        config.carrier
      );

      return getShippingConfig(config.carrier)!;
    } else {
      // Create new config
      const id = crypto.randomUUID();
      
      db.prepare(`
        INSERT INTO shipping_configs (
          id, carrier, is_active, api_credentials, origin_address,
          default_package_dimensions, markup_percentage, markup_fixed,
          free_shipping_threshold, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        config.carrier,
        config.is_active !== undefined ? Number(config.is_active) : 0,
        JSON.stringify(config.api_credentials || {}),
        JSON.stringify(config.origin_address || {}),
        config.default_package_dimensions ? JSON.stringify(config.default_package_dimensions) : null,
        config.markup_percentage || null,
        config.markup_fixed || null,
        config.free_shipping_threshold || null,
        now,
        now
      );

      return getShippingConfig(config.carrier)!;
    }
  } finally {
    db.close();
  }
}

/**
 * Delete shipping configuration
 */
export function deleteShippingConfig(carrier: ShippingCarrier): boolean {
  const db = new Database(dbPath);
  
  try {
    const result = db.prepare(`
      DELETE FROM shipping_configs WHERE carrier = ?
    `).run(carrier);

    return result.changes > 0;
  } finally {
    db.close();
  }
}

// ==================== Shipping Zone Operations ====================

/**
 * Get all shipping zones
 */
export function getAllShippingZones(): ShippingZone[] {
  const db = new Database(dbPath);
  
  try {
    const zones = db.prepare(`
      SELECT * FROM shipping_zones
      ORDER BY name
    `).all() as any[];

    return zones.map(zone => ({
      ...zone,
      is_active: Boolean(zone.is_active),
      countries: zone.countries ? JSON.parse(zone.countries) : undefined,
      states: zone.states ? JSON.parse(zone.states) : undefined,
      zip_code_ranges: zone.zip_code_ranges ? JSON.parse(zone.zip_code_ranges) : undefined,
      rates: JSON.parse(zone.rates),
    }));
  } finally {
    db.close();
  }
}

/**
 * Get shipping zone by ID
 */
export function getShippingZone(id: string): ShippingZone | null {
  const db = new Database(dbPath);
  
  try {
    const zone = db.prepare(`
      SELECT * FROM shipping_zones WHERE id = ?
    `).get(id) as any;

    if (!zone) return null;

    return {
      ...zone,
      is_active: Boolean(zone.is_active),
      countries: zone.countries ? JSON.parse(zone.countries) : undefined,
      states: zone.states ? JSON.parse(zone.states) : undefined,
      zip_code_ranges: zone.zip_code_ranges ? JSON.parse(zone.zip_code_ranges) : undefined,
      rates: JSON.parse(zone.rates),
    };
  } finally {
    db.close();
  }
}

/**
 * Create shipping zone
 */
export function createShippingZone(zone: Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>): ShippingZone {
  const db = new Database(dbPath);
  
  try {
    const id = crypto.randomUUID();
    const now = Date.now();

    db.prepare(`
      INSERT INTO shipping_zones (
        id, name, countries, states, zip_code_ranges,
        rates, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      zone.name,
      zone.countries ? JSON.stringify(zone.countries) : null,
      zone.states ? JSON.stringify(zone.states) : null,
      zone.zip_code_ranges ? JSON.stringify(zone.zip_code_ranges) : null,
      JSON.stringify(zone.rates),
      Number(zone.is_active),
      now,
      now
    );

    return getShippingZone(id)!;
  } finally {
    db.close();
  }
}

/**
 * Update shipping zone
 */
export function updateShippingZone(id: string, updates: Partial<Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>>): ShippingZone {
  const db = new Database(dbPath);
  
  try {
    const existing = getShippingZone(id);
    if (!existing) {
      throw new Error('Shipping zone not found');
    }

    const now = Date.now();

    db.prepare(`
      UPDATE shipping_zones
      SET
        name = ?,
        countries = ?,
        states = ?,
        zip_code_ranges = ?,
        rates = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      updates.name !== undefined ? updates.name : existing.name,
      updates.countries !== undefined ? JSON.stringify(updates.countries) : (existing.countries ? JSON.stringify(existing.countries) : null),
      updates.states !== undefined ? JSON.stringify(updates.states) : (existing.states ? JSON.stringify(existing.states) : null),
      updates.zip_code_ranges !== undefined ? JSON.stringify(updates.zip_code_ranges) : (existing.zip_code_ranges ? JSON.stringify(existing.zip_code_ranges) : null),
      updates.rates !== undefined ? JSON.stringify(updates.rates) : JSON.stringify(existing.rates),
      updates.is_active !== undefined ? Number(updates.is_active) : Number(existing.is_active),
      now,
      id
    );

    return getShippingZone(id)!;
  } finally {
    db.close();
  }
}

/**
 * Delete shipping zone
 */
export function deleteShippingZone(id: string): boolean {
  const db = new Database(dbPath);
  
  try {
    const result = db.prepare(`
      DELETE FROM shipping_zones WHERE id = ?
    `).run(id);

    return result.changes > 0;
  } finally {
    db.close();
  }
}

// ==================== Shipping Rule Operations ====================

/**
 * Get all shipping rules
 */
export function getAllShippingRules(): ShippingRule[] {
  const db = new Database(dbPath);
  
  try {
    const rules = db.prepare(`
      SELECT * FROM shipping_rules
      ORDER BY priority ASC
    `).all() as any[];

    return rules.map(rule => ({
      ...rule,
      is_active: Boolean(rule.is_active),
      conditions: JSON.parse(rule.conditions),
      actions: JSON.parse(rule.actions),
    }));
  } finally {
    db.close();
  }
}

/**
 * Get active shipping rules
 */
export function getActiveShippingRules(): ShippingRule[] {
  const db = new Database(dbPath);
  
  try {
    const rules = db.prepare(`
      SELECT * FROM shipping_rules
      WHERE is_active = 1
      ORDER BY priority ASC
    `).all() as any[];

    return rules.map(rule => ({
      ...rule,
      is_active: Boolean(rule.is_active),
      conditions: JSON.parse(rule.conditions),
      actions: JSON.parse(rule.actions),
    }));
  } finally {
    db.close();
  }
}

/**
 * Create shipping rule
 */
export function createShippingRule(rule: Omit<ShippingRule, 'id' | 'created_at' | 'updated_at'>): ShippingRule {
  const db = new Database(dbPath);
  
  try {
    const id = crypto.randomUUID();
    const now = Date.now();

    db.prepare(`
      INSERT INTO shipping_rules (
        id, name, priority, is_active, conditions, actions,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      rule.name,
      rule.priority,
      Number(rule.is_active),
      JSON.stringify(rule.conditions),
      JSON.stringify(rule.actions),
      now,
      now
    );

    return db.prepare(`
      SELECT * FROM shipping_rules WHERE id = ?
    `).get(id) as ShippingRule;
  } finally {
    db.close();
  }
}

/**
 * Delete shipping rule
 */
export function deleteShippingRule(id: string): boolean {
  const db = new Database(dbPath);
  
  try {
    const result = db.prepare(`
      DELETE FROM shipping_rules WHERE id = ?
    `).run(id);

    return result.changes > 0;
  } finally {
    db.close();
  }
}

