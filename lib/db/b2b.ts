/**
 * B2B Database Operations
 * CRUD operations for B2B accounts, quotes, and pricing
 */

import Database from 'better-sqlite3';
import { 
  B2BAccount, 
  B2BAccountStatus, 
  QuoteRequest, 
  QuoteStatus, 
  TierPricing, 
  B2BOrder,
  B2BDashboardStats 
} from '@/lib/types/b2b';

const db = new Database('filtersfast.db');

// ============================================
// B2B ACCOUNTS
// ============================================

/**
 * Create a new B2B account application
 */
export function createB2BAccount(account: Omit<B2BAccount, 'id' | 'createdAt' | 'updatedAt'>): B2BAccount {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO b2b_accounts (
      id, user_id, company_name, business_type, tax_id, business_license,
      years_in_business, annual_revenue, number_of_employees, website,
      contact_name, contact_title, contact_phone, contact_email,
      billing_address, shipping_address, status, approved_at, rejected_at,
      rejection_reason, suspended_at, suspension_reason, pricing_tier,
      discount_percentage, payment_terms, credit_limit, credit_used,
      sales_rep_id, sales_rep_name, sales_rep_email, business_references,
      application_notes, internal_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    account.userId,
    account.companyName,
    account.businessType,
    account.taxId || null,
    account.businessLicense || null,
    account.yearsInBusiness || null,
    account.annualRevenue || null,
    account.numberOfEmployees || null,
    account.website || null,
    account.contactName,
    account.contactTitle || null,
    account.contactPhone,
    account.contactEmail,
    JSON.stringify(account.billingAddress),
    account.shippingAddress ? JSON.stringify(account.shippingAddress) : null,
    account.status,
    account.approvedAt || null,
    account.rejectedAt || null,
    account.rejectionReason || null,
    account.suspendedAt || null,
    account.suspensionReason || null,
    account.pricingTier,
    account.discountPercentage,
    account.paymentTerms,
    account.creditLimit || null,
    account.creditUsed,
    account.salesRepId || null,
    account.salesRepName || null,
    account.salesRepEmail || null,
    account.references ? JSON.stringify(account.references) : null,
    account.applicationNotes || null,
    account.internalNotes || null,
    now,
    now
  );
  
  return { ...account, id, createdAt: now, updatedAt: now };
}

/**
 * Get B2B account by ID
 */
export function getB2BAccountById(id: string): B2BAccount | null {
  const stmt = db.prepare('SELECT * FROM b2b_accounts WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return null;
  
  return parseB2BAccount(row);
}

/**
 * Get B2B account by user ID
 */
export function getB2BAccountByUserId(userId: string): B2BAccount | null {
  const stmt = db.prepare('SELECT * FROM b2b_accounts WHERE user_id = ?');
  const row = stmt.get(userId) as any;
  
  if (!row) return null;
  
  return parseB2BAccount(row);
}

/**
 * Get all B2B accounts (admin)
 */
export function getAllB2BAccounts(filters?: {
  status?: B2BAccountStatus;
  businessType?: string;
  limit?: number;
  offset?: number;
}): { accounts: B2BAccount[]; total: number } {
  let query = 'SELECT * FROM b2b_accounts WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  if (filters?.businessType) {
    query += ' AND business_type = ?';
    params.push(filters.businessType);
  }
  
  // Get total count
  const countStmt = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'));
  const { count: total } = countStmt.get(...params) as any;
  
  // Get paginated results
  query += ' ORDER BY created_at DESC';
  
  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  
  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];
  
  return {
    accounts: rows.map(parseB2BAccount),
    total
  };
}

/**
 * Update B2B account
 */
export function updateB2BAccount(id: string, updates: Partial<B2BAccount>): boolean {
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];
  
  // Build dynamic update query
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'id' || key === 'createdAt') return;
    
    // Convert camelCase to snake_case
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    fields.push(`${dbKey} = ?`);
    
    // Handle JSON fields
    if (['billingAddress', 'shippingAddress', 'references', 'business_references'].includes(key)) {
      values.push(value ? JSON.stringify(value) : null);
    } else {
      values.push(value ?? null);
    }
  });
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE b2b_accounts 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  const result = stmt.run(...values);
  return result.changes > 0;
}

/**
 * Approve B2B account
 */
