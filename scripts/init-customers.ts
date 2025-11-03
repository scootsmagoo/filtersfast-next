/**
 * Initialize Customer Management System
 * Creates all necessary tables and adds sample data
 * 
 * Usage: npm run init:customers
 */

import Database from 'better-sqlite3';
import { initCustomerTables } from '../lib/db/customers';

const db = new Database(process.env.DATABASE_URL || 'filtersfast.db');

console.log('🚀 Initializing Customer Management System...\n');

try {
  // Initialize customer tables
  console.log('📊 Creating customer tables...');
  initCustomerTables();
  console.log('✅ Customer tables created\n');

  // Add sample customer data
  console.log('👥 Adding sample customers...');
  
  const sampleCustomers = [
    {
      status: 'A',
      name: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-123-4567',
      customerCompany: '',
      address: '123 Main St',
      city: 'Charlotte',
      locState: 'NC',
      locCountry: 'US',
      zip: '28202',
      futureMail: 'Y',
      remindin: 6,
      newsletter: 'Y',
      taxExempt: 'N',
      affiliate: 'N',
      signinAttempts: 0,
      guestAccount: 0,
    },
    {
      status: 'A',
      name: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '555-987-6543',
      customerCompany: 'Acme Corp',
      address: '456 Oak Ave',
      city: 'Raleigh',
      locState: 'NC',
      locCountry: 'US',
      zip: '27601',
      shippingName: 'Jane',
      shippingLastName: 'Doe',
      shippingAddress: '789 Business Park Dr',
      shippingCity: 'Durham',
      shippingLocState: 'NC',
      shippingLocCountry: 'US',
      shippingZip: '27701',
      futureMail: 'Y',
      remindin: 6,
      newsletter: 'Y',
      taxExempt: 'Y',
      taxExemptExpiration: '2025-12-31',
      affiliate: 'N',
      signinAttempts: 0,
      guestAccount: 0,
    },
    {
      status: 'A',
      name: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '555-555-5555',
      address: '789 Pine Ln',
      city: 'Asheville',
      locState: 'NC',
      locCountry: 'US',
      zip: '28801',
      futureMail: 'Y',
      remindin: 6,
      newsletter: 'N',
      taxExempt: 'N',
      affiliate: 'Y',
      commPerc: 5.0,
      signinAttempts: 0,
      guestAccount: 0,
      generalComments: '<span class="meta">System (2025-11-03):</span><br /><span class="contents">Affiliate account approved</span><hr />',
    },
    {
      status: 'A',
      name: 'Guest',
      lastName: 'User',
      email: 'guest123@example.com',
      phone: '555-111-2222',
      address: '321 Elm St',
      city: 'Greensboro',
      locState: 'NC',
      locCountry: 'US',
      zip: '27401',
      futureMail: 'N',
      remindin: 6,
      newsletter: 'N',
      taxExempt: 'N',
      affiliate: 'N',
      signinAttempts: 0,
      guestAccount: 1,
    },
    {
      status: 'I',
      name: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@example.com',
      phone: '555-333-4444',
      address: '555 Maple Dr',
      city: 'Winston-Salem',
      locState: 'NC',
      locCountry: 'US',
      zip: '27101',
      futureMail: 'N',
      remindin: 6,
      newsletter: 'N',
      taxExempt: 'N',
      affiliate: 'N',
      signinAttempts: 5,
      guestAccount: 0,
      generalComments: '<span class="meta">Admin (2025-11-02):</span><br /><span class="contents">Account locked due to suspicious activity</span><hr />',
    },
  ];

  const insertCustomerStmt = db.prepare(`
    INSERT INTO customer (
      status, name, lastName, email, phone, customerCompany,
      address, city, locState, locState2, locCountry, zip,
      shippingName, shippingLastName, shippingPhone, shippingAddress,
      shippingCity, shippingLocState, shippingLocState2, shippingLocCountry, shippingZip,
      futureMail, remindin, newsletter, paymentType,
      taxExempt, taxExemptExpiration,
      affiliate, commPerc,
      signinAttempts, guestAccount, generalComments
    ) VALUES (
      @status, @name, @lastName, @email, @phone, @customerCompany,
      @address, @city, @locState, @locState2, @locCountry, @zip,
      @shippingName, @shippingLastName, @shippingPhone, @shippingAddress,
      @shippingCity, @shippingLocState, @shippingLocState2, @shippingLocCountry, @shippingZip,
      @futureMail, @remindin, @newsletter, @paymentType,
      @taxExempt, @taxExemptExpiration,
      @affiliate, @commPerc,
      @signinAttempts, @guestAccount, @generalComments
    )
  `);

  const insertMany = db.transaction((customers) => {
    for (const customer of customers) {
      insertCustomerStmt.run({
        ...customer,
        locState2: customer.locState2 || null,
        customerCompany: customer.customerCompany || null,
        shippingName: customer.shippingName || null,
        shippingLastName: customer.shippingLastName || null,
        shippingPhone: customer.shippingPhone || null,
        shippingAddress: customer.shippingAddress || null,
        shippingCity: customer.shippingCity || null,
        shippingLocState: customer.shippingLocState || null,
        shippingLocState2: customer.shippingLocState2 || null,
        shippingLocCountry: customer.shippingLocCountry || null,
        shippingZip: customer.shippingZip || null,
        paymentType: customer.paymentType || null,
        taxExemptExpiration: customer.taxExemptExpiration || null,
        commPerc: customer.commPerc || null,
        generalComments: customer.generalComments || null,
      });
    }
  });

  insertMany(sampleCustomers);
  console.log(`✅ Added ${sampleCustomers.length} sample customers\n`);

  // Add sample email history
  console.log('📧 Adding sample email history...');
  
  const emailEvents = [
    {
      messageID: 'msg_001',
      email: 'john.smith@example.com',
      eventType: 'delivered',
      eventTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      templateName: 'Order Confirmation',
    },
    {
      messageID: 'msg_001',
      email: 'john.smith@example.com',
      eventType: 'open',
      eventTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
      templateName: 'Order Confirmation',
    },
    {
      messageID: 'msg_002',
      email: 'jane.doe@example.com',
      eventType: 'delivered',
      eventTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      templateName: 'Shipping Notification',
    },
    {
      messageID: 'msg_003',
      email: 'sarah.williams@example.com',
      eventType: 'bounce',
      eventDetail: 'Mailbox full',
      eventTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      templateName: 'Password Reset',
    },
  ];

  const insertEmailStmt = db.prepare(`
    INSERT INTO sgDeliveredEvents (messageID, email, eventType, eventDetail, eventTimestamp, templateName)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const event of emailEvents) {
    insertEmailStmt.run(
      event.messageID,
      event.email,
      event.eventType,
      event.eventDetail || null,
      event.eventTimestamp,
      event.templateName
    );
  }
  
  console.log(`✅ Added ${emailEvents.length} email events\n`);

  // Add sample payment logs
  console.log('💳 Adding sample payment logs...');
  
  const paymentLogs = [
    {
      idOrder: 1,
      logValue: 'Payment processed successfully',
      additionalData: 'Transaction ID: txn_abc123',
      isTokenized: 0,
      issueReported: 0,
    },
    {
      idOrder: 2,
      logValue: 'Tokenized payment authorized',
      additionalData: 'CID-2',
      isTokenized: 1,
      issueReported: 0,
    },
  ];

  const insertPaymentLogStmt = db.prepare(`
    INSERT INTO payment_processing_logs (idOrder, logValue, additionalData, isTokenized, issueReported)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const log of paymentLogs) {
    insertPaymentLogStmt.run(
      log.idOrder,
      log.logValue,
      log.additionalData,
      log.isTokenized,
      log.issueReported
    );
  }
  
  console.log(`✅ Added ${paymentLogs.length} payment logs\n`);

  // Verify tables were created
  console.log('🔍 Verifying customer tables...');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name IN ('customer', 'customer_models', 'sgDeliveredEvents', 'sgUndeliveredEvents', 'payment_processing_logs', 'merged_orders_tracking')
    ORDER BY name
  `).all();

  console.log('Tables created:');
  tables.forEach((table: any) => {
    console.log(`  ✅ ${table.name}`);
  });

  // Show summary
  console.log('\n📊 Summary:');
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customer').get() as { count: number };
  const activeCount = db.prepare('SELECT COUNT(*) as count FROM customer WHERE status = \'A\'').get() as { count: number };
  const guestCount = db.prepare('SELECT COUNT(*) as count FROM customer WHERE guestAccount = 1').get() as { count: number };
  
  console.log(`  Total Customers: ${customerCount.count}`);
  console.log(`  Active Customers: ${activeCount.count}`);
  console.log(`  Guest Accounts: ${guestCount.count}`);

  console.log('\n✅ Customer Management System initialized successfully!');
  console.log('\n📝 Next steps:');
  console.log('  1. Start dev server: npm run dev');
  console.log('  2. Visit: http://localhost:3000/admin/customers');
  console.log('  3. Login as admin to manage customers');

} catch (error) {
  console.error('\n❌ Error initializing customer system:', error);
  process.exit(1);
} finally {
  db.close();
}

