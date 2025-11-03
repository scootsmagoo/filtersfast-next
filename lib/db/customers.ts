/**
 * Customer Database Functions
 * Handles all customer-related database operations
 */

import Database from 'better-sqlite3';
import type {
  Customer,
  CustomerWithStats,
  CustomerSearchParams,
  CustomerUpdateData,
  CustomerEmailEvent,
  CustomerPaymentLog,
  CustomerModel,
  CustomerMergeRequest,
  CustomerMergePreview,
  CustomerListResponse,
  CustomerStats,
} from '@/lib/types/customer';

const getDb = () => {
  // Customer data is in filtersfast.db, NOT auth.db
  // Don't use DATABASE_URL which points to auth.db
  return new Database('filtersfast.db');
};

/**
 * Initialize customer tables
 */
export function initCustomerTables() {
  const db = getDb();
  
  try {
    // Main customer table (compatible with better-auth user table)
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer (
        idCust INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT DEFAULT 'A' CHECK(status IN ('A', 'I')),
        dateCreated TEXT NOT NULL DEFAULT (datetime('now')),
        
        -- Basic Information
        name TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        customerCompany TEXT,
        password TEXT, -- Encrypted password (better-auth handles this)
        
        -- Billing Address
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        locState TEXT,
        locState2 TEXT,
        locCountry TEXT NOT NULL,
        zip TEXT NOT NULL,
        
        -- Shipping Address (optional)
        shippingName TEXT,
        shippingLastName TEXT,
        shippingPhone TEXT,
        shippingAddress TEXT,
        shippingCity TEXT,
        shippingLocState TEXT,
        shippingLocState2 TEXT,
        shippingLocCountry TEXT,
        shippingZip TEXT,
        
        -- Preferences
        futureMail TEXT DEFAULT 'Y' CHECK(futureMail IN ('Y', 'N')),
        remindin INTEGER DEFAULT 6,
        newsletter TEXT DEFAULT 'Y' CHECK(newsletter IN ('Y', 'N')),
        paymentType TEXT,
        
        -- Tax
        taxExempt TEXT DEFAULT 'N' CHECK(taxExempt IN ('Y', 'N')),
        taxExemptExpiration TEXT,
        
        -- Affiliate
        affiliate TEXT DEFAULT 'N' CHECK(affiliate IN ('Y', 'N', 'A')),
        commPerc REAL,
        
        -- Security
        signinAttempts INTEGER DEFAULT 0,
        guestAccount INTEGER DEFAULT 1,
        
        -- Admin Notes
        generalComments TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_customer_email ON customer(email);
      CREATE INDEX IF NOT EXISTS idx_customer_status ON customer(status);
      CREATE INDEX IF NOT EXISTS idx_customer_dateCreated ON customer(dateCreated);
      CREATE INDEX IF NOT EXISTS idx_customer_name ON customer(name, lastName);
    `);
    
    // Customer models table (appliances)
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_models (
        idModel INTEGER PRIMARY KEY AUTOINCREMENT,
        idCust INTEGER NOT NULL,
        fridgeModelNumber TEXT NOT NULL,
        dateAdded TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (idCust) REFERENCES customer(idCust) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_customer_models_idCust ON customer_models(idCust);
    `);
    
    // Email history table (SendGrid events)
    db.exec(`
      CREATE TABLE IF NOT EXISTS sgDeliveredEvents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageID TEXT NOT NULL,
        email TEXT NOT NULL,
        eventType TEXT NOT NULL,
        eventDetail TEXT,
        eventTimestamp TEXT NOT NULL,
        templateName TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_sgDeliveredEvents_email ON sgDeliveredEvents(email);
      CREATE INDEX IF NOT EXISTS idx_sgDeliveredEvents_timestamp ON sgDeliveredEvents(eventTimestamp);
      
      CREATE TABLE IF NOT EXISTS sgUndeliveredEvents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageID TEXT NOT NULL,
        email TEXT NOT NULL,
        eventType TEXT NOT NULL,
        eventDetail TEXT,
        eventTimestamp TEXT NOT NULL,
        templateName TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_sgUndeliveredEvents_email ON sgUndeliveredEvents(email);
    `);
    
    // Payment processing logs
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_processing_logs (
        idLog INTEGER PRIMARY KEY AUTOINCREMENT,
        logTimestamp TEXT NOT NULL DEFAULT (datetime('now')),
        idOrder INTEGER,
        logValue TEXT NOT NULL,
        additionalData TEXT,
        isTokenized INTEGER DEFAULT 0,
        issueReported INTEGER DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_payment_logs_idOrder ON payment_processing_logs(idOrder);
      CREATE INDEX IF NOT EXISTS idx_payment_logs_timestamp ON payment_processing_logs(logTimestamp);
    `);
    
    // Merged orders tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS merged_orders_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idCustTo INTEGER NOT NULL,
        idCustFrom INTEGER NOT NULL,
        idOrder INTEGER NOT NULL,
        idAdmin INTEGER NOT NULL,
        mergedAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (idCustTo) REFERENCES customer(idCust),
        FOREIGN KEY (idCustFrom) REFERENCES customer(idCust)
      );
      
      CREATE INDEX IF NOT EXISTS idx_merged_orders_to ON merged_orders_tracking(idCustTo);
      CREATE INDEX IF NOT EXISTS idx_merged_orders_from ON merged_orders_tracking(idCustFrom);
    `);
    
    console.log('✅ Customer tables initialized');
  } catch (error) {
    console.error('Error initializing customer tables:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Search and list customers with pagination
 */
export function searchCustomers(params: CustomerSearchParams): CustomerListResponse {
  const db = getDb();
  
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '1=1';
    const queryParams: any[] = [];
    
    // Build where clause based on search parameters
    if (params.showPhrase && params.showField) {
      const field = params.showField;
      const phrase = params.showPhrase;
      const condition = params.showCondition || 'EQUALS';
      
      switch (field) {
        case 'idcust':
          whereClause += ' AND idCust = ?';
          queryParams.push(parseInt(phrase));
          break;
          
        case 'email':
          if (condition === 'LIKE') {
            whereClause += ' AND email LIKE ?';
            queryParams.push(`${phrase}%`);
          } else {
            whereClause += ' AND email = ?';
            queryParams.push(phrase);
          }
          break;
          
        case 'name':
          // Split name into parts for first/last name search
          const nameParts = phrase.split(' ');
          if (nameParts.length === 2) {
            if (condition === 'LIKE') {
              whereClause += ' AND name LIKE ? AND lastName LIKE ?';
              queryParams.push(`${nameParts[0]}%`, `${nameParts[1]}%`);
            } else {
              whereClause += ' AND name = ? AND lastName = ?';
              queryParams.push(nameParts[0], nameParts[1]);
            }
          } else {
            if (condition === 'LIKE') {
              whereClause += ' AND (name LIKE ? OR lastName LIKE ?)';
              queryParams.push(`${phrase}%`, `${phrase}%`);
            } else {
              whereClause += ' AND (name = ? OR lastName = ?)';
              queryParams.push(phrase, phrase);
            }
          }
          break;
          
        case 'phone':
          // Remove formatting from phone number
          const cleanPhone = phrase.replace(/[\s\-\(\)\+\.]/g, '');
          whereClause += ` AND (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,'+1',''),'+',''),' ',''),'-',''),'.',''),'(',''),')','') LIKE ? 
            OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(shippingPhone,'+1',''),'+',''),' ',''),'-',''),'.',''),'(',''),')','') LIKE ?)`;
          queryParams.push(`%${cleanPhone}%`, `%${cleanPhone}%`);
          break;
          
        case 'customerCompany':
          if (condition === 'LIKE') {
            whereClause += ' AND customerCompany LIKE ?';
            queryParams.push(`${phrase}%`);
          } else {
            whereClause += ' AND customerCompany = ?';
            queryParams.push(phrase);
          }
          break;
          
        case 'address':
          if (condition === 'LIKE') {
            whereClause += ' AND (address LIKE ? OR shippingAddress LIKE ?)';
            queryParams.push(`${phrase}%`, `${phrase}%`);
          } else {
            whereClause += ' AND (address = ? OR shippingAddress = ?)';
            queryParams.push(phrase, phrase);
          }
          
          // Add state/country filters if provided
          if (params.stateSearch) {
            const states = params.stateSearch.split('|');
            const statePlaceholders = states.map(() => '(locState = ? OR shippingLocState = ?)').join(' OR ');
            whereClause += ` AND (${statePlaceholders})`;
            states.forEach(state => {
              queryParams.push(state, state);
            });
          }
          
          if (params.countrySearch) {
            const countries = params.countrySearch.split('|');
            const countryPlaceholders = countries.map(() => '(locCountry = ? OR shippingLocCountry = ?)').join(' OR ');
            whereClause += ` AND (${countryPlaceholders})`;
            countries.forEach(country => {
              queryParams.push(country, country);
            });
          }
          break;
      }
    } else {
      // Default: show most recent accounts with names
      whereClause += " AND name != '' AND lastName != ''";
    }
    
    // Status filter
    if (params.showStatus) {
      whereClause += ' AND status = ?';
      queryParams.push(params.showStatus);
    }
    
    // Get total count
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM customer
      WHERE ${whereClause}
    `);
    const { count: totalCount } = countStmt.get(...queryParams) as { count: number };
    
    // Get customers with stats
    const customersStmt = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM orders WHERE customer_email = c.email) as orderCount,
        0 as affCount,
        (c.address || ', ' || c.city || ', ' || c.locState || ' ' || c.zip || ', ' || c.locCountry) as billingAddress,
        CASE 
          WHEN UPPER(TRIM(c.shippingAddress)) != '' AND UPPER(TRIM(c.shippingAddress)) != UPPER(TRIM(c.address))
          THEN (c.shippingAddress || ', ' || c.shippingCity || ', ' || c.shippingLocState || ' ' || c.shippingZip || ', ' || c.shippingLocCountry)
          ELSE ''
        END as shippingAddressFormatted
      FROM customer c
      WHERE ${whereClause}
      ORDER BY ${params.sortField || 'idCust'} ${params.sortOrder || 'DESC'}
      LIMIT ? OFFSET ?
    `);
    
    const customers = customersStmt.all(...queryParams, pageSize, offset) as CustomerWithStats[];
    
    // Convert SQLite integers to booleans
    const processedCustomers = customers.map(c => ({
      ...c,
      guestAccount: Boolean(c.guestAccount),
    }));
    
    return {
      customers: processedCustomers,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } finally {
    db.close();
  }
}

/**
 * Get a single customer by ID with stats
 */
export function getCustomerById(idCust: number): CustomerWithStats | null {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM orders WHERE customer_email = c.email) as orderCount,
        0 as affCount,
        (c.address || ', ' || c.city || ', ' || c.locState || ' ' || c.zip || ', ' || c.locCountry) as billingAddress,
        CASE 
          WHEN UPPER(TRIM(c.shippingAddress)) != '' AND UPPER(TRIM(c.shippingAddress)) != UPPER(TRIM(c.address))
          THEN (c.shippingAddress || ', ' || c.shippingCity || ', ' || c.shippingLocState || ' ' || c.shippingZip || ', ' || c.shippingLocCountry)
          ELSE ''
        END as shippingAddressFormatted
      FROM customer c
      WHERE c.idCust = ?
    `);
    
    const customer = stmt.get(idCust) as CustomerWithStats | undefined;
    
    if (!customer) {
      return null;
    }
    
    return {
      ...customer,
      guestAccount: Boolean(customer.guestAccount),
    };
  } finally {
    db.close();
  }
}

/**
 * Update customer information
 */
export function updateCustomer(
  idCust: number,
  data: CustomerUpdateData,
  adminName?: string
): boolean {
  const db = getDb();
  
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    // Build dynamic update query
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    
    if (data.lastName !== undefined) {
      updates.push('lastName = ?');
      values.push(data.lastName);
    }
    
    if (data.email !== undefined) {
      // Check if email already exists for another customer
      const checkStmt = db.prepare('SELECT idCust FROM customer WHERE email = ? AND idCust != ? AND status = \'A\'');
      const existing = checkStmt.get(data.email, idCust);
      if (existing) {
        throw new Error(`Email ${data.email} already exists for another customer`);
      }
      
      updates.push('email = ?');
      values.push(data.email);
      
      // Disable tokenized payments for security when email changes
      const disableWalletStmt = db.prepare('UPDATE wallet SET isEnabled = 0 WHERE idCust = ?');
      disableWalletStmt.run(idCust);
    }
    
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    
    if (data.customerCompany !== undefined) {
      updates.push('customerCompany = ?');
      values.push(data.customerCompany);
    }
    
    // Billing address fields
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    
    if (data.city !== undefined) {
      updates.push('city = ?');
      values.push(data.city);
    }
    
    if (data.locState !== undefined) {
      updates.push('locState = ?');
      values.push(data.locState);
    }
    
    if (data.locState2 !== undefined) {
      updates.push('locState2 = ?');
      values.push(data.locState2);
    }
    
    if (data.locCountry !== undefined) {
      updates.push('locCountry = ?');
      values.push(data.locCountry);
    }
    
    if (data.zip !== undefined) {
      updates.push('zip = ?');
      values.push(data.zip);
    }
    
    // Shipping address fields
    if (data.shippingName !== undefined) {
      updates.push('shippingName = ?');
      values.push(data.shippingName);
    }
    
    if (data.shippingLastName !== undefined) {
      updates.push('shippingLastName = ?');
      values.push(data.shippingLastName);
    }
    
    if (data.shippingPhone !== undefined) {
      updates.push('shippingPhone = ?');
      values.push(data.shippingPhone);
    }
    
    if (data.shippingAddress !== undefined) {
      updates.push('shippingAddress = ?');
      values.push(data.shippingAddress);
    }
    
    if (data.shippingCity !== undefined) {
      updates.push('shippingCity = ?');
      values.push(data.shippingCity);
    }
    
    if (data.shippingLocState !== undefined) {
      updates.push('shippingLocState = ?');
      values.push(data.shippingLocState);
    }
    
    if (data.shippingLocState2 !== undefined) {
      updates.push('shippingLocState2 = ?');
      values.push(data.shippingLocState2);
    }
    
    if (data.shippingLocCountry !== undefined) {
      updates.push('shippingLocCountry = ?');
      values.push(data.shippingLocCountry);
    }
    
    if (data.shippingZip !== undefined) {
      updates.push('shippingZip = ?');
      values.push(data.shippingZip);
    }
    
    // Preferences
    if (data.futureMail !== undefined) {
      updates.push('futureMail = ?');
      values.push(data.futureMail);
    }
    
    if (data.remindin !== undefined) {
      updates.push('remindin = ?');
      values.push(data.remindin);
    }
    
    if (data.newsletter !== undefined) {
      updates.push('newsletter = ?');
      values.push(data.newsletter);
    }
    
    if (data.paymentType !== undefined) {
      updates.push('paymentType = ?');
      values.push(data.paymentType);
    }
    
    // Tax
    if (data.taxExempt !== undefined) {
      updates.push('taxExempt = ?');
      values.push(data.taxExempt);
    }
    
    if (data.taxExemptExpiration !== undefined) {
      updates.push('taxExemptExpiration = ?');
      values.push(data.taxExemptExpiration || null);
    }
    
    // Affiliate
    if (data.affiliate !== undefined) {
      updates.push('affiliate = ?');
      values.push(data.affiliate);
    }
    
    if (data.commPerc !== undefined) {
      updates.push('commPerc = ?');
      values.push(data.commPerc);
    }
    
    // Admin comments (append to existing)
    if (data.generalComments !== undefined && data.generalComments.trim() !== '') {
      const timestamp = new Date().toISOString();
      const admin = adminName || 'Admin';
      const newComment = `<span class="meta">${admin} (${timestamp}):</span><br /><span class="contents">${data.generalComments}</span><hr />`;
      
      updates.push('generalComments = ? || COALESCE(generalComments, \'\')');
      values.push(newComment);
    }
    
    if (updates.length === 0) {
      return false; // Nothing to update
    }
    
    values.push(idCust);
    
    const stmt = db.prepare(`
      UPDATE customer
      SET ${updates.join(', ')}
      WHERE idCust = ?
    `);
    
    const result = stmt.run(...values);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Delete a customer (only if no orders)
 */
export function deleteCustomer(idCust: number): { success: boolean; error?: string } {
  const db = getDb();
  
  try {
    // Check if customer has orders (using email since orders table uses customer_email)
    const getEmailStmt = db.prepare('SELECT email FROM customer WHERE idCust = ?');
    const customerData = getEmailStmt.get(idCust) as { email: string } | undefined;
    
    if (!customerData) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }
    
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_email = ?');
    const { count } = checkStmt.get(customerData.email) as { count: number };
    
    if (count > 0) {
      return {
        success: false,
        error: 'Customer cannot be deleted because there are orders linked to it',
      };
    }
    
    // Delete customer
    const stmt = db.prepare('DELETE FROM customer WHERE idCust = ?');
    const result = stmt.run(idCust);
    
    return {
      success: result.changes > 0,
    };
  } finally {
    db.close();
  }
}

/**
 * Unlock customer account (reset failed login attempts)
 */
export function unlockCustomerAccount(idCust: number): boolean {
  const db = getDb();
  
  try {
    const stmt = db.prepare('UPDATE customer SET signinAttempts = 0 WHERE idCust = ?');
    const result = stmt.run(idCust);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Get customer email history
 */
export function getCustomerEmailHistory(email: string): CustomerEmailEvent[] {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        messageID,
        email,
        eventType,
        eventDetail,
        eventTimestamp,
        templateName,
        'good' as outcome
      FROM sgDeliveredEvents
      WHERE email = ? AND eventType != 'bounce'
      
      UNION
      
      SELECT 
        messageID,
        email,
        eventType,
        eventDetail,
        eventTimestamp,
        templateName,
        'bad' as outcome
      FROM sgDeliveredEvents
      WHERE email = ? AND eventType = 'bounce'
      
      UNION
      
      SELECT 
        messageID,
        email,
        eventType,
        eventDetail,
        eventTimestamp,
        templateName,
        'bad' as outcome
      FROM sgUndeliveredEvents
      WHERE email = ?
      
      ORDER BY eventTimestamp DESC
    `);
    
    return stmt.all(email, email, email) as CustomerEmailEvent[];
  } finally {
    db.close();
  }
}

