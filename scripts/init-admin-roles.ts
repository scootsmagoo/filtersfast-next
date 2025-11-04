/**
 * Initialize Admin Role-Based Permissions System
 * Based on legacy FiltersFast admin role system
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

console.log('🔧 Initializing Admin Role-Based Permissions System...\n')

try {
  // Create sales_codes table (for sales rep assignment)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  console.log('✅ Created sales_codes table')

  // Create admin_roles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  console.log('✅ Created admin_roles table')

  // Create admin_permissions table (master list of all permissions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      permission_group TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  console.log('✅ Created admin_permissions table')

  // Create admins table (links to better-auth user table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      role_id INTEGER NOT NULL,
      sales_code_id INTEGER,
      is_enabled INTEGER DEFAULT 1,
      require_2fa INTEGER DEFAULT 1,
      last_login_at INTEGER,
      last_password_change INTEGER,
      password_expires_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE RESTRICT,
      FOREIGN KEY (sales_code_id) REFERENCES sales_codes(id) ON DELETE SET NULL
    )
  `)
  console.log('✅ Created admins table')

  // Create admin_role_permissions table (maps permissions to roles)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      permission_level INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE,
      UNIQUE(role_id, permission_id)
    )
  `)
  console.log('✅ Created admin_role_permissions table')

  // Create admin_user_permissions table (override permissions for specific users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_user_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      permission_level INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE,
      UNIQUE(admin_id, permission_id)
    )
  `)
  console.log('✅ Created admin_user_permissions table')

  // Create password_history table (for password reuse prevention)
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    )
  `)
  console.log('✅ Created password_history table')

  // Create failed_logins table (for audit/security monitoring)
  db.exec(`
    CREATE TABLE IF NOT EXISTS failed_logins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      reason TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  console.log('✅ Created failed_logins table')

  // Create admin_audit_log table (for compliance and monitoring)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      status TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      error TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
    )
  `)
  console.log('✅ Created admin_audit_log table')

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
    CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);
    CREATE INDEX IF NOT EXISTS idx_admins_is_enabled ON admins(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role ON admin_role_permissions(role_id);
    CREATE INDEX IF NOT EXISTS idx_admin_user_permissions_admin ON admin_user_permissions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_password_history_admin ON password_history(admin_id);
    CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_logins(email);
    CREATE INDEX IF NOT EXISTS idx_failed_logins_created ON failed_logins(created_at);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at);
  `)
  console.log('✅ Created indexes')

  // Seed default roles
  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO admin_roles (name, description) 
    VALUES (?, ?)
  `)
  
  insertRole.run('Admin', 'Full system administrator with all permissions')
  insertRole.run('Manager', 'Manager with access to operations and reporting')
  insertRole.run('Support', 'Customer support representative')
  insertRole.run('Sales', 'Sales representative')
  
  console.log('✅ Seeded default roles')

  // Seed master permissions
  const insertPermission = db.prepare(`
    INSERT OR IGNORE INTO admin_permissions (name, description, permission_group, sort_order) 
    VALUES (?, ?, ?, ?)
  `)

  // Dashboard & Analytics
  insertPermission.run('Dashboard', 'View admin dashboard', 'Dashboard & Analytics', 1)
  insertPermission.run('Analytics', 'View analytics and reports', 'Dashboard & Analytics', 2)

  // User Management
  insertPermission.run('Customers', 'Manage customer accounts', 'User Management', 10)
  insertPermission.run('Admins', 'Manage admin users and roles', 'User Management', 11)

  // Orders & Sales
  insertPermission.run('Orders', 'Manage orders', 'Orders & Sales', 20)
  insertPermission.run('Refunds', 'Process refunds', 'Orders & Sales', 21)
  insertPermission.run('Returns', 'Manage returns', 'Orders & Sales', 22)

  // Products & Catalog
  insertPermission.run('Products', 'Manage products and inventory', 'Products & Catalog', 30)
  insertPermission.run('Categories', 'Manage product categories', 'Products & Catalog', 31)
  insertPermission.run('PromoCodes', 'Manage promo codes', 'Products & Catalog', 32)
  insertPermission.run('Inventory', 'Manage inventory and stock levels', 'Products & Catalog', 33)

  // Marketing
  insertPermission.run('Affiliates', 'Manage affiliate program', 'Marketing', 40)
  insertPermission.run('Referrals', 'Manage referral program', 'Marketing', 41)
  insertPermission.run('Giveaways', 'Manage giveaways', 'Marketing', 42)
  insertPermission.run('Newsletter', 'Manage newsletter', 'Marketing', 43)

  // Content & Support
  insertPermission.run('Support', 'Manage support tickets', 'Content & Support', 50)
  insertPermission.run('Reviews', 'Manage product reviews', 'Content & Support', 51)
  insertPermission.run('Translations', 'Manage translations', 'Content & Support', 52)

  // Business
  insertPermission.run('B2B', 'Manage B2B accounts', 'Business', 60)
  insertPermission.run('Partners', 'Manage partner integrations', 'Business', 61)

  // Configuration
  insertPermission.run('Shipping', 'Configure shipping settings', 'Configuration', 70)
  insertPermission.run('TaxJar', 'Configure tax settings', 'Configuration', 71)
  insertPermission.run('Payments', 'Configure payment settings', 'Configuration', 72)
  insertPermission.run('Currency', 'Manage currency settings', 'Configuration', 73)
  insertPermission.run('Settings', 'Access system settings', 'Configuration', 74)

  // Security & Compliance
  insertPermission.run('AuditLog', 'View audit logs', 'Security & Compliance', 80)
  insertPermission.run('MFA', 'View MFA settings', 'Security & Compliance', 81)

  console.log('✅ Seeded permissions')

  // Seed permission levels for default roles
  const roleMap = {
    'Admin': db.prepare('SELECT id FROM admin_roles WHERE name = ?').get('Admin') as { id: number },
    'Manager': db.prepare('SELECT id FROM admin_roles WHERE name = ?').get('Manager') as { id: number },
    'Support': db.prepare('SELECT id FROM admin_roles WHERE name = ?').get('Support') as { id: number },
    'Sales': db.prepare('SELECT id FROM admin_roles WHERE name = ?').get('Sales') as { id: number },
  }

  const permissions = db.prepare('SELECT id, name FROM admin_permissions').all() as Array<{ id: number, name: string }>
  
  const insertRolePermission = db.prepare(`
    INSERT OR IGNORE INTO admin_role_permissions (role_id, permission_id, permission_level) 
    VALUES (?, ?, ?)
  `)

  // Admin role - Full control (level 1) on everything
  permissions.forEach(perm => {
    insertRolePermission.run(roleMap.Admin.id, perm.id, 1)
  })

  // Manager role - Full control on most, read-only on sensitive areas
  permissions.forEach(perm => {
    const level = ['Admins', 'Settings', 'Payments'].includes(perm.name) ? 0 : 1
    insertRolePermission.run(roleMap.Manager.id, perm.id, level)
  })

  // Support role - Read-only on most, full control on support/customers
  permissions.forEach(perm => {
    let level = 0 // Read-only by default
    if (['Customers', 'Support', 'Orders', 'Returns', 'Reviews'].includes(perm.name)) {
      level = 2 // Restricted control
    }
    if (['Admins', 'Refunds', 'Products', 'Inventory', 'Settings', 'Payments', 'Shipping', 'TaxJar', 'Currency'].includes(perm.name)) {
      level = -1 // No access
    }
    insertRolePermission.run(roleMap.Support.id, perm.id, level)
  })

  // Sales role - Read-only on most, full control on sales-related
  permissions.forEach(perm => {
    let level = 0 // Read-only by default
    if (['Orders', 'Customers', 'B2B', 'PromoCodes'].includes(perm.name)) {
      level = 2 // Restricted control
    }
    if (['Admins', 'Inventory', 'Settings', 'Payments', 'Shipping', 'TaxJar', 'Currency', 'Translations'].includes(perm.name)) {
      level = -1 // No access
    }
    insertRolePermission.run(roleMap.Sales.id, perm.id, level)
  })

  console.log('✅ Seeded role permissions')

  // Seed some default sales codes
  const insertSalesCode = db.prepare(`
    INSERT OR IGNORE INTO sales_codes (code, name, active) 
    VALUES (?, ?, 1)
  `)
  
  insertSalesCode.run('ADMIN', 'Admin Staff')
  insertSalesCode.run('SALES01', 'Sales Team 1')
  insertSalesCode.run('SALES02', 'Sales Team 2')
  insertSalesCode.run('SUPPORT', 'Support Team')
  
  console.log('✅ Seeded sales codes')

  console.log('\n✨ Admin Role-Based Permissions System initialized successfully!\n')
  console.log('📝 Default roles created:')
  console.log('   - Admin (Full control)')
  console.log('   - Manager (Operational control)')
  console.log('   - Support (Customer service)')
  console.log('   - Sales (Sales operations)')
  console.log('\n🔐 Permission levels:')
  console.log('   -1: No access')
  console.log('    0: Read-only')
  console.log('    1: Full control')
  console.log('    2: Restricted control')
  console.log('')

} catch (error: any) {
  console.error('❌ Error:', error.message)
  process.exit(1)
} finally {
  db.close()
}