export function approveB2BAccount(
  id: string, 
  approvalData: {
    pricingTier: string;
    discountPercentage: number;
    paymentTerms: string;
    creditLimit?: number;
    salesRepId?: string;
    salesRepName?: string;
    salesRepEmail?: string;
  }
): boolean {
  const now = Date.now();
  
  const stmt = db.prepare(`
    UPDATE b2b_accounts 
    SET status = 'approved',
        approved_at = ?,
        pricing_tier = ?,
        discount_percentage = ?,
        payment_terms = ?,
        credit_limit = ?,
        sales_rep_id = ?,
        sales_rep_name = ?,
        sales_rep_email = ?,
        updated_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(
    now,
    approvalData.pricingTier,
    approvalData.discountPercentage,
    approvalData.paymentTerms,
    approvalData.creditLimit || null,
    approvalData.salesRepId || null,
    approvalData.salesRepName || null,
    approvalData.salesRepEmail || null,
    now,
    id
  );
  
  return result.changes > 0;
}

/**
 * Reject B2B account
 */
export function rejectB2BAccount(id: string, reason: string): boolean {
  const now = Date.now();
  
  const stmt = db.prepare(`
    UPDATE b2b_accounts 
    SET status = 'rejected',
        rejected_at = ?,
        rejection_reason = ?,
        updated_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(now, reason, now, id);
  return result.changes > 0;
}

/**
 * Suspend B2B account
 */
export function suspendB2BAccount(id: string, reason: string): boolean {
  const now = Date.now();
  
  const stmt = db.prepare(`
    UPDATE b2b_accounts 
    SET status = 'suspended',
        suspended_at = ?,
        suspension_reason = ?,
        updated_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(now, reason, now, id);
  return result.changes > 0;
}

/**
 * Update credit used
 */
export function updateCreditUsed(id: string, amount: number): boolean {
  const stmt = db.prepare(`
    UPDATE b2b_accounts 
    SET credit_used = credit_used + ?,
        updated_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(amount, Date.now(), id);
  return result.changes > 0;
}

// ============================================
// TIER PRICING
// ============================================

/**
 * Create tier pricing
 */
export function createTierPricing(pricing: Omit<TierPricing, 'id' | 'createdAt' | 'updatedAt'>): TierPricing {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO tier_pricing (id, product_id, sku, category_id, tiers, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    pricing.productId || null,
    pricing.sku || null,
    pricing.categoryId || null,
    JSON.stringify(pricing.tiers),
    now,
    now
  );
  
  return { ...pricing, id, createdAt: now, updatedAt: now };
}

/**
 * Get tier pricing by product ID
 */
export function getTierPricingByProductId(productId: number): TierPricing | null {
  const stmt = db.prepare('SELECT * FROM tier_pricing WHERE product_id = ?');
  const row = stmt.get(productId) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    categoryId: row.category_id,
    tiers: JSON.parse(row.tiers),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get tier pricing by SKU
 */
export function getTierPricingBySku(sku: string): TierPricing | null {
  const stmt = db.prepare('SELECT * FROM tier_pricing WHERE sku = ?');
  const row = stmt.get(sku) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    categoryId: row.category_id,
    tiers: JSON.parse(row.tiers),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all tier pricing
 */
export function getAllTierPricing(): TierPricing[] {
  const stmt = db.prepare('SELECT * FROM tier_pricing ORDER BY created_at DESC');
  const rows = stmt.all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    categoryId: row.category_id,
    tiers: JSON.parse(row.tiers),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Update tier pricing
 */
export function updateTierPricing(id: string, tiers: TierPricing['tiers']): boolean {
  const stmt = db.prepare(`
    UPDATE tier_pricing 
    SET tiers = ?, updated_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(JSON.stringify(tiers), Date.now(), id);
  return result.changes > 0;
}

/**
 * Delete tier pricing
 */
export function deleteTierPricing(id: string): boolean {
  const stmt = db.prepare('DELETE FROM tier_pricing WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============================================
// QUOTE REQUESTS
// ============================================

/**
 * Create quote request
 */
export function createQuoteRequest(quote: Omit<QuoteRequest, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): QuoteRequest {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  // Generate quote number (Q-YYYY-####)
  const year = new Date().getFullYear();
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM quote_requests WHERE quote_number LIKE ?');
  const { count } = countStmt.get(`Q-${year}-%`) as any;
  const quoteNumber = `Q-${year}-${String(count + 1).padStart(4, '0')}`;
  
  const stmt = db.prepare(`
    INSERT INTO quote_requests (
      id, b2b_account_id, user_id, company_name, quote_number, status,
      items, quoted_items, subtotal, discount, tax, shipping, total,
      valid_until, payment_terms, delivery_terms, customer_message,
      sales_notes, admin_response, submitted_at, quoted_at, accepted_at,
      declined_at, expires_at, assigned_to, assigned_to_name,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    quote.b2bAccountId,
    quote.userId,
    quote.companyName,
    quoteNumber,
    quote.status,
    JSON.stringify(quote.items),
    quote.quotedItems ? JSON.stringify(quote.quotedItems) : null,
    quote.subtotal || null,
    quote.discount || null,
    quote.tax || null,
    quote.shipping || null,
    quote.total || null,
    quote.validUntil || null,
    quote.paymentTerms || null,
    quote.deliveryTerms || null,
    quote.customerMessage || null,
    quote.salesNotes || null,
    quote.adminResponse || null,
    quote.submittedAt || null,
    quote.quotedAt || null,
    quote.acceptedAt || null,
    quote.declinedAt || null,
    quote.expiresAt || null,
    quote.assignedTo || null,
    quote.assignedToName || null,
    now,
    now
  );
  
  return { ...quote, id, quoteNumber, createdAt: now, updatedAt: now };
}

/**
 * Get quote request by ID
 */
export function getQuoteRequestById(id: string): QuoteRequest | null {
  const stmt = db.prepare('SELECT * FROM quote_requests WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return null;
  
  return parseQuoteRequest(row);
}

/**
 * Get quotes for B2B account
 */
export function getQuotesByB2BAccountId(accountId: string): QuoteRequest[] {
  const stmt = db.prepare('SELECT * FROM quote_requests WHERE b2b_account_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(accountId) as any[];
  
  return rows.map(parseQuoteRequest);
}

/**
 * Get all quotes (admin)
 */
export function getAllQuoteRequests(filters?: {
  status?: QuoteStatus;
  limit?: number;
  offset?: number;
}): { quotes: QuoteRequest[]; total: number } {
  let query = 'SELECT * FROM quote_requests WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  // Get total count
  const countStmt = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'));
  const { count: total } = countStmt.get(...params) as any;
  
  // Get paginated results
  query += ' ORDER BY created_at DESC';
  
  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  
  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];
  
  return {
    quotes: rows.map(parseQuoteRequest),
    total
  };
}

/**
 * Update quote request
 */
export function updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): boolean {
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'id' || key === 'quoteNumber' || key === 'createdAt') return;
    
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    fields.push(`${dbKey} = ?`);
    
    if (['items', 'quotedItems'].includes(key)) {
      values.push(value ? JSON.stringify(value) : null);
    } else {
      values.push(value ?? null);
    }
  });
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE quote_requests 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  const result = stmt.run(...values);
  return result.changes > 0;
}

// ============================================
// B2B ORDERS
// ============================================

/**
 * Create B2B order
 */
export function createB2BOrder(order: Omit<B2BOrder, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): B2BOrder {
  const id = crypto.randomUUID();
  const now = Date.now();
  
  // Generate invoice number (INV-YYYY-####)
  const year = new Date().getFullYear();
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM b2b_orders WHERE invoice_number LIKE ?');
  const { count } = countStmt.get(`INV-${year}-%`) as any;
  const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  
  const stmt = db.prepare(`
    INSERT INTO b2b_orders (
      id, order_id, b2b_account_id, quote_id, payment_terms, due_date,
      paid_date, invoice_number, invoice_url, po_number, amount_due,
      amount_paid, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    order.orderId,
    order.b2bAccountId,
    order.quoteId || null,
    order.paymentTerms,
    order.dueDate,
    order.paidDate || null,
    invoiceNumber,
    order.invoiceUrl || null,
    order.poNumber || null,
    order.amountDue,
    order.amountPaid,
    now,
    now
  );
  
  return { ...order, id, invoiceNumber, createdAt: now, updatedAt: now };
}

/**
 * Get B2B orders for account
 */
export function getB2BOrdersByAccountId(accountId: string): B2BOrder[] {
  const stmt = db.prepare('SELECT * FROM b2b_orders WHERE b2b_account_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(accountId) as any[];
  
  return rows.map(parseB2BOrder);
}

/**
 * Get B2B dashboard stats
 */
export function getB2BDashboardStats(accountId: string): B2BDashboardStats | null {
  const account = getB2BAccountById(accountId);
  if (!account) return null;
  
  const orders = getB2BOrdersByAccountId(accountId);
  const quotes = getQuotesByB2BAccountId(accountId);
  
  const totalSpent = orders.reduce((sum, order) => sum + order.amountDue, 0);
  const outstandingBalance = orders.reduce((sum, order) => {
    if (order.amountPaid < order.amountDue) {
      return sum + (order.amountDue - order.amountPaid);
    }
    return sum;
  }, 0);
  
  const now = Date.now();
  const overdueAmount = orders.reduce((sum, order) => {
    if (order.amountPaid < order.amountDue && order.dueDate < now) {
      return sum + (order.amountDue - order.amountPaid);
    }
    return sum;
  }, 0);
  
  return {
    accountStatus: account.status,
    pricingTier: account.pricingTier,
    discountPercentage: account.discountPercentage,
    creditLimit: account.creditLimit || 0,
    creditUsed: account.creditUsed,
    creditAvailable: (account.creditLimit || 0) - account.creditUsed,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.amountPaid < o.amountDue).length,
    totalSpent,
    averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
    outstandingBalance,
    overdueAmount,
    activeQuotes: quotes.filter(q => q.status === 'submitted' || q.status === 'quoted').length,
    acceptedQuotes: quotes.filter(q => q.status === 'accepted').length,
    salesRep: account.salesRepName ? {
      name: account.salesRepName,
      email: account.salesRepEmail || '',
      phone: account.contactPhone,
    } : undefined,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseB2BAccount(row: any): B2BAccount {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    businessType: row.business_type,
    taxId: row.tax_id,
    businessLicense: row.business_license,
    yearsInBusiness: row.years_in_business,
    annualRevenue: row.annual_revenue,
    numberOfEmployees: row.number_of_employees,
    website: row.website,
    contactName: row.contact_name,
    contactTitle: row.contact_title,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    billingAddress: JSON.parse(row.billing_address),
    shippingAddress: row.shipping_address ? JSON.parse(row.shipping_address) : undefined,
    status: row.status,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    suspendedAt: row.suspended_at,
    suspensionReason: row.suspension_reason,
    pricingTier: row.pricing_tier,
    discountPercentage: row.discount_percentage,
    paymentTerms: row.payment_terms,
    creditLimit: row.credit_limit,
    creditUsed: row.credit_used,
    salesRepId: row.sales_rep_id,
    salesRepName: row.sales_rep_name,
    salesRepEmail: row.sales_rep_email,
    references: row.business_references ? JSON.parse(row.business_references) : undefined,
    applicationNotes: row.application_notes,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseQuoteRequest(row: any): QuoteRequest {
  return {
    id: row.id,
    b2bAccountId: row.b2b_account_id,
    userId: row.user_id,
    companyName: row.company_name,
    quoteNumber: row.quote_number,
    status: row.status,
    items: JSON.parse(row.items),
    quotedItems: row.quoted_items ? JSON.parse(row.quoted_items) : undefined,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    shipping: row.shipping,
    total: row.total,
    validUntil: row.valid_until,
    paymentTerms: row.payment_terms,
    deliveryTerms: row.delivery_terms,
    customerMessage: row.customer_message,
    salesNotes: row.sales_notes,
    adminResponse: row.admin_response,
    submittedAt: row.submitted_at,
    quotedAt: row.quoted_at,
    acceptedAt: row.accepted_at,
    declinedAt: row.declined_at,
    expiresAt: row.expires_at,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseB2BOrder(row: any): B2BOrder {
  return {
    id: row.id,
    orderId: row.order_id,
    b2bAccountId: row.b2b_account_id,
    quoteId: row.quote_id,
    paymentTerms: row.payment_terms,
    dueDate: row.due_date,
    paidDate: row.paid_date,
    invoiceNumber: row.invoice_number,
    invoiceUrl: row.invoice_url,
    poNumber: row.po_number,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

