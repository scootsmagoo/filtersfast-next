/**
 * Shipment History Persistence
 * Handles CRUD operations for shipment_history table
 */

import Database from 'better-sqlite3';
import path from 'path';

import type {
  Shipment,
  ShipmentStatus,
  ShippingCarrier,
} from '@/lib/types/shipping';

const dbPath = path.join(process.cwd(), 'filtersfast.db');

export interface ShipmentHistoryFilters {
  order_id?: string;
  carrier?: ShippingCarrier;
  status?: ShipmentStatus;
  search?: string;
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
}

/**
 * Persist a shipment in the shipment_history table
 */
export function recordShipment(shipment: Shipment & { order_id: string }): Shipment {
  const db = new Database(dbPath);

  try {
    const id = shipment.id || crypto.randomUUID();
    const now = Date.now();

    db.prepare(`
      INSERT INTO shipment_history (
        id,
        order_id,
        carrier,
        service_code,
        service_name,
        tracking_number,
        label_url,
        rate,
        currency,
        status,
        origin_address,
        destination_address,
        carrier_shipment_id,
        raw_response,
        created_at,
        updated_at,
        label_format,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      shipment.order_id,
      shipment.carrier,
      shipment.service_code,
      shipment.service_name,
      shipment.tracking_number,
      shipment.label_url,
      shipment.rate,
      shipment.currency,
      shipment.status,
      JSON.stringify(shipment.origin),
      JSON.stringify(shipment.destination),
      shipment.carrier_shipment_id || null,
      shipment.raw_response ? JSON.stringify(shipment.raw_response) : null,
      shipment.created_at || now,
      shipment.updated_at || now,
      shipment.label_format || null,
      shipment.metadata ? JSON.stringify(shipment.metadata) : null,
    );

    return {
      ...shipment,
      id,
      created_at: shipment.created_at || now,
      updated_at: shipment.updated_at || now,
    };
  } finally {
    db.close();
  }
}

/**
 * Retrieve shipment history with optional filters
 */
export function listShipments(filters: ShipmentHistoryFilters = {}): Shipment[] {
  const db = new Database(dbPath);

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.order_id) {
      conditions.push('order_id = ?');
      params.push(filters.order_id);
    }

    if (filters.carrier) {
      conditions.push('carrier = ?');
      params.push(filters.carrier);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.from) {
      conditions.push('created_at >= ?');
      params.push(filters.from);
    }

    if (filters.to) {
      conditions.push('created_at <= ?');
      params.push(filters.to);
    }

    if (filters.search) {
      conditions.push(`
        (
          tracking_number LIKE ?
          OR service_name LIKE ?
          OR order_id LIKE ?
          OR carrier_shipment_id LIKE ?
        )
      `);
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 50;
    const offset = filters.offset && filters.offset >= 0 ? filters.offset : 0;

    const rows = db.prepare(`
      SELECT *
      FROM shipment_history
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ?
      OFFSET ?
    `).all(...params, limit, offset) as any[];

    return rows.map(mapRowToShipment);
  } finally {
    db.close();
  }
}

/**
 * Retrieve a single shipment by ID
 */
export function getShipmentById(id: string): Shipment | null {
  const db = new Database(dbPath);

  try {
    const row = db.prepare(`
      SELECT * FROM shipment_history WHERE id = ?
    `).get(id) as any;

    if (!row) return null;
    return mapRowToShipment(row);
  } finally {
    db.close();
  }
}

/**
 * Update shipment status and optional metadata
 */
export function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  updates: Partial<Pick<Shipment, 'raw_response' | 'metadata' | 'label_url'>> = {},
): Shipment | null {
  const db = new Database(dbPath);

  try {
    const existing = getShipmentById(id);
    if (!existing) {
      return null;
    }

    const now = Date.now();

    db.prepare(`
      UPDATE shipment_history
      SET
        status = ?,
        label_url = COALESCE(?, label_url),
        raw_response = COALESCE(?, raw_response),
        metadata = COALESCE(?, metadata),
        updated_at = ?
      WHERE id = ?
    `).run(
      status,
      updates.label_url || null,
      updates.raw_response ? JSON.stringify(updates.raw_response) : null,
      updates.metadata ? JSON.stringify(updates.metadata) : null,
      now,
      id,
    );

    return {
      ...existing,
      status,
      updated_at: now,
      label_url: updates.label_url || existing.label_url,
      raw_response: updates.raw_response || existing.raw_response,
      metadata: updates.metadata || existing.metadata,
    };
  } finally {
    db.close();
  }
}

/**
 * Map DB row to Shipment object
 */
function mapRowToShipment(row: any): Shipment {
  return {
    id: row.id,
    carrier: row.carrier,
    service_name: row.service_name,
    service_code: row.service_code,
    tracking_number: row.tracking_number,
    label_url: row.label_url,
    label_format: row.label_format || undefined,
    rate: row.rate,
    currency: row.currency,
    origin: safeParse(row.origin_address),
    destination: safeParse(row.destination_address),
    status: row.status,
    order_id: row.order_id,
    reference_number: row.order_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    carrier_shipment_id: row.carrier_shipment_id || undefined,
    raw_response: safeParse(row.raw_response),
    metadata: safeParse(row.metadata) || undefined,
  };
}

function safeParse(source?: string | null) {
  if (!source) return undefined;
  try {
    return JSON.parse(source);
  } catch {
    return undefined;
  }
}



