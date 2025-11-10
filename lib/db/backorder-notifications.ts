/**
 * Backorder Notification Database Helpers
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { sanitizeEmail, sanitizeText } from '../sanitize';
import { getProductById } from './products';
import { getOptionById } from './product-options';
import type { BackorderNotification, BackorderSummary } from '../types/backorder';

const dbPath = join(process.cwd(), 'filtersfast.db');

let schemaInitialized = false;

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  ensureSchema(db);
  return db;
}

function ensureSchema(db: Database.Database) {
  if (schemaInitialized) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS backorder_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      option_id TEXT,
      option_label TEXT,
      email TEXT NOT NULL,
      requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reminder_completed INTEGER NOT NULL DEFAULT 0 CHECK (reminder_completed IN (0, 1)),
      completed_at DATETIME,
      completed_by TEXT,
      completed_note TEXT,
      request_source TEXT,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_backorder_notifications_product
      ON backorder_notifications(product_id, reminder_completed);
    CREATE INDEX IF NOT EXISTS idx_backorder_notifications_email
      ON backorder_notifications(email, reminder_completed);
    CREATE INDEX IF NOT EXISTS idx_backorder_notifications_requested
      ON backorder_notifications(reminder_completed, requested_at);
  `);

  schemaInitialized = true;
}

function mapRow(row: any): BackorderNotification {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name ?? null,
    productSku: row.product_sku ?? null,
    optionId: row.option_id ?? null,
    optionLabel: row.option_label ?? null,
    email: row.email,
    requestedAt: row.requested_at,
    reminderCompleted: Boolean(row.reminder_completed),
    completedAt: row.completed_at ?? null,
    completedBy: row.completed_by ?? null,
    completedNote: row.completed_note ?? null,
    requestSource: row.request_source ?? null,
  };
}

export interface CreateBackorderResult {
  created: boolean;
  reason?: 'duplicate' | 'daily-limit' | 'invalid-product';
  request?: BackorderNotification;
}

export function createBackorderNotification(params: {
  productId: string;
  optionId?: string | null;
  email: string;
  source?: string;
}): CreateBackorderResult {
  const db = getDb();

  try {
    const productId = params.productId;
    const requestedOptionId = params.optionId ?? null;
    const email = sanitizeEmail(params.email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email address');
    }

    const product = getProductById(productId);
    if (!product || product.status !== 'active') {
      return { created: false, reason: 'invalid-product' };
    }

    let normalizedOptionId: string | null = null;
    let optionLabel: string | null = null;

    if (
      requestedOptionId &&
      typeof requestedOptionId === 'string' &&
      requestedOptionId.startsWith('opt-')
    ) {
      const option = getOptionById(requestedOptionId);
      if (option) {
        const optionAssignmentStmt = db.prepare(
          `
            SELECT 1
            FROM product_option_groups pog
            INNER JOIN option_group_xref x ON pog.idOptionGroup = x.idOptionGroup
            WHERE pog.idProduct = ?
              AND x.idOption = ?
            LIMIT 1
          `
        ).get(productId, requestedOptionId);

        if (optionAssignmentStmt) {
          normalizedOptionId = requestedOptionId;
          optionLabel = option.optionDescrip ?? null;
        }
      }
    }

    const todayCountStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM backorder_notifications
      WHERE email = ?
        AND reminder_completed = 0
        AND DATE(requested_at) = DATE('now')
    `);
    const { count: dailyCount } = todayCountStmt.get(email) as { count: number };
    if (dailyCount >= 3) {
      return { created: false, reason: 'daily-limit' };
    }

    const duplicateStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM backorder_notifications
      WHERE email = ?
        AND product_id = ?
        AND reminder_completed = 0
        AND (
          (? IS NULL AND option_id IS NULL) OR
          option_id = ?
        )
    `);
    const { count: duplicateCount } = duplicateStmt.get(
      email,
      productId,
      normalizedOptionId,
      normalizedOptionId
    ) as { count: number };
    if (duplicateCount > 0) {
      return { created: false, reason: 'duplicate' };
    }

    const insertStmt = db.prepare(`
      INSERT INTO backorder_notifications (
        product_id,
        option_id,
        option_label,
        email,
        request_source
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      productId,
      normalizedOptionId,
      optionLabel,
      email,
      params.source ? sanitizeText(params.source).slice(0, 100) : null
    );

    const id = Number(result.lastInsertRowid);
    const row = db.prepare(`
      SELECT
        bn.*,
        p.name AS product_name,
        p.sku AS product_sku
      FROM backorder_notifications bn
      LEFT JOIN products p ON p.id = bn.product_id
      WHERE bn.id = ?
    `).get(id);

    return {
      created: true,
      request: mapRow(row),
    };
  } finally {
    db.close();
  }
}

export function getBackorderSummary(): BackorderSummary[] {
  const db = getDb();

  try {
    const rows = db.prepare(`
      SELECT
        bn.product_id,
        p.name AS product_name,
        p.sku AS product_sku,
        p.inventory_quantity,
        p.track_inventory,
        p.allow_backorder,
        bn.option_id,
        COALESCE(bn.option_label, o.optionDescrip) AS option_label,
        COUNT(*) AS open_requests,
        MIN(bn.requested_at) AS first_requested_at,
        MAX(bn.requested_at) AS last_requested_at,
        poi.stock AS option_stock,
        poi.actualInventory AS option_actual_inventory,
        poi.ignoreStock AS option_ignore_stock,
        poi.unavailable AS option_unavailable,
        poi.blocked AS option_blocked
      FROM backorder_notifications bn
      JOIN products p ON p.id = bn.product_id
      LEFT JOIN options o ON o.idOption = bn.option_id
      LEFT JOIN product_option_inventory poi
        ON poi.idProduct = bn.product_id
       AND poi.idOption = bn.option_id
      WHERE bn.reminder_completed = 0
      GROUP BY bn.product_id, bn.option_id
      ORDER BY open_requests DESC, last_requested_at DESC
    `).all();

    return rows.map((row: any) => {
      const productReady =
        !row.track_inventory ||
        row.inventory_quantity > 0 ||
        row.allow_backorder;

      const optionReady = row.option_id
        ? Boolean(
            row.option_ignore_stock === 1 ||
            (
              row.option_unavailable !== 1 &&
              row.option_blocked !== 1 &&
              row.option_stock > 0
            )
          )
        : null;

      const readyForNotification = row.option_id
        ? Boolean(optionReady)
        : Boolean(productReady);

      const summary: BackorderSummary = {
        productId: row.product_id,
        productName: row.product_name,
        productSku: row.product_sku,
        optionId: row.option_id ?? null,
        optionLabel: row.option_label ?? null,
        openRequests: row.open_requests,
        firstRequestedAt: row.first_requested_at,
        lastRequestedAt: row.last_requested_at,
        productInventoryQuantity: row.inventory_quantity ?? 0,
        allowBackorder: Boolean(row.allow_backorder),
        trackInventory: Boolean(row.track_inventory),
        optionStock: row.option_stock ?? null,
        optionActualInventory: row.option_actual_inventory ?? null,
        optionIgnoreStock: row.option_ignore_stock !== null ? Boolean(row.option_ignore_stock) : null,
        readyForNotification,
      };

      return summary;
    });
  } finally {
    db.close();
  }
}

export function getBackorderRequests(
  productId: string,
  optionId?: string | null
): BackorderNotification[] {
  const db = getDb();

  try {
    let rows: any[];
    if (optionId) {
      rows = db.prepare(`
        SELECT
          bn.*,
          p.name AS product_name,
          p.sku AS product_sku
        FROM backorder_notifications bn
        LEFT JOIN products p ON p.id = bn.product_id
        WHERE bn.reminder_completed = 0
          AND bn.product_id = ?
          AND bn.option_id = ?
        ORDER BY bn.requested_at ASC
      `).all(productId, optionId);
    } else {
      rows = db.prepare(`
        SELECT
          bn.*,
          p.name AS product_name,
          p.sku AS product_sku
        FROM backorder_notifications bn
        LEFT JOIN products p ON p.id = bn.product_id
        WHERE bn.reminder_completed = 0
          AND bn.product_id = ?
        ORDER BY bn.requested_at ASC
      `).all(productId);
    }

    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export function completeBackorderNotification(
  id: number,
  adminUserId: string | null,
  note?: string | null
): boolean {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      UPDATE backorder_notifications
      SET
        reminder_completed = 1,
        completed_at = CURRENT_TIMESTAMP,
        completed_by = ?,
        completed_note = ?
      WHERE id = ?
        AND reminder_completed = 0
    `);

    const result = stmt.run(
      adminUserId || null,
      note ? sanitizeText(note).slice(0, 500) : null,
      id
    );

    return result.changes > 0;
  } finally {
    db.close();
  }
}


