/**
 * Product bulk job persistence helpers.
 *
 * Stores job metadata, progress, item-level results, and generated files.
 * Used by admin tooling for CSV imports/exports and bulk updates.
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import type {
  ProductBulkJob,
  ProductBulkJobItem,
  ProductBulkJobStatus,
  ProductBulkJobSummary,
  ProductBulkJobType
} from '@/lib/types/product'

const dbPath = join(process.cwd(), 'filtersfast.db')

let initialized = false

function getDb() {
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  if (!initialized) {
    initializeTables(db)
    initialized = true
  }
  return db
}

function initializeTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_bulk_jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_by_name TEXT,
      created_at INTEGER NOT NULL,
      started_at INTEGER,
      completed_at INTEGER,
      total_items INTEGER NOT NULL DEFAULT 0,
      processed_items INTEGER NOT NULL DEFAULT 0,
      failed_items INTEGER NOT NULL DEFAULT 0,
      parameters TEXT,
      summary TEXT,
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status ON product_bulk_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_bulk_jobs_created ON product_bulk_jobs(created_at);

    CREATE TABLE IF NOT EXISTS product_bulk_job_items (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      reference TEXT,
      action TEXT,
      status TEXT NOT NULL,
      payload TEXT,
      result TEXT,
      error TEXT,
      created_at INTEGER NOT NULL,
      processed_at INTEGER,
      FOREIGN KEY(job_id) REFERENCES product_bulk_jobs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bulk_job_items_job ON product_bulk_job_items(job_id);

    CREATE TABLE IF NOT EXISTS product_bulk_job_results (
      job_id TEXT PRIMARY KEY,
      mime_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      content BLOB NOT NULL,
      size INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(job_id) REFERENCES product_bulk_jobs(id) ON DELETE CASCADE
    );
  `)
}

function rowToJob(row: any): ProductBulkJob {
  return {
    id: row.id,
    type: row.type as ProductBulkJobType,
    status: row.status as ProductBulkJobStatus,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    totalItems: row.total_items,
    processedItems: row.processed_items,
    failedItems: row.failed_items,
    parameters: row.parameters ? safeJsonParse(row.parameters, {}) : {},
    summary: row.summary ? safeJsonParse(row.summary, null) : null,
    error: row.error
  }
}

function rowToJobItem(row: any): ProductBulkJobItem {
  return {
    id: row.id,
    jobId: row.job_id,
    reference: row.reference ?? undefined,
    action: row.action ?? undefined,
    status: row.status,
    payload: row.payload ? safeJsonParse(row.payload, null) : null,
    result: row.result ? safeJsonParse(row.result, null) : null,
    error: row.error ?? null,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null
  }
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function createProductBulkJob(input: {
  type: ProductBulkJobType
  totalItems: number
  parameters?: Record<string, any>
  createdBy: string
  createdByName?: string | null
}): ProductBulkJob {
  const db = getDb()
  try {
    const id = `pjob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const createdAt = Date.now()

    db.prepare(
      `
      INSERT INTO product_bulk_jobs (
        id, type, status, created_by, created_by_name,
        created_at, total_items, parameters
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      input.type,
      input.createdBy,
      input.createdByName ?? null,
      createdAt,
      input.totalItems,
      input.parameters ? JSON.stringify(input.parameters) : null
    )

    const job = db
      .prepare('SELECT * FROM product_bulk_jobs WHERE id = ?')
      .get(id)

    return rowToJob(job)
  } finally {
    db.close()
  }
}

export function startProductBulkJob(jobId: string): void {
  const db = getDb()
  try {
    db.prepare(
      `
      UPDATE product_bulk_jobs
      SET status = 'processing', started_at = ?, error = NULL
      WHERE id = ?
    `
    ).run(Date.now(), jobId)
  } finally {
    db.close()
  }
}

export function completeProductBulkJob(jobId: string, summary?: ProductBulkJobSummary | null): void {
  const db = getDb()
  try {
    db.prepare(
      `
      UPDATE product_bulk_jobs
      SET status = 'completed', completed_at = ?, summary = ?
      WHERE id = ?
    `
    ).run(Date.now(), summary ? JSON.stringify(summary) : null, jobId)
  } finally {
    db.close()
  }
}

export function failProductBulkJob(jobId: string, errorMessage: string, summary?: ProductBulkJobSummary | null): void {
  const db = getDb()
  try {
    db.prepare(
      `
      UPDATE product_bulk_jobs
      SET status = 'failed', completed_at = ?, error = ?, summary = ?
      WHERE id = ?
    `
    ).run(
      Date.now(),
      errorMessage.slice(0, 2000),
      summary ? JSON.stringify(summary) : null,
      jobId
    )
  } finally {
    db.close()
  }
}

export function cancelProductBulkJob(jobId: string, reason?: string): void {
  const db = getDb()
  try {
    db.prepare(
      `
      UPDATE product_bulk_jobs
      SET status = 'cancelled', completed_at = ?, error = ?
      WHERE id = ? AND status IN ('pending', 'processing')
    `
    ).run(Date.now(), reason ? reason.slice(0, 1000) : null, jobId)
  } finally {
    db.close()
  }
}

export function updateProductBulkJobProgress(jobId: string, progress: { processedItems?: number; failedItems?: number }): void {
  const db = getDb()
  try {
    const sets: string[] = []
    const params: any[] = []

    if (typeof progress.processedItems === 'number') {
      sets.push('processed_items = ?')
      params.push(progress.processedItems)
    }

    if (typeof progress.failedItems === 'number') {
      sets.push('failed_items = ?')
      params.push(progress.failedItems)
    }

    if (sets.length === 0) return

    params.push(jobId)

    db.prepare(`UPDATE product_bulk_jobs SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  } finally {
    db.close()
  }
}

export function incrementProductBulkJobProgress(jobId: string, deltas: { processedDelta?: number; failedDelta?: number }): void {
  const db = getDb()
  try {
    db.prepare(
      `
      UPDATE product_bulk_jobs
      SET
        processed_items = processed_items + ?,
        failed_items = failed_items + ?
      WHERE id = ?
    `
    ).run(deltas.processedDelta ?? 0, deltas.failedDelta ?? 0, jobId)
  } finally {
    db.close()
  }
}

export function addProductBulkJobItem(item: {
  jobId: string
  status: 'pending' | 'processed' | 'failed' | 'skipped'
  reference?: string
  action?: string
  payload?: Record<string, any> | null
  result?: Record<string, any> | null
  error?: string | null
  processedAt?: number | null
}): ProductBulkJobItem {
  const db = getDb()
  try {
    const id = `pjob-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const createdAt = Date.now()

    db.prepare(
      `
      INSERT INTO product_bulk_job_items (
        id, job_id, reference, action, status, payload,
        result, error, created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      item.jobId,
      item.reference ?? null,
      item.action ?? null,
      item.status,
      item.payload ? JSON.stringify(item.payload) : null,
      item.result ? JSON.stringify(item.result) : null,
      item.error ? item.error.slice(0, 2000) : null,
      createdAt,
      item.processedAt ?? (item.status === 'processed' ? createdAt : null)
    )

    const row = db
      .prepare('SELECT * FROM product_bulk_job_items WHERE id = ?')
      .get(id)

    return rowToJobItem(row)
  } finally {
    db.close()
  }
}

export function listProductBulkJobs(options?: {
  limit?: number
  offset?: number
  createdBy?: string
}): ProductBulkJob[] {
  const db = getDb()
  try {
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 200))
    const offset = Math.max(0, options?.offset ?? 0)

    let query = `
      SELECT * FROM product_bulk_jobs
    `
    const params: any[] = []

    if (options?.createdBy) {
      query += ' WHERE created_by = ?'
      params.push(options.createdBy)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = db.prepare(query).all(...params)

    return rows.map(rowToJob)
  } finally {
    db.close()
  }
}

export function getProductBulkJob(
  jobId: string,
  options?: { createdBy?: string }
): ProductBulkJob | null {
  const db = getDb()
  try {
    let query = 'SELECT * FROM product_bulk_jobs WHERE id = ?'
    const params: any[] = [jobId]

    if (options?.createdBy) {
      query += ' AND created_by = ?'
      params.push(options.createdBy)
    }

    const row = db.prepare(query).get(...params)
    if (!row) return null
    return rowToJob(row)
  } finally {
    db.close()
  }
}

export function getProductBulkJobWithItems(
  jobId: string,
  options?: { limit?: number; offset?: number; createdBy?: string }
): {
  job: ProductBulkJob | null
  items: ProductBulkJobItem[]
  totalItems: number
} {
  const db = getDb()
  try {
    let jobQuery = 'SELECT * FROM product_bulk_jobs WHERE id = ?'
    const jobParams: any[] = [jobId]

    if (options?.createdBy) {
      jobQuery += ' AND created_by = ?'
      jobParams.push(options.createdBy)
    }

    const jobRow = db.prepare(jobQuery).get(...jobParams)
    if (!jobRow) {
      return { job: null, items: [], totalItems: 0 }
    }

    const limit = Math.max(1, Math.min(options?.limit ?? 100, 500))
    const offset = Math.max(0, options?.offset ?? 0)

    const items = db
      .prepare(
        `
        SELECT * FROM product_bulk_job_items
        WHERE job_id = ?
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?
      `
      )
      .all(jobId, limit, offset)
      .map(rowToJobItem)

    const { total } = db.prepare(
      `
        SELECT COUNT(*) as total
        FROM product_bulk_job_items
        WHERE job_id = ?
      `
    ).get(jobId) as { total: number }

    return {
      job: rowToJob(jobRow),
      items,
      totalItems: total
    }
  } finally {
    db.close()
  }
}

export function saveProductBulkJobResult(jobId: string, result: { content: string | Buffer; mimeType: string; fileName: string }): void {
  const db = getDb()
  try {
    const buffer = Buffer.isBuffer(result.content)
      ? result.content
      : Buffer.from(result.content, 'utf8')

    db.prepare(
      `
      INSERT INTO product_bulk_job_results (job_id, mime_type, file_name, content, size, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        mime_type = excluded.mime_type,
        file_name = excluded.file_name,
        content = excluded.content,
        size = excluded.size,
        created_at = excluded.created_at
    `
    ).run(jobId, result.mimeType, result.fileName, buffer, buffer.length, Date.now())
  } finally {
    db.close()
  }
}

export function getProductBulkJobResult(jobId: string): { mimeType: string; fileName: string; content: Buffer } | null {
  const db = getDb()
  try {
    const row = db
      .prepare('SELECT * FROM product_bulk_job_results WHERE job_id = ?')
      .get(jobId)
    if (!row) return null

    return {
      mimeType: row.mime_type,
      fileName: row.file_name,
      content: row.content as Buffer
    }
  } finally {
    db.close()
  }
}

