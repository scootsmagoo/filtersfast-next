/**
 * Affiliate Program Database Functions
 * 
 * Performance-based marketing system for external partners
 */

import Database from 'better-sqlite3';
import { sanitizeInput } from '@/lib/sanitize';
import { 
  Affiliate,
  AffiliateApplication,
  AffiliateClick,
  AffiliateConversion,
  AffiliatePayout,
  AffiliateMarketingMaterial,
  AffiliateStats,
  AffiliateSettings,
  AdminAffiliateOverview,
  CreateAffiliateInput,
  UpdateAffiliateInput,
  TrackAffiliateClickInput,
  CreateAffiliateConversionInput,
  AffiliateRegistrationData,
  AffiliateStatus,
  CommissionType,
  PayoutStatus,
  PayoutMethod
} from '@/lib/types/affiliate';

const db = new Database('filtersfast.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize affiliate tables
 */
export function initAffiliatesTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      affiliate_code TEXT UNIQUE NOT NULL,
      company_name TEXT,
      website TEXT,
      promotional_methods TEXT NOT NULL DEFAULT '[]', -- JSON array
      audience_size TEXT,
      commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK(commission_type IN ('percentage', 'flat', 'tiered')),
      commission_rate REAL NOT NULL DEFAULT 10.0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'suspended', 'rejected')),
      approved_by TEXT,
      approved_at TEXT,
      rejected_reason TEXT,
      paypal_email TEXT,
      bank_account_info TEXT,
      preferred_payout_method TEXT NOT NULL DEFAULT 'paypal' CHECK(preferred_payout_method IN ('paypal', 'bank_transfer', 'check')),
      minimum_payout_threshold REAL NOT NULL DEFAULT 50.0,
      total_clicks INTEGER DEFAULT 0,
      total_conversions INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      total_commission_earned REAL DEFAULT 0,
      total_commission_paid REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
    CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
    CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_name TEXT,
      website TEXT NOT NULL,
      promotional_methods TEXT NOT NULL, -- JSON array
      audience_size TEXT,
      promotion_plan TEXT NOT NULL,
      social_media_links TEXT, -- JSON array
      monthly_traffic TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reviewed_by TEXT,
      reviewed_at TEXT,
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_affiliate_applications_user_id ON affiliate_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL,
      affiliate_code TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer_url TEXT,
      landing_page TEXT NOT NULL,
      converted INTEGER DEFAULT 0,
      order_id TEXT,
      session_token TEXT NOT NULL,
      clicked_at TEXT NOT NULL,
      FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
    CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session_token ON affiliate_clicks(session_token);
    CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL,
      affiliate_code TEXT NOT NULL,
      click_id TEXT,
      order_id TEXT NOT NULL,
      customer_id TEXT,
      order_total REAL NOT NULL,
      commission_rate REAL NOT NULL,
      commission_amount REAL NOT NULL,
      commission_status TEXT NOT NULL DEFAULT 'pending' CHECK(commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
      converted_at TEXT NOT NULL,
      approved_at TEXT,
      paid_at TEXT,
      FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate_id ON affiliate_conversions(affiliate_id);
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_order_id ON affiliate_conversions(order_id);
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_status ON affiliate_conversions(commission_status);
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_converted_at ON affiliate_conversions(converted_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_payouts (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payout_method TEXT NOT NULL CHECK(payout_method IN ('paypal', 'bank_transfer', 'check')),
      payout_status TEXT NOT NULL DEFAULT 'pending' CHECK(payout_status IN ('pending', 'processing', 'paid', 'failed')),
      transaction_id TEXT,
      payout_date TEXT,
      payout_notes TEXT,
      conversion_ids TEXT NOT NULL, -- JSON array
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      processed_by TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
    CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(payout_status);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_marketing_materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('banner', 'text_link', 'product_link', 'email_template')),
      image_url TEXT,
      link_text TEXT,
      html_code TEXT,
      width INTEGER,
      height INTEGER,
      usage_count INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_affiliate_marketing_materials_type ON affiliate_marketing_materials(type);
    CREATE INDEX IF NOT EXISTS idx_affiliate_marketing_materials_active ON affiliate_marketing_materials(active);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      program_enabled INTEGER DEFAULT 1,
      auto_approve_affiliates INTEGER DEFAULT 0,
      default_commission_type TEXT NOT NULL DEFAULT 'percentage',
      default_commission_rate REAL NOT NULL DEFAULT 10.0,
      cookie_duration_days INTEGER NOT NULL DEFAULT 30,
      minimum_payout_threshold REAL NOT NULL DEFAULT 50.0,
      payout_schedule TEXT NOT NULL DEFAULT 'monthly' CHECK(payout_schedule IN ('monthly', 'bi_monthly', 'manual')),
      commission_hold_days INTEGER NOT NULL DEFAULT 30,
      require_website INTEGER DEFAULT 1,
      require_traffic_info INTEGER DEFAULT 1,
      terms_text TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    -- Insert default settings if not exists
    INSERT OR IGNORE INTO affiliate_settings (id, created_at, updated_at)
    VALUES ('default', datetime('now'), datetime('now'));
  `);
}

/**
 * Generate unique affiliate code
 */
function generateAffiliateCode(name: string, existingCodes: string[]): string {
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  let code = cleanName + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  let attempts = 0;
  
  while (existingCodes.includes(code) && attempts < 100) {
    code = cleanName + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    attempts++;
  }
  
  return code;
}

/**
 * Submit affiliate application
 */
export function submitAffiliateApplication(
  userId: string,
  data: AffiliateRegistrationData
): AffiliateApplication {
  ensureTablesInitialized();
  
  // Check if user already has an application
  const existing = db.prepare(`
    SELECT id FROM affiliate_applications WHERE user_id = ? AND status = 'pending'
  `).get(userId);
  
  if (existing) {
    throw new Error('You already have a pending application');
  }
  
  // Check if user is already an affiliate
  const existingAffiliate = db.prepare(`
    SELECT id FROM affiliates WHERE user_id = ?
  `).get(userId);
  
  if (existingAffiliate) {
    throw new Error('You are already an affiliate');
  }
  
  const id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  
  // SECURITY: Sanitize all text inputs to prevent XSS
  db.prepare(`
    INSERT INTO affiliate_applications (
      id, user_id, company_name, website, promotional_methods,
      audience_size, promotion_plan, social_media_links, monthly_traffic,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(
    id,
    userId,
    data.company_name ? sanitizeInput(data.company_name) : null,
    sanitizeInput(data.website),
    JSON.stringify(data.promotional_methods),
    data.audience_size || null,
    sanitizeInput(data.promotion_plan),
    data.social_media_links ? JSON.stringify(data.social_media_links.map(link => sanitizeInput(link))) : null,
    data.monthly_traffic ? sanitizeInput(data.monthly_traffic) : null,
    now,
    now
  );
  
  const application = getAffiliateApplicationById(id);
  if (!application) {
    throw new Error('Failed to create application');
  }
  
  return application;
}

/**
 * Get affiliate application by ID
 */
export function getAffiliateApplicationById(id: string): AffiliateApplication | null {
  const app = db.prepare(`
    SELECT * FROM affiliate_applications WHERE id = ?
  `).get(id) as any;
  
  if (!app) return null;
  
  return {
    ...app,
    promotional_methods: JSON.parse(app.promotional_methods),
    social_media_links: app.social_media_links ? JSON.parse(app.social_media_links) : undefined
  };
}

/**
 * Get all pending applications (admin)
 */
export function getPendingApplications(): AffiliateApplication[] {
  ensureTablesInitialized();
  const apps = db.prepare(`
    SELECT * FROM affiliate_applications 
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `).all() as any[];
  
  return apps.map(app => ({
    ...app,
    promotional_methods: JSON.parse(app.promotional_methods),
    social_media_links: app.social_media_links ? JSON.parse(app.social_media_links) : undefined
  }));
}

/**
 * Approve affiliate application
 */
export function approveAffiliateApplication(
  applicationId: string,
  adminUserId: string,
  customCommissionRate?: number
): Affiliate {
  const application = getAffiliateApplicationById(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }
  
  if (application.status !== 'pending') {
    throw new Error('Application is not pending');
  }
  
  // Get settings for default commission
  const settings = getAffiliateSettings();
  
  // Get user info for code generation
  const authDb = new Database('auth.db');
  const user = authDb.prepare('SELECT name, email FROM user WHERE id = ?')
    .get(application.user_id) as { name: string | null; email: string } | undefined;
  authDb.close();
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get all existing codes
  const existingCodes = db.prepare('SELECT affiliate_code FROM affiliates')
    .all()
    .map((r: any) => r.affiliate_code);
  
  // Generate unique affiliate code
  const affiliateCode = generateAffiliateCode(
    user.name || user.email,
    existingCodes
  );
  
  const now = new Date().toISOString();
  const affiliateId = `aff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create affiliate account (data already sanitized from application)
  db.prepare(`
    INSERT INTO affiliates (
      id, user_id, affiliate_code, company_name, website,
      promotional_methods, audience_size, commission_type, commission_rate,
      status, approved_by, approved_at, paypal_email, preferred_payout_method,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
  `).run(
    affiliateId,
    application.user_id,
    affiliateCode,
    application.company_name || null,
    application.website,
    JSON.stringify(application.promotional_methods),
    application.audience_size || null,
    settings.default_commission_type,
    customCommissionRate || settings.default_commission_rate,
    adminUserId,
    now,
    null, // paypal_email - they can add later
    'paypal',
    now,
    now
  );
  
  // Update application status
  db.prepare(`
    UPDATE affiliate_applications
    SET status = 'approved', reviewed_by = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(adminUserId, now, now, applicationId);
  
  const affiliate = getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new Error('Failed to create affiliate');
  }
  
  return affiliate;
}

/**
 * Reject affiliate application
 */
export function rejectAffiliateApplication(
  applicationId: string,
  adminUserId: string,
  reason: string
): void {
  const now = new Date().toISOString();
  
  // SECURITY: Sanitize rejection reason to prevent stored XSS
  const sanitizedReason = sanitizeInput(reason);
  
  db.prepare(`
    UPDATE affiliate_applications
    SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, rejection_reason = ?, updated_at = ?
    WHERE id = ? AND status = 'pending'
  `).run(adminUserId, now, sanitizedReason, now, applicationId);
}

/**
 * Get affiliate by ID
 */
export function getAffiliateById(id: string): Affiliate | null {
  const affiliate = db.prepare(`
    SELECT * FROM affiliates WHERE id = ?
  `).get(id) as any;
  
  if (!affiliate) return null;
  
  return {
    ...affiliate,
    promotional_methods: JSON.parse(affiliate.promotional_methods)
  };
}

/**
 * Get affiliate by user ID
 */
export function getAffiliateByUserId(userId: string): Affiliate | null {
  ensureTablesInitialized();
  const affiliate = db.prepare(`
    SELECT * FROM affiliates WHERE user_id = ?
  `).get(userId) as any;
  
  if (!affiliate) return null;
  
  return {
    ...affiliate,
    promotional_methods: JSON.parse(affiliate.promotional_methods)
  };
}

/**
 * Get affiliate by code
 */
export function getAffiliateByCode(code: string): Affiliate | null {
  const affiliate = db.prepare(`
    SELECT * FROM affiliates WHERE affiliate_code = ? COLLATE NOCASE
  `).get(code) as any;
  
  if (!affiliate) return null;
  
  return {
    ...affiliate,
    promotional_methods: JSON.parse(affiliate.promotional_methods)
  };
}

/**
 * Update affiliate
 */
export function updateAffiliate(input: UpdateAffiliateInput): Affiliate {
  const existing = getAffiliateById(input.id);
  if (!existing) {
    throw new Error('Affiliate not found');
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.company_name !== undefined) {
    updates.push('company_name = ?');
    values.push(input.company_name ? sanitizeInput(input.company_name) : null);
  }
  if (input.website !== undefined) {
    updates.push('website = ?');
    values.push(input.website ? sanitizeInput(input.website) : null);
  }
  if (input.promotional_methods !== undefined) {
    updates.push('promotional_methods = ?');
    values.push(JSON.stringify(input.promotional_methods));
  }
  if (input.audience_size !== undefined) {
    updates.push('audience_size = ?');
    values.push(input.audience_size || null);
  }
  if (input.commission_type !== undefined) {
    updates.push('commission_type = ?');
    values.push(input.commission_type);
  }
  if (input.commission_rate !== undefined) {
    updates.push('commission_rate = ?');
    values.push(input.commission_rate);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    values.push(input.status);
  }
  if (input.paypal_email !== undefined) {
    updates.push('paypal_email = ?');
    values.push(input.paypal_email ? sanitizeInput(input.paypal_email) : null);
  }
  if (input.bank_account_info !== undefined) {
    updates.push('bank_account_info = ?');
    // Note: Bank account info should be encrypted before storage in production
    values.push(input.bank_account_info || null);
  }
  if (input.preferred_payout_method !== undefined) {
    updates.push('preferred_payout_method = ?');
    values.push(input.preferred_payout_method);
  }
  if (input.minimum_payout_threshold !== undefined) {
    updates.push('minimum_payout_threshold = ?');
    values.push(input.minimum_payout_threshold);
  }
  
  if (updates.length === 0) {
    return existing;
  }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(input.id);
  
  db.prepare(`
    UPDATE affiliates
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);
  
  const updated = getAffiliateById(input.id);
  if (!updated) {
    throw new Error('Failed to update affiliate');
  }
  
  return updated;
}

/**
 * Track affiliate click
 */
export function trackAffiliateClick(input: TrackAffiliateClickInput): AffiliateClick {
  const affiliate = getAffiliateByCode(input.affiliate_code);
  if (!affiliate || affiliate.status !== 'active') {
    throw new Error('Invalid or inactive affiliate code');
  }
  
  const id = `click_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 16)}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO affiliate_clicks (
      id, affiliate_id, affiliate_code, ip_address, user_agent,
      referrer_url, landing_page, session_token, clicked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    affiliate.id,
    affiliate.affiliate_code,
    input.ip_address || null,
    input.user_agent || null,
    input.referrer_url || null,
    input.landing_page,
    sessionToken,
    now
  );
  
  // Update affiliate stats
  db.prepare(`
    UPDATE affiliates
    SET total_clicks = total_clicks + 1, updated_at = ?
    WHERE id = ?
  `).run(now, affiliate.id);
  
  return {
    id,
    affiliate_id: affiliate.id,
    affiliate_code: affiliate.affiliate_code,
    ip_address: input.ip_address || null,
    user_agent: input.user_agent || null,
    referrer_url: input.referrer_url || null,
    landing_page: input.landing_page,
    converted: false,
    order_id: null,
    session_token: sessionToken,
    clicked_at: now
  };
}

/**
 * Create affiliate conversion
 */
export function createAffiliateConversion(input: CreateAffiliateConversionInput): AffiliateConversion {
  const affiliate = getAffiliateByCode(input.affiliate_code);
  if (!affiliate || affiliate.status !== 'active') {
    throw new Error('Invalid or inactive affiliate code');
  }
  
  // Check if conversion already exists for this order
  const existing = db.prepare(`
    SELECT id FROM affiliate_conversions WHERE order_id = ?
  `).get(input.order_id);
  
  if (existing) {
    throw new Error('Conversion already exists for this order');
  }
  
  const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  
  // Calculate commission
  let commissionAmount = 0;
  if (affiliate.commission_type === 'percentage') {
    commissionAmount = input.order_total * (affiliate.commission_rate / 100);
  } else {
    commissionAmount = affiliate.commission_rate;
  }
  commissionAmount = Math.round(commissionAmount * 100) / 100; // Round to 2 decimals
  
  // Try to find the click (if session_token provided)
  let clickId: string | null = null;
  if (input.session_token) {
    const click = db.prepare(`
      SELECT id FROM affiliate_clicks
      WHERE session_token = ? AND affiliate_id = ? AND converted = 0
      ORDER BY clicked_at DESC
      LIMIT 1
    `).get(input.session_token, affiliate.id) as any;
    
    if (click) {
      clickId = click.id;
      
      // Mark click as converted
      db.prepare(`
        UPDATE affiliate_clicks
        SET converted = 1, order_id = ?
        WHERE id = ?
      `).run(input.order_id, clickId);
    }
  }
  
  // Create conversion
  db.prepare(`
    INSERT INTO affiliate_conversions (
      id, affiliate_id, affiliate_code, click_id, order_id, customer_id,
      order_total, commission_rate, commission_amount, commission_status,
      converted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    affiliate.id,
    affiliate.affiliate_code,
    clickId,
    input.order_id,
    input.customer_id || null,
    input.order_total,
    affiliate.commission_rate,
    commissionAmount,
    now
  );
  
  // Update affiliate stats
  db.prepare(`
    UPDATE affiliates
    SET total_conversions = total_conversions + 1,
        total_revenue = total_revenue + ?,
        total_commission_earned = total_commission_earned + ?,
        updated_at = ?
    WHERE id = ?
  `).run(input.order_total, commissionAmount, now, affiliate.id);
  
  return {
    id,
    affiliate_id: affiliate.id,
    affiliate_code: affiliate.affiliate_code,
    click_id: clickId,
    order_id: input.order_id,
    customer_id: input.customer_id || null,
    order_total: input.order_total,
    commission_rate: affiliate.commission_rate,
    commission_amount: commissionAmount,
    commission_status: 'pending',
    converted_at: now,
    approved_at: null,
    paid_at: null
  };
}

/**
 * Get affiliate stats
 */
export function getAffiliateStats(
  affiliateId: string,
  startDate?: Date,
  endDate?: Date
): AffiliateStats {
  const affiliate = getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  
  // Get clicks
  const clickStats = db.prepare(`
    SELECT 
      COUNT(*) as total_clicks,
      COUNT(DISTINCT session_token) as unique_clicks
    FROM affiliate_clicks
    WHERE affiliate_id = ?
    AND clicked_at >= ?
    AND clicked_at <= ?
  `).get(affiliateId, start.toISOString(), end.toISOString()) as any;
  
  // Get conversions
  const conversionStats = db.prepare(`
    SELECT 
      COUNT(*) as total_conversions,
      SUM(order_total) as total_revenue,
      AVG(order_total) as avg_order_value,
      SUM(commission_amount) as total_commission,
      SUM(CASE WHEN commission_status = 'pending' THEN commission_amount ELSE 0 END) as pending_commission,
      SUM(CASE WHEN commission_status = 'approved' THEN commission_amount ELSE 0 END) as approved_commission,
      SUM(CASE WHEN commission_status = 'paid' THEN commission_amount ELSE 0 END) as paid_commission
    FROM affiliate_conversions
    WHERE affiliate_id = ?
    AND converted_at >= ?
    AND converted_at <= ?
  `).get(affiliateId, start.toISOString(), end.toISOString()) as any;
  
  // Get recent conversions
  const recentConversions = db.prepare(`
    SELECT 
      order_id,
      order_total,
      commission_amount,
      commission_status,
      converted_at
    FROM affiliate_conversions
    WHERE affiliate_id = ?
    ORDER BY converted_at DESC
    LIMIT 10
  `).all(affiliateId) as any[];
  
  const totalClicks = clickStats?.total_clicks || 0;
  const totalConversions = conversionStats?.total_conversions || 0;
  
  return {
    affiliate_id: affiliateId,
    affiliate_code: affiliate.affiliate_code,
    total_clicks: totalClicks,
    unique_clicks: clickStats?.unique_clicks || 0,
    total_conversions: totalConversions,
    conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    total_revenue: conversionStats?.total_revenue || 0,
    average_order_value: conversionStats?.avg_order_value || 0,
    total_commission: conversionStats?.total_commission || 0,
    pending_commission: conversionStats?.pending_commission || 0,
    approved_commission: conversionStats?.approved_commission || 0,
    paid_commission: conversionStats?.paid_commission || 0,
    next_payout_amount: conversionStats?.approved_commission || 0,
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    recent_conversions: recentConversions
  };
}

/**
 * Get all affiliates (admin)
 */
export function getAllAffiliates(): Affiliate[] {
  ensureTablesInitialized();
  const affiliates = db.prepare(`
    SELECT * FROM affiliates
    ORDER BY created_at DESC
  `).all() as any[];
  
  return affiliates.map(aff => ({
    ...aff,
    promotional_methods: JSON.parse(aff.promotional_methods)
  }));
}

/**
 * Get affiliate settings
 */
export function getAffiliateSettings(): AffiliateSettings {
  ensureTablesInitialized();
  const settings = db.prepare(`
    SELECT * FROM affiliate_settings WHERE id = 'default'
  `).get() as any;
  
  if (!settings) {
    throw new Error('Affiliate settings not found');
  }
  
  return {
    ...settings,
    program_enabled: Boolean(settings.program_enabled),
    auto_approve_affiliates: Boolean(settings.auto_approve_affiliates),
    require_website: Boolean(settings.require_website),
    require_traffic_info: Boolean(settings.require_traffic_info)
  };
}

/**
 * Update affiliate settings (admin)
 */
export function updateAffiliateSettings(updates: Partial<AffiliateSettings>): AffiliateSettings {
  const now = new Date().toISOString();
  
  const updateFields: string[] = [];
  const values: any[] = [];
  
  if (updates.program_enabled !== undefined) {
    updateFields.push('program_enabled = ?');
    values.push(updates.program_enabled ? 1 : 0);
  }
  if (updates.auto_approve_affiliates !== undefined) {
    updateFields.push('auto_approve_affiliates = ?');
    values.push(updates.auto_approve_affiliates ? 1 : 0);
  }
  if (updates.default_commission_type !== undefined) {
    updateFields.push('default_commission_type = ?');
    values.push(updates.default_commission_type);
  }
  if (updates.default_commission_rate !== undefined) {
    updateFields.push('default_commission_rate = ?');
    values.push(updates.default_commission_rate);
  }
  if (updates.cookie_duration_days !== undefined) {
    updateFields.push('cookie_duration_days = ?');
    values.push(updates.cookie_duration_days);
  }
  if (updates.minimum_payout_threshold !== undefined) {
    updateFields.push('minimum_payout_threshold = ?');
    values.push(updates.minimum_payout_threshold);
  }
  if (updates.payout_schedule !== undefined) {
    updateFields.push('payout_schedule = ?');
    values.push(updates.payout_schedule);
  }
  if (updates.commission_hold_days !== undefined) {
    updateFields.push('commission_hold_days = ?');
    values.push(updates.commission_hold_days);
  }
  if (updates.require_website !== undefined) {
    updateFields.push('require_website = ?');
    values.push(updates.require_website ? 1 : 0);
  }
  if (updates.require_traffic_info !== undefined) {
    updateFields.push('require_traffic_info = ?');
    values.push(updates.require_traffic_info ? 1 : 0);
  }
  if (updates.terms_text !== undefined) {
    updateFields.push('terms_text = ?');
    // SECURITY: Sanitize terms text to prevent stored XSS
    values.push(updates.terms_text ? sanitizeInput(updates.terms_text) : null);
  }
  
  updateFields.push('updated_at = ?');
  values.push(now);
  
  if (updateFields.length > 0) {
    db.prepare(`
      UPDATE affiliate_settings
      SET ${updateFields.join(', ')}
      WHERE id = 'default'
    `).run(...values);
  }
  
  return getAffiliateSettings();
}

/**
 * Get admin overview
 */
export function getAdminAffiliateOverview(): AdminAffiliateOverview {
  ensureTablesInitialized();
  
  // Get affiliate counts
  const affiliateStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
    FROM affiliates
  `).get() as any;
  
  const pendingApps = db.prepare(`
    SELECT COUNT(*) as count FROM affiliate_applications WHERE status = 'pending'
  `).get() as any;
  
  // Get 30-day performance
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const performanceStats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM affiliate_clicks WHERE clicked_at >= ?) as clicks,
      (SELECT COUNT(*) FROM affiliate_conversions WHERE converted_at >= ?) as conversions,
      (SELECT SUM(order_total) FROM affiliate_conversions WHERE converted_at >= ?) as revenue
    FROM (SELECT 1)
  `).get(thirtyDaysAgo, thirtyDaysAgo, thirtyDaysAgo) as any;
  
  // Get commission stats
  const commissionStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN commission_status = 'pending' THEN commission_amount ELSE 0 END) as pending,
      SUM(CASE WHEN commission_status = 'approved' THEN commission_amount ELSE 0 END) as approved,
      SUM(CASE WHEN commission_status = 'paid' THEN commission_amount ELSE 0 END) as paid
    FROM affiliate_conversions
  `).get() as any;
  
  // Get payout stats
  const payoutStats = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(amount) as amount
    FROM affiliate_payouts
    WHERE payout_status IN ('pending', 'processing')
  `).get() as any;
  
  // Get top affiliates (last 30 days)
  const topAffiliates = db.prepare(`
    SELECT 
      a.id as affiliate_id,
      a.affiliate_code,
      a.company_name,
      COUNT(c.id) as conversions,
      SUM(c.order_total) as revenue,
      SUM(c.commission_amount) as commission
    FROM affiliates a
    LEFT JOIN affiliate_conversions c ON c.affiliate_id = a.id AND c.converted_at >= ?
    WHERE a.status = 'active'
    GROUP BY a.id
    ORDER BY revenue DESC
    LIMIT 5
  `).all(thirtyDaysAgo) as any[];
  
  // Get recent applications
  const recentApplications = db.prepare(`
    SELECT id, user_id, website, created_at
    FROM affiliate_applications
    WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT 5
  `).all() as any[];
  
  // Get user data for recent applications
  const authDb = new Database('auth.db');
  const applicationsWithUserData = recentApplications.map(app => {
    const user = authDb.prepare('SELECT name, email FROM user WHERE id = ?')
      .get(app.user_id) as { name: string | null; email: string } | undefined;
    return {
      id: app.id,
      user_id: app.user_id,
      user_name: user?.name || 'Unknown',
      user_email: user?.email || 'Unknown',
      website: app.website,
      created_at: app.created_at
    };
  });
  authDb.close();
  
  const totalClicks = performanceStats?.clicks || 0;
  const totalConversions = performanceStats?.conversions || 0;
  
  return {
    total_affiliates: affiliateStats?.total || 0,
    active_affiliates: affiliateStats?.active || 0,
    pending_applications: pendingApps?.count || 0,
    suspended_affiliates: affiliateStats?.suspended || 0,
    total_clicks_30d: totalClicks,
    total_conversions_30d: totalConversions,
    total_revenue_30d: performanceStats?.revenue || 0,
    average_conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    total_commission_pending: commissionStats?.pending || 0,
    total_commission_approved: commissionStats?.approved || 0,
    total_commission_paid: commissionStats?.paid || 0,
    pending_payouts_count: payoutStats?.count || 0,
    pending_payouts_amount: payoutStats?.amount || 0,
    top_affiliates: topAffiliates.map(aff => ({
      affiliate_id: aff.affiliate_id,
      affiliate_code: aff.affiliate_code,
      affiliate_name: aff.company_name || aff.affiliate_code,
      conversions: aff.conversions || 0,
      revenue: aff.revenue || 0,
      commission: aff.commission || 0
    })),
    recent_applications: applicationsWithUserData
  };
}

/**
 * Approve pending commissions (run periodically)
 */
export function approvePendingCommissions(): number {
  const settings = getAffiliateSettings();
  const now = new Date().toISOString();
  
  // Get conversions that are past the hold period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.commission_hold_days);
  
  const result = db.prepare(`
    UPDATE affiliate_conversions
    SET commission_status = 'approved', approved_at = ?
    WHERE commission_status = 'pending'
    AND converted_at <= ?
  `).run(now, cutoffDate.toISOString());
  
  return result.changes;
}

// Initialize tables on first use (lazy initialization)
let tablesInitialized = false;

function ensureTablesInitialized() {
  if (!tablesInitialized) {
    try {
      initAffiliatesTable();
      tablesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize affiliate tables:', error);
      throw error;
    }
  }
}

