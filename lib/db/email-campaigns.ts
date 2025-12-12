/**
 * Email Campaign Manager - Database Operations
 */

import Database from 'better-sqlite3';
import type { Database as SqliteDatabase } from 'better-sqlite3';
import path from 'path';
import {
  sanitize,
  sanitizeEmail,
  sanitizeObject,
} from '../sanitize';
import type {
  AddCampaignRecipientsInput,
  AddCampaignRecipientsResult,
  CampaignRecipientQuery,
  CampaignRecipientResult,
  CreateEmailCampaignInput,
  EmailCampaign,
  EmailCampaignEvent,
  EmailCampaignEventType,
  EmailCampaignListItem,
  EmailCampaignRecipient,
  EmailCampaignSummary,
  EmailCampaignStatus,
  UpdateEmailCampaignInput,
} from '../types/email-campaign';

const dbPath = path.join(process.cwd(), 'filtersfast.db');

let schemaInitialized = false;

function ensureSchema(db: SqliteDatabase) {
  if (schemaInitialized) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      from_name TEXT NOT NULL,
      from_email TEXT NOT NULL,
      reply_to_email TEXT,
      template_id TEXT,
      content_html TEXT,
      content_text TEXT,
      target_audience TEXT,
      segment_rules TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_at DATETIME,
      sent_at DATETIME,
      completed_at DATETIME,
      cancelled_at DATETIME,
      test_mode INTEGER DEFAULT 0,
      metadata TEXT,
      last_error TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_campaign_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      sent_at DATETIME,
      opened_at DATETIME,
      clicked_at DATETIME,
      bounced_at DATETIME,
      suppressed_at DATETIME,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(campaign_id, email),
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_campaign_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      recipient_email TEXT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_events_campaign ON email_campaign_events(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_campaign_events_type ON email_campaign_events(event_type);
  `);

  schemaInitialized = true;
}

function getDb(): SqliteDatabase {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  ensureSchema(db);
  return db;
}

function parseJsonValue<T>(value: unknown): T | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function stringifyJson(value?: Record<string, any> | null): string | null {
  if (!value) return null;
  return JSON.stringify(value);
}

function normalizeDate(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function mapCampaignRow(row: any): EmailCampaign {
  if (!row) {
    return row;
  }

  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    from_name: row.from_name,
    from_email: row.from_email,
    reply_to_email: row.reply_to_email,
    template_id: row.template_id,
    content_html: row.content_html,
    content_text: row.content_text,
    target_audience: row.target_audience,
    segment_rules: parseJsonValue<Record<string, any>>(row.segment_rules),
    status: row.status,
    scheduled_at: row.scheduled_at,
    sent_at: row.sent_at,
    completed_at: row.completed_at,
    cancelled_at: row.cancelled_at,
    test_mode: Boolean(row.test_mode),
    metadata: parseJsonValue<Record<string, any>>(row.metadata),
    last_error: row.last_error,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapListItemRow(row: any): EmailCampaignListItem {
  const base = mapCampaignRow(row);
  return {
    ...base,
    total_recipients: row.total_recipients ?? 0,
    sent_count: row.sent_count ?? 0,
    failed_count: row.failed_count ?? 0,
    open_count: row.open_count ?? 0,
    click_count: row.click_count ?? 0,
  };
}

function mapRecipientRow(row: any): EmailCampaignRecipient {
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    status: row.status,
    error: row.error,
    sent_at: row.sent_at,
    opened_at: row.opened_at,
    clicked_at: row.clicked_at,
    bounced_at: row.bounced_at,
    suppressed_at: row.suppressed_at,
    metadata: parseJsonValue<Record<string, any>>(row.metadata),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapEventRow(row: any): EmailCampaignEvent {
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    recipient_email: row.recipient_email,
    event_type: row.event_type,
    event_data: parseJsonValue<Record<string, any>>(row.event_data),
    created_at: row.created_at,
  };
}

function insertCampaignEventInternal(
  db: SqliteDatabase,
  campaignId: number,
  eventType: EmailCampaignEventType,
  eventData?: Record<string, any>,
  recipientEmail?: string | null
) {
  const stmt = db.prepare(`
    INSERT INTO email_campaign_events (
      campaign_id,
      recipient_email,
      event_type,
      event_data
    ) VALUES (?, ?, ?, ?)
  `);

  stmt.run(
    campaignId,
    recipientEmail || null,
    eventType,
    stringifyJson(eventData || null)
  );
}

export function recordCampaignEvent(
  campaignId: number,
  eventType: EmailCampaignEventType,
  eventData?: Record<string, any>,
  recipientEmail?: string | null
) {
  const db = getDb();
  try {
    insertCampaignEventInternal(db, campaignId, eventType, eventData, recipientEmail);
  } finally {
    db.close();
  }
}

export function getEmailCampaigns(): EmailCampaignListItem[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT
        c.*,
        COALESCE(r.total_recipients, 0) AS total_recipients,
        COALESCE(r.sent_count, 0) AS sent_count,
        COALESCE(r.failed_count, 0) AS failed_count,
        COALESCE(e.open_count, 0) AS open_count,
        COALESCE(e.click_count, 0) AS click_count
      FROM email_campaigns c
      LEFT JOIN (
        SELECT
          campaign_id,
          COUNT(*) AS total_recipients,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count
        FROM email_campaign_recipients
        GROUP BY campaign_id
      ) AS r ON r.campaign_id = c.id
      LEFT JOIN (
        SELECT
          campaign_id,
          SUM(CASE WHEN event_type = 'opened' THEN 1 ELSE 0 END) AS open_count,
          SUM(CASE WHEN event_type = 'clicked' THEN 1 ELSE 0 END) AS click_count
        FROM email_campaign_events
        GROUP BY campaign_id
      ) AS e ON e.campaign_id = c.id
      ORDER BY c.created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(mapListItemRow);
  } finally {
    db.close();
  }
}

export function getEmailCampaignById(id: number): EmailCampaign | null {
  const db = getDb();
  try {
    const stmt = db.prepare('SELECT * FROM email_campaigns WHERE id = ?');
    const row = stmt.get(id);
    return row ? mapCampaignRow(row) : null;
  } finally {
    db.close();
  }
}

export function createEmailCampaign(
  input: CreateEmailCampaignInput,
  createdBy: number
): EmailCampaign {
  const db = getDb();
  try {
    const sanitizedMetadata = input.metadata
      ? sanitizeObject(input.metadata)
      : null;
    const sanitizedSegmentRules = input.segmentRules
      ? sanitizeObject(input.segmentRules)
      : null;
    const scheduledAt = normalizeDate(input.scheduledAt);
    const status: EmailCampaignStatus = scheduledAt ? 'scheduled' : 'draft';

    const stmt = db.prepare(`
      INSERT INTO email_campaigns (
        name,
        subject,
        from_name,
        from_email,
        reply_to_email,
        template_id,
        content_html,
        content_text,
        target_audience,
        segment_rules,
        status,
        scheduled_at,
        test_mode,
        metadata,
        created_by,
        updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      sanitize(input.name),
      sanitize(input.subject),
      sanitize(input.fromName),
      sanitizeEmail(input.fromEmail),
      input.replyToEmail ? sanitizeEmail(input.replyToEmail) : null,
      input.templateId ? sanitize(input.templateId) : null,
      input.templateId ? null : input.contentHtml || null,
      input.templateId ? null : (input.contentText ? sanitize(input.contentText) : null),
      input.targetAudience ? sanitize(input.targetAudience) : null,
      stringifyJson(sanitizedSegmentRules),
      status,
      scheduledAt,
      input.testMode ? 1 : 0,
      stringifyJson(sanitizedMetadata),
      createdBy,
      createdBy
    );

    const campaignId = Number(result.lastInsertRowid);
    insertCampaignEventInternal(db, campaignId, 'created', {
      createdBy,
      status,
    });

    const campaignRow = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(campaignId);
    return mapCampaignRow(campaignRow);
  } finally {
    db.close();
  }
}

