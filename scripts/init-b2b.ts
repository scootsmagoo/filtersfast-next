/**
 * Initialize B2B Portal Database Tables
 * Tables for wholesale/business customer management
 */

import Database from 'better-sqlite3';

const mainDb = new Database('filtersfast.db');

console.log('🏢 Initializing B2B Portal database tables...\n');

try {
  // B2B Accounts Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS b2b_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      
      -- Company Information
      company_name TEXT NOT NULL,
      business_type TEXT NOT NULL CHECK(business_type IN ('reseller', 'distributor', 'corporate', 'government', 'nonprofit')),
      tax_id TEXT,
      business_license TEXT,
      years_in_business INTEGER,
      annual_revenue TEXT,
      number_of_employees TEXT,
      website TEXT,
      
      -- Contact Information
      contact_name TEXT NOT NULL,
      contact_title TEXT,
      contact_phone TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      
      -- Billing Address (JSON)
      billing_address TEXT NOT NULL,
      
      -- Shipping Address (JSON, optional)
      shipping_address TEXT,
      
      -- Account Status
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')),
      approved_at INTEGER,
      rejected_at INTEGER,
      rejection_reason TEXT,
      suspended_at INTEGER,
      suspension_reason TEXT,
      
      -- Pricing & Terms
      pricing_tier TEXT NOT NULL DEFAULT 'standard' CHECK(pricing_tier IN ('standard', 'silver', 'gold', 'platinum', 'custom')),
      discount_percentage REAL NOT NULL DEFAULT 0,
      payment_terms TEXT NOT NULL DEFAULT 'prepay' CHECK(payment_terms IN ('net-15', 'net-30', 'net-45', 'net-60', 'prepay')),
      credit_limit REAL DEFAULT 0,
      credit_used REAL NOT NULL DEFAULT 0,
      
      -- Account Manager
      sales_rep_id TEXT,
      sales_rep_name TEXT,
      sales_rep_email TEXT,
      
      -- Business References (JSON array)
      business_references TEXT,
      
      -- Notes
      application_notes TEXT,
      internal_notes TEXT,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created b2b_accounts table');

  // Create indexes for B2B accounts
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_b2b_accounts_user_id ON b2b_accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_b2b_accounts_status ON b2b_accounts(status);
    CREATE INDEX IF NOT EXISTS idx_b2b_accounts_company_name ON b2b_accounts(company_name);
  `);
  console.log('✅ Created b2b_accounts indexes');

  // Tier Pricing Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS tier_pricing (
      id TEXT PRIMARY KEY,
      product_id INTEGER,
      sku TEXT,
      category_id TEXT,
      
      -- Tiers (JSON array of tier objects)
      tiers TEXT NOT NULL,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  console.log('✅ Created tier_pricing table');

  // Create indexes for tier pricing
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_tier_pricing_product_id ON tier_pricing(product_id);
    CREATE INDEX IF NOT EXISTS idx_tier_pricing_sku ON tier_pricing(sku);
    CREATE INDEX IF NOT EXISTS idx_tier_pricing_category_id ON tier_pricing(category_id);
  `);
  console.log('✅ Created tier_pricing indexes');

  // Quote Requests Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS quote_requests (
      id TEXT PRIMARY KEY,
      b2b_account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      
      -- Quote Details
      quote_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'quoted', 'accepted', 'declined', 'expired')),
      
      -- Items (JSON array)
      items TEXT NOT NULL,
      
      -- Quoted Items (JSON array, from sales team)
      quoted_items TEXT,
      
      -- Pricing
      subtotal REAL,
      discount REAL,
      tax REAL,
      shipping REAL,
      total REAL,
      
      -- Terms
      valid_until INTEGER,
      payment_terms TEXT,
      delivery_terms TEXT,
      
      -- Communication
      customer_message TEXT,
      sales_notes TEXT,
      admin_response TEXT,
      
      -- Timestamps
      submitted_at INTEGER,
      quoted_at INTEGER,
      accepted_at INTEGER,
      declined_at INTEGER,
      expires_at INTEGER,
      
      -- Assignment
      assigned_to TEXT,
      assigned_to_name TEXT,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      FOREIGN KEY (b2b_account_id) REFERENCES b2b_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created quote_requests table');

  // Create indexes for quote requests
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_quote_requests_b2b_account_id ON quote_requests(b2b_account_id);
    CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
    CREATE INDEX IF NOT EXISTS idx_quote_requests_quote_number ON quote_requests(quote_number);
  `);
  console.log('✅ Created quote_requests indexes');

  // B2B Orders Table (extends regular orders with B2B-specific fields)
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS b2b_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      b2b_account_id TEXT NOT NULL,
      quote_id TEXT,
      
      -- Payment Terms
      payment_terms TEXT NOT NULL,
      due_date INTEGER NOT NULL,
      paid_date INTEGER,
      
      -- Invoice
      invoice_number TEXT UNIQUE NOT NULL,
      invoice_url TEXT,
      
      -- PO Number
      po_number TEXT,
      
      -- Account Balance
      amount_due REAL NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      FOREIGN KEY (b2b_account_id) REFERENCES b2b_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (quote_id) REFERENCES quote_requests(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Created b2b_orders table');

  // Create indexes for B2B orders
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_b2b_orders_order_id ON b2b_orders(order_id);
    CREATE INDEX IF NOT EXISTS idx_b2b_orders_b2b_account_id ON b2b_orders(b2b_account_id);
    CREATE INDEX IF NOT EXISTS idx_b2b_orders_due_date ON b2b_orders(due_date);
    CREATE INDEX IF NOT EXISTS idx_b2b_orders_invoice_number ON b2b_orders(invoice_number);
  `);
  console.log('✅ Created b2b_orders indexes');

  console.log('\n✨ B2B Portal database initialized successfully!\n');
  
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  mainDb.close();
}