/**
 * Get customer payment logs
 */
export function getCustomerPaymentLogs(idCust: number): CustomerPaymentLog[] {
  const db = getDb();
  
  try {
    // Get customer email first
    const getEmailStmt = db.prepare('SELECT email FROM customer WHERE idCust = ?');
    const customerData = getEmailStmt.get(idCust) as { email: string } | undefined;
    
    if (!customerData) {
      return [];
    }
    
    const stmt = db.prepare(`
      SELECT 
        idLog,
        logTimestamp,
        idOrder,
        logValue,
        additionalData,
        isTokenized,
        issueReported
      FROM payment_processing_logs
      WHERE idOrder IN (SELECT id FROM orders WHERE customer_email = ?)
         OR substr(additionalData, 1, ?) = ?
      ORDER BY idLog DESC
    `);
    
    const cidPrefix = `CID-${idCust}`;
    const logs = stmt.all(customerData.email, cidPrefix.length, cidPrefix) as any[];
    
    return logs.map(log => ({
      ...log,
      isTokenized: Boolean(log.isTokenized),
      issueReported: Boolean(log.issueReported),
    }));
  } finally {
    db.close();
  }
}

/**
 * Get customer's saved appliance models
 */
export function getCustomerModels(idCust: number): CustomerModel[] {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        cm.idModel,
        cm.idCust,
        cm.dateAdded,
        fm.FridgeModelNumber as fridgeModelNumber
      FROM customer_models cm
      JOIN tFridgeModelLookup fm ON cm.idModel = fm.idModel
      WHERE cm.idCust = ?
      ORDER BY cm.dateAdded DESC
    `);
    
    return stmt.all(idCust) as CustomerModel[];
  } catch (error) {
    // tFridgeModelLookup table might not exist yet
    console.warn('Could not fetch customer models:', error);
    return [];
  } finally {
    db.close();
  }
}

/**
 * Merge customer accounts
 */
export function mergeCustomerAccounts(
  request: CustomerMergeRequest,
  adminId: number
): { success: boolean; mergedCount: number; error?: string } {
  const db = getDb();
  
  try {
    let mergedCount = 0;
    
    db.exec('BEGIN TRANSACTION');
    
    const mergeField = request.mergeType === 'customer' ? 'idCust' : 'idOrder';
    
    for (const moveId of request.mergeIDs) {
      // Get customer emails first
      let sourceEmail = '';
      if (request.mergeType === 'customer') {
        const emailStmt = db.prepare('SELECT email FROM customer WHERE idCust = ?');
        const emailData = emailStmt.get(moveId) as { email: string } | undefined;
        if (!emailData) continue;
        sourceEmail = emailData.email;
      }
      
      // Get orders to be migrated
      const getOrdersStmt = db.prepare(`
        SELECT id as idOrder, customer_email
        FROM orders
        WHERE ${request.mergeType === 'customer' ? 'customer_email' : 'id'} = ?
      `);
      
      // Get target customer email
      const targetEmailStmt = db.prepare('SELECT email FROM customer WHERE idCust = ?');
      const targetData = targetEmailStmt.get(request.idCustTo) as { email: string } | undefined;
      if (!targetData) continue;
      
      const searchValue = request.mergeType === 'customer' ? sourceEmail : moveId;
      const orders = getOrdersStmt.all(searchValue) as Array<{ idOrder: number; customer_email: string }>;
      
      for (const order of orders) {
        // Get source customer ID from email
        const sourceIdStmt = db.prepare('SELECT idCust FROM customer WHERE email = ?');
        const sourceData = sourceIdStmt.get(order.customer_email) as { idCust: number } | undefined;
        const sourceIdCust = sourceData?.idCust || 0;
        
        // Log the merge
        const logStmt = db.prepare(`
          INSERT INTO merged_orders_tracking (idCustTo, idCustFrom, idOrder, idAdmin)
          VALUES (?, ?, ?, ?)
        `);
        logStmt.run(request.idCustTo, sourceIdCust, order.idOrder, adminId);
        
        // Move the order (update email to target customer's email)
        const moveStmt = db.prepare(`
          UPDATE orders
          SET customer_email = ?
          WHERE id = ?
        `);
        moveStmt.run(targetData.email, order.idOrder);
        
        mergedCount++;
        
        // Mark old account as inactive if requested
        if (request.markInactive && sourceIdCust) {
          const inactivateStmt = db.prepare(`
            UPDATE customer
            SET status = 'I'
            WHERE idCust = ? AND idCust != ?
          `);
          inactivateStmt.run(sourceIdCust, request.idCustTo);
        }
      }
    }
    
    // Ensure target account is active
    const activateStmt = db.prepare('UPDATE customer SET status = \'A\' WHERE idCust = ?');
    activateStmt.run(request.idCustTo);
    
    db.exec('COMMIT');
    
    return {
      success: true,
      mergedCount,
    };
  } catch (error) {
    db.exec('ROLLBACK');
    return {
      success: false,
      mergedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    db.close();
  }
}

/**
 * Get merge preview data
 */
export function getMergePreview(
  request: Omit<CustomerMergeRequest, 'idCustTo' | 'markInactive'>
): CustomerMergePreview[] {
  const db = getDb();
  
  try {
    const previews: CustomerMergePreview[] = [];
    
    for (const id of request.mergeIDs) {
      if (request.mergeType === 'customer') {
        const stmt = db.prepare(`
          SELECT 
            c.idCust,
            c.name,
            c.lastName,
            c.email,
            c.dateCreated,
            (SELECT COUNT(*) FROM orders WHERE customer_email = c.email) as orderCount
          FROM customer c
          WHERE c.idCust = ?
        `);
        
        const preview = stmt.get(id) as CustomerMergePreview | undefined;
        if (preview) {
          previews.push(preview);
        }
      } else {
        // Merge by order ID
        const stmt = db.prepare(`
          SELECT 
            o.id as idOrder,
            c.idCust,
            c.name,
            c.lastName,
            c.email,
            c.dateCreated
          FROM orders o
          JOIN customer c ON o.customer_email = c.email
          WHERE o.id = ?
        `);
        
        const preview = stmt.get(id) as CustomerMergePreview | undefined;
        if (preview) {
          previews.push(preview);
        }
      }
    }
    
    return previews;
  } finally {
    db.close();
  }
}

/**
 * Lookup customer IDs by email
 */
export function lookupCustomersByEmail(
  email: string,
  excludeIdCust: number,
  type: 'customer' | 'order'
): number[] {
  const db = getDb();
  
  try {
    if (type === 'customer') {
      const stmt = db.prepare(`
        SELECT idCust
        FROM customer
        WHERE email = ? AND idCust != ?
      `);
      
      const results = stmt.all(email, excludeIdCust) as Array<{ idCust: number }>;
      return results.map(r => r.idCust);
    } else {
      const stmt = db.prepare(`
        SELECT id as idOrder
        FROM orders
        WHERE customer_email = ?
      `);
      
      const results = stmt.all(email) as Array<{ idOrder: number }>;
      return results.map(r => r.idOrder);
    }
  } finally {
    db.close();
  }
}

/**
 * Get customer statistics
 */
export function getCustomerStats(): CustomerStats {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totalCustomers,
        SUM(CASE WHEN status = 'A' THEN 1 ELSE 0 END) as activeCustomers,
        SUM(CASE WHEN status = 'I' THEN 1 ELSE 0 END) as inactiveCustomers,
        SUM(CASE WHEN dateCreated >= datetime('now', '-1 month') THEN 1 ELSE 0 END) as newThisMonth,
        SUM(CASE WHEN dateCreated >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as newThisWeek,
        SUM(CASE WHEN guestAccount = 1 THEN 1 ELSE 0 END) as guestAccounts,
        SUM(CASE WHEN taxExempt = 'Y' THEN 1 ELSE 0 END) as taxExemptCount,
        SUM(CASE WHEN affiliate = 'Y' THEN 1 ELSE 0 END) as affiliateCount
      FROM customer
    `);
    
    return stmt.get() as CustomerStats;
  } finally {
    db.close();
  }
}