export function updateEmailCampaign(
  id: number,
  updates: UpdateEmailCampaignInput,
  updatedBy?: number
): EmailCampaign | null {
  const db = getDb();
  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    let statusChange: EmailCampaignStatus | null = null;

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(sanitize(updates.name));
    }
    if (updates.subject !== undefined) {
      setClauses.push('subject = ?');
      values.push(sanitize(updates.subject));
    }
    if (updates.fromName !== undefined) {
      setClauses.push('from_name = ?');
      values.push(sanitize(updates.fromName));
    }
    if (updates.fromEmail !== undefined) {
      setClauses.push('from_email = ?');
      values.push(sanitizeEmail(updates.fromEmail));
    }
    if (updates.replyToEmail !== undefined) {
      setClauses.push('reply_to_email = ?');
      values.push(updates.replyToEmail ? sanitizeEmail(updates.replyToEmail) : null);
    }
    if (updates.templateId !== undefined) {
      setClauses.push('template_id = ?');
      values.push(updates.templateId ? sanitize(updates.templateId) : null);
      if (updates.templateId) {
        setClauses.push('content_html = NULL');
        setClauses.push('content_text = NULL');
      }
    }
    if (updates.contentHtml !== undefined && !updates.templateId) {
      setClauses.push('content_html = ?');
      values.push(updates.contentHtml || null);
    }
    if (updates.contentText !== undefined && !updates.templateId) {
      setClauses.push('content_text = ?');
      values.push(updates.contentText ? sanitize(updates.contentText) : null);
    }
    if (updates.targetAudience !== undefined) {
      setClauses.push('target_audience = ?');
      values.push(updates.targetAudience ? sanitize(updates.targetAudience) : null);
    }
    if (updates.segmentRules !== undefined) {
      const sanitizedRules = updates.segmentRules
        ? sanitizeObject(updates.segmentRules)
        : null;
      setClauses.push('segment_rules = ?');
      values.push(stringifyJson(sanitizedRules));
    }
    if (updates.metadata !== undefined) {
      const sanitizedMetadata = updates.metadata
        ? sanitizeObject(updates.metadata)
        : null;
      setClauses.push('metadata = ?');
      values.push(stringifyJson(sanitizedMetadata));
    }
    if (updates.scheduledAt !== undefined) {
      setClauses.push('scheduled_at = ?');
      values.push(normalizeDate(updates.scheduledAt));
    }
    if (updates.testMode !== undefined) {
      setClauses.push('test_mode = ?');
      values.push(updates.testMode ? 1 : 0);
    }
    if (updates.status !== undefined) {
      statusChange = updates.status;
      setClauses.push('status = ?');
      values.push(updates.status);

      if (updates.status === 'sending') {
        setClauses.push('sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP)');
      } else if (updates.status === 'sent') {
        setClauses.push('completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)');
      } else if (updates.status === 'cancelled') {
        setClauses.push('cancelled_at = CURRENT_TIMESTAMP');
      }
    }
    if (updatedBy !== undefined) {
      setClauses.push('updated_by = ?');
      values.push(updatedBy);
    }

    if (setClauses.length === 0) {
      return getEmailCampaignById(id);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    const stmt = db.prepare(`
      UPDATE email_campaigns
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `);

    values.push(id);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return null;
    }

    if (statusChange) {
      insertCampaignEventInternal(db, id, 'status_changed', {
        status: statusChange,
      });
    } else {
      insertCampaignEventInternal(db, id, 'updated', {
        updatedBy,
      });
    }

    const row = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(id);
    return mapCampaignRow(row);
  } finally {
    db.close();
  }
}

