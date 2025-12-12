/**
 * List By Size Admin datastore
 * Stores curated size-to-product mappings for the legacy "sa_listbysize.asp" parity tool.
 */

import Database from "better-sqlite3";
import { join } from "path";
import type {
  ListBySizeEntry,
  ListBySizeFilters,
  ListBySizeSummary,
  SizeFilterQuality,
} from "../types/product";

const dbPath = join(process.cwd(), "filtersfast.db");

function getDb() {
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
}

const QUALITY_RANK: Record<SizeFilterQuality, number> = {
  good: 1,
  better: 2,
  best: 3,
};

const QUALITY_LABEL: Record<number, SizeFilterQuality> = {
  1: "good",
  2: "better",
  3: "best",
};

function ensureTables() {
  const db = getDb();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS size_filter_entries (
        id TEXT PRIMARY KEY,
        sizeLabel TEXT NOT NULL,
        sizeKey TEXT NOT NULL,
        filterType TEXT NOT NULL DEFAULT 'air',
        ratingLabel TEXT,
        height REAL,
        width REAL,
        depth REAL,
        rowOrder INTEGER NOT NULL DEFAULT 0,
        quality TEXT NOT NULL DEFAULT 'good',
        qualityRank INTEGER NOT NULL DEFAULT 1,
        productId TEXT NOT NULL,
        optionId TEXT,
        packSize TEXT,
        sizeActive INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_size_filter_entries_size
      ON size_filter_entries(sizeKey, sizeActive);
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_size_filter_entries_product
      ON size_filter_entries(productId);
    `);
  } finally {
    db.close();
  }
}

ensureTables();

function normalizeNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric) : null;
}

function normalizeSizeKey(
  label?: string | null,
  height?: number | null,
  width?: number | null,
  depth?: number | null,
) {
  if (label && label.trim()) {
    return label
      .trim()
      .replace(/\s+/g, "")
      .replace(/"/g, "")
      .replace(/x/gi, "x")
      .toLowerCase();
  }

  if (height && width) {
    const numericParts = [height, width];
    if (depth) {
      numericParts.push(depth);
    }

    return numericParts
      .map((num) => {
        const fixed = Number(num);
        return Number.isInteger(fixed)
          ? `${fixed}`
          : fixed.toFixed(2).replace(/\.?0+$/, "");
      })
      .join("x")
      .toLowerCase();
  }

  return "";
}

function mapRowToEntry(row: any): ListBySizeEntry {
  const qualityRank = row.qualityRankComputed ?? row.qualityRank ?? 1;
  const quality =
    (row.quality as SizeFilterQuality) || QUALITY_LABEL[qualityRank] || "good";

  return {
    id: row.id,
    sizeLabel: row.sizeLabel,
    sizeKey: row.sizeKey,
    filterType: row.filterType,
    ratingLabel: row.ratingLabel ?? null,
    quality,
    qualityRank,
    rowOrder: row.rowOrder ?? 0,
    height: normalizeNumber(row.height),
    width: normalizeNumber(row.width),
    depth: normalizeNumber(row.depth),
    productId: row.productId,
    productName: row.productName ?? null,
    productSku: row.productSku ?? null,
    productSlug: row.productSlug ?? null,
    productStatus: row.productStatus ?? null,
    brand: row.productBrand ?? null,
    price: row.productPrice ?? null,
    packSize: row.packSize ?? null,
    sizeActive: Boolean(row.sizeActive),
    trackInventory: Boolean(row.productTrackInventory ?? 1),
    allowBackorder: Boolean(row.productAllowBackorder ?? 0),
    inventoryQuantity: row.productInventory ?? null,
    optionId: row.optionId ?? null,
    optionDescrip: row.optionDescrip ?? null,
    optionPriceToAdd: row.optionPriceToAdd ?? null,
    optionStock: row.optionStock ?? null,
    optionActualInventory: row.optionActualInventory ?? null,
    optionDropShip: Boolean(row.optionDropShip ?? 0),
    optionUnavailable: Boolean(row.optionUnavailable ?? 0),
    createdAt: row.createdAt ?? 0,
    updatedAt: row.updatedAt ?? 0,
  };
}

export function getSizeFilterEntryById(id: string): ListBySizeEntry | null {
  const db = getDb();
  try {
    const row = db
      .prepare(
        `
        SELECT
          e.*,
          COALESCE(e.qualityRank,
            CASE e.quality
              WHEN 'better' THEN 2
              WHEN 'best' THEN 3
              ELSE 1
            END
          ) AS qualityRankComputed,
          p.name AS productName,
          p.sku AS productSku,
          p.slug AS productSlug,
          p.status AS productStatus,
          p.brand AS productBrand,
          p.price AS productPrice,
          p.inventory_quantity AS productInventory,
          p.track_inventory AS productTrackInventory,
          p.allow_backorder AS productAllowBackorder,
          poi.stock AS optionStock,
          poi.actualInventory AS optionActualInventory,
          poi.dropShip AS optionDropShip,
          poi.unavailable AS optionUnavailable,
          o.optionDescrip,
          o.priceToAdd AS optionPriceToAdd
        FROM size_filter_entries e
        LEFT JOIN products p ON p.id = e.productId
        LEFT JOIN product_option_inventory poi
          ON poi.idProduct = e.productId
          AND ( (poi.idOption IS NULL AND e.optionId IS NULL) OR poi.idOption = e.optionId )
        LEFT JOIN options o ON o.idOption = e.optionId
        WHERE e.id = ?
      `,
      )
      .get(id);

    if (!row) {
      return null;
    }

    return mapRowToEntry(row);
  } finally {
    db.close();
  }
}

export function listSizeFilterEntries(
  filters: ListBySizeFilters = {},
): ListBySizeEntry[] {
  const db = getDb();

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.size) {
      conditions.push("LOWER(e.sizeKey) = ?");
      params.push(normalizeSizeKey(filters.size));
    }

    if (filters.active === "active") {
      conditions.push("e.sizeActive = 1");
    } else if (filters.active === "inactive") {
      conditions.push("e.sizeActive = 0");
    }

    if (filters.search) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        `(
          e.sizeLabel LIKE ?
          OR e.sizeKey LIKE ?
          OR p.name LIKE ?
          OR p.sku LIKE ?
          OR p.brand LIKE ?
        )`,
      );
      params.push(term, term, term, term, term);
    }

    let query = `
      SELECT
        e.*,
        COALESCE(e.qualityRank,
          CASE e.quality
            WHEN 'better' THEN 2
            WHEN 'best' THEN 3
            ELSE 1
          END
        ) AS qualityRankComputed,
        p.name AS productName,
        p.sku AS productSku,
        p.slug AS productSlug,
        p.status AS productStatus,
        p.brand AS productBrand,
        p.price AS productPrice,
        p.inventory_quantity AS productInventory,
        p.track_inventory AS productTrackInventory,
        p.allow_backorder AS productAllowBackorder,
        poi.stock AS optionStock,
        poi.actualInventory AS optionActualInventory,
        poi.dropShip AS optionDropShip,
        poi.unavailable AS optionUnavailable,
        o.optionDescrip,
        o.priceToAdd AS optionPriceToAdd
      FROM size_filter_entries e
      LEFT JOIN products p ON p.id = e.productId
      LEFT JOIN product_option_inventory poi
        ON poi.idProduct = e.productId
        AND ( (poi.idOption IS NULL AND e.optionId IS NULL) OR poi.idOption = e.optionId )
      LEFT JOIN options o ON o.idOption = e.optionId
    `;

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += `
      ORDER BY
        e.height IS NULL,
        e.height,
        e.width,
        e.depth,
        e.sizeKey,
        e.rowOrder,
        qualityRankComputed
    `;

    const rows = db.prepare(query).all(...params);
    return rows.map(mapRowToEntry);
  } finally {
    db.close();
  }
}

export function toggleSizeFilterEntry(id: string): ListBySizeEntry {
  const db = getDb();

  try {
    const existing = db
      .prepare("SELECT sizeActive FROM size_filter_entries WHERE id = ?")
      .get(id) as { sizeActive: number } | undefined;

    if (!existing) {
      throw new Error("Size filter entry not found");
    }

    const now = Date.now();
    const newStatus = existing.sizeActive ? 0 : 1;

    db.prepare(
      "UPDATE size_filter_entries SET sizeActive = ?, updatedAt = ? WHERE id = ?",
    ).run(newStatus, now, id);

    const updated = getSizeFilterEntryById(id);
    if (!updated) {
      throw new Error("Failed to reload size filter entry after update");
    }

    return updated;
  } finally {
    db.close();
  }
}

export function getSizeFilterSummary(): ListBySizeSummary {
  const db = getDb();
  try {
    const totals = db
      .prepare(
        `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN sizeActive = 1 THEN 1 ELSE 0 END) AS active
        FROM size_filter_entries
      `,
      )
      .get() as { total: number; active: number } | undefined;

    const sizeRows = db
      .prepare(
        `
        SELECT
          sizeKey,
          sizeLabel,
          depth,
          COUNT(*) AS total,
          SUM(CASE WHEN sizeActive = 1 THEN 1 ELSE 0 END) AS active
        FROM size_filter_entries
        GROUP BY sizeKey, sizeLabel, depth
        ORDER BY depth, sizeLabel
      `,
      )
      .all() as Array<{
      sizeKey: string;
      sizeLabel: string;
      depth: number | null;
      total: number;
      active: number;
    }>;

    const total = totals?.total ?? 0;
    const active = totals?.active ?? 0;

    return {
      total,
      active,
      inactive: total - active,
      sizes: sizeRows.map((row) => ({
        sizeKey: row.sizeKey,
        sizeLabel: row.sizeLabel,
        depth: normalizeNumber(row.depth),
        total: row.total,
        active: row.active,
      })),
    };
  } finally {
    db.close();
  }
}

export function upsertSizeFilterEntry(data: {
  id?: string;
  sizeLabel: string;
  sizeKey?: string;
  filterType?: string;
  ratingLabel?: string | null;
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  rowOrder?: number;
  quality?: SizeFilterQuality;
  productId: string;
  optionId?: string | null;
  packSize?: string | null;
  sizeActive?: boolean;
  notes?: string | null;
}): ListBySizeEntry {
  const db = getDb();

  try {
    const now = Date.now();
    const entryId =
      data.id || `sf-${now}-${Math.random().toString(36).substring(2, 8)}`;
    const height = normalizeNumber(data.height);
    const width = normalizeNumber(data.width);
    const depth = normalizeNumber(data.depth);
    const sizeKey = normalizeSizeKey(
      data.sizeKey || data.sizeLabel,
      height,
      width,
      depth,
    );
    const quality = data.quality || "good";
    const qualityRank = QUALITY_RANK[quality] ?? 1;

    db.prepare(
      `
        INSERT INTO size_filter_entries (
          id,
          sizeLabel,
          sizeKey,
          filterType,
          ratingLabel,
          height,
          width,
          depth,
          rowOrder,
          quality,
          qualityRank,
          productId,
          optionId,
          packSize,
          sizeActive,
          notes,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          sizeLabel = excluded.sizeLabel,
          sizeKey = excluded.sizeKey,
          filterType = excluded.filterType,
          ratingLabel = excluded.ratingLabel,
          height = excluded.height,
          width = excluded.width,
          depth = excluded.depth,
          rowOrder = excluded.rowOrder,
          quality = excluded.quality,
          qualityRank = excluded.qualityRank,
          productId = excluded.productId,
          optionId = excluded.optionId,
          packSize = excluded.packSize,
          sizeActive = excluded.sizeActive,
          notes = excluded.notes,
          updatedAt = excluded.updatedAt
      `,
    ).run(
      entryId,
      data.sizeLabel.trim(),
      sizeKey,
      (data.filterType || "air").trim(),
      data.ratingLabel ? data.ratingLabel.trim() : null,
      height,
      width,
      depth,
      data.rowOrder ?? 0,
      quality,
      qualityRank,
      data.productId,
      data.optionId || null,
      data.packSize || null,
      data.sizeActive === undefined ? 1 : data.sizeActive ? 1 : 0,
      data.notes || null,
      data.id ? now : now,
      now,
    );

    const saved = getSizeFilterEntryById(entryId);
    if (!saved) {
      throw new Error("Failed to load saved size filter entry");
    }
    return saved;
  } finally {
    db.close();
  }
}
