/**
 * Reviews Database Utilities
 * Stores Trustpilot review data for admin management
 */

import Database from 'better-sqlite3'
import type { Database as SqliteDatabase } from 'better-sqlite3'
import path from 'path'

export type ReviewSource = 'trustpilot' | 'imported'

export interface StoredReview {
  review_id: string
  source: ReviewSource
  product_sku: string | null
  rating: number
  title: string | null
  text: string | null
  consumer_name: string | null
  consumer_location: string | null
  is_verified: boolean
  has_reply: boolean
  reply_text: string | null
  reply_posted_at: string | null
  reviewed_at: string
  last_synced_at: string
  permalink: string | null
  metadata: Record<string, any> | null
}

export interface ReviewFilters {
  rating?: number
  hasReply?: boolean
  search?: string
  source?: ReviewSource | 'all'
  limit?: number
  offset?: number
}

const dbPath = path.join(process.cwd(), 'filtersfast.db')

let schemaInitialized = false

function ensureSchema(db: SqliteDatabase) {
  if (schemaInitialized) return

  db.exec(`
    CREATE TABLE IF NOT EXISTS trustpilot_reviews (
      review_id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      product_sku TEXT,
      rating INTEGER NOT NULL,
      title TEXT,
      text TEXT,
      consumer_name TEXT,
      consumer_location TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      has_reply INTEGER NOT NULL DEFAULT 0,
      reply_text TEXT,
      reply_posted_at DATETIME,
      reviewed_at DATETIME NOT NULL,
      last_synced_at DATETIME NOT NULL,
      permalink TEXT,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_trustpilot_reviews_rating
      ON trustpilot_reviews(rating);

    CREATE INDEX IF NOT EXISTS idx_trustpilot_reviews_reply
      ON trustpilot_reviews(has_reply);

    CREATE INDEX IF NOT EXISTS idx_trustpilot_reviews_source
      ON trustpilot_reviews(source);

    CREATE INDEX IF NOT EXISTS idx_trustpilot_reviews_reviewed_at
      ON trustpilot_reviews(reviewed_at DESC);
  `)

  schemaInitialized = true
}

function getDb(): SqliteDatabase {
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  ensureSchema(db)
  return db
}

function mapReviewRow(row: any): StoredReview {
  return {
    review_id: row.review_id,
    source: row.source as ReviewSource,
    product_sku: row.product_sku,
    rating: row.rating,
    title: row.title,
    text: row.text,
    consumer_name: row.consumer_name,
    consumer_location: row.consumer_location,
    is_verified: Boolean(row.is_verified),
    has_reply: Boolean(row.has_reply),
    reply_text: row.reply_text,
    reply_posted_at: row.reply_posted_at,
    reviewed_at: row.reviewed_at,
    last_synced_at: row.last_synced_at,
    permalink: row.permalink,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }
}

export interface UpsertReviewInput {
  review_id: string
  source: ReviewSource
  product_sku?: string | null
  rating: number
  title?: string | null
  text?: string | null
  consumer_name?: string | null
  consumer_location?: string | null
  is_verified?: boolean
  reply_text?: string | null
  reply_posted_at?: string | null
  reviewed_at: string
  permalink?: string | null
  metadata?: Record<string, any> | null
}

export function upsertReview(input: UpsertReviewInput) {
  const db = getDb()
  try {
    const stmt = db.prepare(`
      INSERT INTO trustpilot_reviews (
        review_id,
        source,
        product_sku,
        rating,
        title,
        text,
        consumer_name,
        consumer_location,
        is_verified,
        has_reply,
        reply_text,
        reply_posted_at,
        reviewed_at,
        last_synced_at,
        permalink,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      ON CONFLICT(review_id) DO UPDATE SET
        source = excluded.source,
        product_sku = excluded.product_sku,
        rating = excluded.rating,
        title = excluded.title,
        text = excluded.text,
        consumer_name = excluded.consumer_name,
        consumer_location = excluded.consumer_location,
        is_verified = excluded.is_verified,
        has_reply = excluded.has_reply,
        reply_text = excluded.reply_text,
        reply_posted_at = excluded.reply_posted_at,
        reviewed_at = excluded.reviewed_at,
        last_synced_at = CURRENT_TIMESTAMP,
        permalink = excluded.permalink,
        metadata = excluded.metadata
    `)

    stmt.run(
      input.review_id,
      input.source,
      input.product_sku ?? null,
      input.rating,
      input.title ?? null,
      input.text ?? null,
      input.consumer_name ?? null,
      input.consumer_location ?? null,
      input.is_verified ? 1 : 0,
      input.reply_text ? 1 : 0,
      input.reply_text ?? null,
      input.reply_posted_at ?? null,
      input.reviewed_at,
      input.permalink ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null
    )
  } finally {
    db.close()
  }
}