export function updateCampaignStatus(
  id: number,
  status: EmailCampaignStatus,
  options: { scheduledAt?: string | null } = {},
  updatedBy?: number
): EmailCampaign | null {
  const db = getDb();
  try {
    const clauses: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [status];

    if (status === 'scheduled') {
      clauses.push('scheduled_at = ?');
      values.push(normalizeDate(options.scheduledAt) || new Date().toISOString());
    } else if (options.scheduledAt !== undefined) {
      clauses.push('scheduled_at = ?');
      values.push(normalizeDate(options.scheduledAt));
    }

    if (status === 'sending') {
      clauses.push('sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP)');
    }
    if (status === 'sent') {
      clauses.push('completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)');
    }
    if (status === 'cancelled') {
      clauses.push('cancelled_at = CURRENT_TIMESTAMP');
    }
    if (status === 'draft') {
      clauses.push('sent_at = NULL');
      clauses.push('completed_at = NULL');
      clauses.push('cancelled_at = NULL');
    }

    if (updatedBy !== undefined) {
      clauses.push('updated_by = ?');
      values.push(updatedBy);
    }

    const stmt = db.prepare(`
      UPDATE email_campaigns
      SET ${clauses.join(', ')}
      WHERE id = ?
    `);

    values.push(id);
    const result = stmt.run(...values);
    if (result.changes === 0) {
      return null;
    }

    insertCampaignEventInternal(db, id, 'status_changed', {
      status,
      scheduledAt: options.scheduledAt ? normalizeDate(options.scheduledAt) : null,
    });

    const row = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(id);
    return mapCampaignRow(row);
  } finally {
    db.close();
  }
}

