/**
 * Product Snapshot Storage
 * Saves versioned JSON snapshots of products for audit/versioning
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import type {
  Product,
  ProductSnapshot,
  ProductSnapshotMetadata,
  ProductSnapshotPayload
} from '../types/product';
import { getProductById } from './products';

const dbPath = join(process.cwd(), 'filtersfast.db');
const snapshotsDir = join(process.cwd(), 'data', 'product-snapshots');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

type SqliteInstance = ReturnType<typeof getDb>;

function ensureSnapshotTable(db: SqliteInstance) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_snapshots (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      snapshot_file TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_product ON product_snapshots(product_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_created ON product_snapshots(created_at);
  `);
}

async function ensureSnapshotDirectory(): Promise<string> {
  await fs.mkdir(snapshotsDir, { recursive: true });
  return snapshotsDir;
}

function sanitizeForFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function buildSnapshotPayload(
  snapshotId: string,
  product: Product,
  userId: string,
  userName: string,
  note: string | null,
  extras?: Record<string, any> | null
): ProductSnapshotPayload {
  const capturedAt = Date.now();

  return {
    metadata: {
      snapshotId,
      productId: product.id,
      capturedAt,
      capturedBy: {
        id: userId,
        name: userName
      },
      note,
      version: 1
    },
    product,
    extras: extras ?? null
  };
}

function rowToSnapshotMetadata(row: any): ProductSnapshotMetadata {
  return {
    id: row.id,
    productId: row.product_id,
    fileName: row.snapshot_file,
    fileSize: Number(row.file_size) || 0,
    note: row.note || null,
    createdAt: Number(row.created_at),
    createdBy: row.created_by,
    createdByName: row.created_by_name
  };
}

/**
 * Create a JSON snapshot for the specified product.
 * Writes the JSON payload to disk (data/product-snapshots) and records metadata in SQLite.
 */
export async function createProductSnapshot(
  productId: string,
  userId: string,
  userName: string,
  options?: {
    note?: string | null
    extras?: Record<string, any> | null
  }
): Promise<ProductSnapshot> {
  const product = getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const note = options?.note?.trim()
    ? options.note.trim().slice(0, 500)
    : null;

  const snapshotId = `snap-${Date.now()}-${randomUUID()}`;
  const payload = buildSnapshotPayload(
    snapshotId,
    product,
    userId,
    userName,
    note,
    options?.extras
  );

  const payloadJson = JSON.stringify(payload, null, 2);
  const fileSize = Buffer.byteLength(payloadJson, 'utf-8');

  const now = Date.now();
  const date = new Date(now);
  const ts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('');

  const sanitizedProductId = sanitizeForFileName(productId);
  const fileName = `snapshot_${sanitizedProductId}_${ts}_${randomUUID()}.json`;

  const directory = await ensureSnapshotDirectory();
  const filePath = join(directory, fileName);

  await fs.writeFile(filePath, payloadJson, 'utf-8');

  const db = getDb();

  try {
    ensureSnapshotTable(db);
    db.prepare(
      `
        INSERT INTO product_snapshots (
          id,
          product_id,
          snapshot_file,
          snapshot_json,
          file_size,
          note,
          created_at,
          created_by,
          created_by_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      snapshotId,
      productId,
      fileName,
      payloadJson,
      fileSize,
      note,
      now,
      userId,
      userName
    );
  } finally {
    db.close();
  }

  return {
    ...rowToSnapshotMetadata({
      id: snapshotId,
      product_id: productId,
      snapshot_file: fileName,
      file_size: fileSize,
      note,
      created_at: now,
      created_by: userId,
      created_by_name: userName
    }),
    snapshot: payload
  };
}

/**
 * List snapshot metadata for a product, newest first.
 */
export function listProductSnapshots(
  productId: string,
  options?: {
    limit?: number
    offset?: number
  }
): ProductSnapshotMetadata[] {
  const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 200) : 100;
  const offset = options?.offset && options.offset > 0 ? options.offset : 0;

  const db = getDb();

  try {
    ensureSnapshotTable(db);
    const rows = db.prepare(
      `
        SELECT
          id,
          product_id,
          snapshot_file,
          file_size,
          note,
          created_at,
          created_by,
          created_by_name
        FROM product_snapshots
        WHERE product_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
      `
    ).all(productId, limit, offset);

    return rows.map(rowToSnapshotMetadata);
  } finally {
    db.close();
  }
}

/**
 * Fetch a snapshot payload by ID.
 */
export function getProductSnapshot(snapshotId: string): ProductSnapshot | null {
  const db = getDb();

  try {
    ensureSnapshotTable(db);
    const row = db.prepare(
      `
        SELECT
          id,
          product_id,
          snapshot_file,
          snapshot_json,
          file_size,
          note,
          created_at,
          created_by,
          created_by_name
        FROM product_snapshots
        WHERE id = ?
      `
    ).get(snapshotId);

    if (!row) {
      return null;
    }

    let snapshot: ProductSnapshotPayload;
    try {
      snapshot = JSON.parse(row.snapshot_json);
    } catch (error) {
      console.error('Failed to parse product snapshot JSON', error);
      const fallbackProduct = getProductById(row.product_id) as Product | null;
      snapshot = buildSnapshotPayload(
        row.id,
        fallbackProduct || ({ id: row.product_id } as Product),
        row.created_by,
        row.created_by_name,
        row.note || null
      );
    }

    return {
      ...rowToSnapshotMetadata(row),
      snapshot
    };
  } finally {
    db.close();
  }
}

/**
 * Delete a snapshot by ID. Removes both database record and JSON file (if present).
 */
export async function deleteProductSnapshot(snapshotId: string): Promise<boolean> {
  const db = getDb();
  let fileName: string | null = null;

  try {
    ensureSnapshotTable(db);
    const row = db.prepare(
      `SELECT snapshot_file FROM product_snapshots WHERE id = ?`
    ).get(snapshotId) as { snapshot_file: string } | undefined;

    if (!row) {
      return false;
    }

    fileName = row.snapshot_file;

    db.prepare(`DELETE FROM product_snapshots WHERE id = ?`).run(snapshotId);
  } finally {
    db.close();
  }

  if (fileName) {
    try {
      const dir = await ensureSnapshotDirectory();
      await fs.unlink(join(dir, fileName));
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.error(`Failed to remove snapshot file ${fileName}:`, error);
      }
    }
  }

  return true;
}