export function listReviews(filters: ReviewFilters = {}) {
  const db = getDb()
  try {
    const conditions: string[] = []
    const params: any[] = []

    if (filters.source && filters.source !== 'all') {
      conditions.push('source = ?')
      params.push(filters.source)
    }

    if (typeof filters.rating === 'number') {
      conditions.push('rating = ?')
      params.push(filters.rating)
    }

    if (typeof filters.hasReply === 'boolean') {
      conditions.push('has_reply = ?')
      params.push(filters.hasReply ? 1 : 0)
    }

    if (filters.search) {
      const searchTerm = `%${filters.search.trim()}%`
      conditions.push(
        `(consumer_name LIKE ? OR consumer_location LIKE ? OR text LIKE ? OR title LIKE ? OR product_sku LIKE ?)`
      )
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = Math.max(1, Math.min(filters.limit ?? 50, 200))
    const offset = Math.max(0, filters.offset ?? 0)

    const rows = db
      .prepare(
        `
        SELECT *
        FROM trustpilot_reviews
        ${whereClause}
        ORDER BY reviewed_at DESC
        LIMIT ? OFFSET ?
      `
      )
      .all(...params, limit, offset)

    const totalRow = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM trustpilot_reviews
        ${whereClause}
      `
      )
      .get(...params) as { count: number }

    return {
      reviews: rows.map(mapReviewRow),
      total: totalRow?.count ?? 0,
    }
  } finally {
    db.close()
  }
}

export function getReviewById(reviewId: string): StoredReview | null {
  const db = getDb()
  try {
    const row = db
      .prepare(`SELECT * FROM trustpilot_reviews WHERE review_id = ?`)
      .get(reviewId)
    return row ? mapReviewRow(row) : null
  } finally {
    db.close()
  }
}

export function recordReviewReply(reviewId: string, replyText: string, replyDate: string) {
  const db = getDb()
  try {
    db.prepare(
      `
      UPDATE trustpilot_reviews
      SET
        has_reply = 1,
        reply_text = ?,
        reply_posted_at = ?,
        last_synced_at = CURRENT_TIMESTAMP
      WHERE review_id = ?
    `
    ).run(replyText, replyDate, reviewId)
  } finally {
    db.close()
  }
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  pendingReplies: number
  recentReviews: number
  starDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  responseRate: number
  avgResponseHours: number
}

export function getReviewStats(): ReviewStats {
  const db = getDb()
  try {
    const base = db.prepare(`
      SELECT
        COUNT(*) AS total,
        AVG(rating) AS avg_rating,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS rating_1,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS rating_2,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS rating_3,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS rating_4,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS rating_5,
        SUM(CASE WHEN has_reply = 0 THEN 1 ELSE 0 END) AS pending_replies
      FROM trustpilot_reviews
    `).get() as any

    const recent = db
      .prepare(
        `
        SELECT COUNT(*) AS recent_count
        FROM trustpilot_reviews
        WHERE reviewed_at >= datetime('now', '-7 days')
      `
      )
      .get() as { recent_count: number }

    const replyMetrics = db
      .prepare(
        `
        SELECT
          COUNT(*) AS replied_count,
          AVG(
            CAST(
              (julianday(COALESCE(reply_posted_at, reviewed_at)) - julianday(reviewed_at)) * 24
            AS REAL
          )) AS avg_hours
        FROM trustpilot_reviews
        WHERE reply_posted_at IS NOT NULL
      `
      )
      .get() as { replied_count: number; avg_hours: number | null }

    const total = base?.total || 0
    const replied = replyMetrics?.replied_count || 0

    return {
      totalReviews: total,
      averageRating: base?.avg_rating ? Number(base.avg_rating) : 0,
      pendingReplies: base?.pending_replies || 0,
      recentReviews: recent?.recent_count || 0,
      starDistribution: {
        1: base?.rating_1 || 0,
        2: base?.rating_2 || 0,
        3: base?.rating_3 || 0,
        4: base?.rating_4 || 0,
        5: base?.rating_5 || 0,
      },
      responseRate: total > 0 ? Math.round((replied / total) * 100) : 0,
      avgResponseHours: replyMetrics?.avg_hours ? Math.round(replyMetrics.avg_hours * 10) / 10 : 0,
    }
  } finally {
    db.close()
  }
}

export function deleteReview(reviewId: string) {
  const db = getDb()
  try {
    db.prepare('DELETE FROM trustpilot_reviews WHERE review_id = ?').run(reviewId)
  } finally {
    db.close()
  }
}