export function deleteEmailCampaign(id: number): boolean {
  const db = getDb();
  try {
    const stmt = db.prepare('DELETE FROM email_campaigns WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

export function addCampaignRecipients(
  campaignId: number,
  input: AddCampaignRecipientsInput
): AddCampaignRecipientsResult {
  const db = getDb();
  try {
    if (input.overwrite) {
      db.prepare('DELETE FROM email_campaign_recipients WHERE campaign_id = ?').run(campaignId);
    }

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO email_campaign_recipients (
        campaign_id,
        email,
        first_name,
        last_name,
        metadata,
        status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    const updateStmt = db.prepare(`
      UPDATE email_campaign_recipients
      SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        metadata = COALESCE(?, metadata),
        status = 'pending',
        error = NULL,
        sent_at = NULL,
        opened_at = NULL,
        clicked_at = NULL,
        bounced_at = NULL,
        suppressed_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE campaign_id = ? AND email = ?
    `);

    let added = 0;
    let skipped = 0;

    const transaction = db.transaction((recipients: AddCampaignRecipientsInput['recipients']) => {
      for (const recipient of recipients) {
        const email = sanitizeEmail(recipient.email);
        if (!email) {
          skipped += 1;
          continue;
        }

        const firstName = recipient.firstName ? sanitize(recipient.firstName) : null;
        const lastName = recipient.lastName ? sanitize(recipient.lastName) : null;
        const metadata = recipient.metadata
          ? stringifyJson(sanitizeObject(recipient.metadata))
          : null;

        const result = insertStmt.run(
          campaignId,
          email,
          firstName,
          lastName,
          metadata
        );

        if (result.changes === 0) {
          skipped += 1;
          updateStmt.run(
            firstName,
            lastName,
            metadata,
            campaignId,
            email
          );
        } else {
          added += 1;
        }
      }
    });

    transaction(input.recipients);

    insertCampaignEventInternal(db, campaignId, 'recipient_added', {
      added,
      skipped,
    });

    return { added, skipped };
  } finally {
    db.close();
  }
}

export function getCampaignRecipients(
  campaignId: number,
  query: CampaignRecipientQuery = {}
): CampaignRecipientResult {
  const db = getDb();
  try {
    const conditions: string[] = ['campaign_id = ?'];
    const params: any[] = [campaignId];

    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    const whereClause = conditions.join(' AND ');
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    const offset = Math.max(query.offset ?? 0, 0);

    const listStmt = db.prepare(`
      SELECT *
      FROM email_campaign_recipients
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const totalStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM email_campaign_recipients
      WHERE ${whereClause}
    `);

    const rows = listStmt.all(...params, limit, offset);
    const totalRow = totalStmt.get(...params) as { count: number };

    return {
      recipients: rows.map(mapRecipientRow),
      total: totalRow?.count ?? 0,
    };
  } finally {
    db.close();
  }
}

export function getCampaignEvents(
  campaignId: number,
  limit: number = 200
): EmailCampaignEvent[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT *
      FROM email_campaign_events
      WHERE campaign_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(campaignId, Math.min(Math.max(limit, 1), 500));
    return rows.map(mapEventRow);
  } finally {
    db.close();
  }
}

export function getCampaignSummary(campaignId: number): EmailCampaignSummary {
  const db = getDb();
  try {
    const counts = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'sending' THEN 1 ELSE 0 END) AS sending,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped
      FROM email_campaign_recipients
      WHERE campaign_id = ?
    `).get(campaignId) as any;

    const events = db.prepare(`
      SELECT
        SUM(CASE WHEN event_type = 'opened' THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN event_type = 'clicked' THEN 1 ELSE 0 END) AS click_count,
        SUM(CASE WHEN event_type = 'bounced' THEN 1 ELSE 0 END) AS bounce_count,
        SUM(CASE WHEN event_type = 'unsubscribed' THEN 1 ELSE 0 END) AS unsubscribe_count,
        MAX(created_at) AS last_event_at
      FROM email_campaign_events
      WHERE campaign_id = ?
    `).get(campaignId) as any;

    return {
      total_recipients: counts?.total || 0,
      pending_count: counts?.pending || 0,
      sending_count: counts?.sending || 0,
      sent_count: counts?.sent || 0,
      failed_count: counts?.failed || 0,
      skipped_count: counts?.skipped || 0,
      open_count: events?.open_count || 0,
      click_count: events?.click_count || 0,
      bounce_count: events?.bounce_count || 0,
      unsubscribe_count: events?.unsubscribe_count || 0,
      last_event_at: events?.last_event_at || null,
    };
  } finally {
    db.close();
  }
}

export function getCampaignsReadyToSend(limit: number = 5): EmailCampaign[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT *
      FROM email_campaigns
      WHERE status IN ('scheduled', 'sending')
        AND (status = 'sending' OR scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
        AND (status != 'scheduled' OR cancelled_at IS NULL)
      ORDER BY
        status = 'sending' DESC,
        scheduled_at IS NULL,
        scheduled_at ASC,
        created_at ASC
      LIMIT ?
    `);

    const rows = stmt.all(Math.max(1, limit));
    return rows.map(mapCampaignRow);
  } finally {
    db.close();
  }
}

export function claimRecipientsForSending(
  campaignId: number,
  batchSize: number = 100
): EmailCampaignRecipient[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      UPDATE email_campaign_recipients
      SET
        status = 'sending',
        error = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT id
        FROM email_campaign_recipients
        WHERE campaign_id = ?
          AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT ?
      )
      RETURNING *
    `);

    const rows = stmt.all(campaignId, Math.max(1, Math.min(batchSize, 500)));
    return rows.map(mapRecipientRow);
  } finally {
    db.close();
  }
}

export function markRecipientSent(recipientId: number): void {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE email_campaign_recipients
      SET
        status = 'sent',
        error = NULL,
        sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(recipientId);
  } finally {
    db.close();
  }
}

export function markRecipientFailed(recipientId: number, error: string): void {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE email_campaign_recipients
      SET
        status = 'failed',
        error = ?,
        sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(error.slice(0, 500), recipientId);
  } finally {
    db.close();
  }
}

export function markRecipientSkipped(recipientId: number, reason?: string): void {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE email_campaign_recipients
      SET
        status = 'skipped',
        error = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason ? reason.slice(0, 500) : null, recipientId);
  } finally {
    db.close();
  }
}

export function setCampaignLastError(campaignId: number, error: string | null): void {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE email_campaigns
      SET
        last_error = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(error ? error.slice(0, 500) : null, campaignId);
  } finally {
    db.close();
  }
}



