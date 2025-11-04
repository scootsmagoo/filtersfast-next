/**
 * Check and fix admin user permissions
 * This will show what permissions your admin user has
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

console.log('🔍 Checking Admin User Permissions...\n')

try {
  // Get all admins
  const admins = db.prepare(`
    SELECT 
      a.id,
      a.user_id,
      r.name as role_name,
      a.is_enabled
    FROM admins a
    LEFT JOIN admin_roles r ON a.role_id = r.id
  `).all()

  console.log('📋 Admin Users:')
  admins.forEach((admin: any) => {
    console.log(`   - User ID: ${admin.user_id}`)
    console.log(`     Role: ${admin.role_name || 'NO ROLE'}`)
    console.log(`     Enabled: ${admin.is_enabled ? 'Yes' : 'No'}`)
    console.log('')
  })

  // Check if Inventory permission exists
  const inventoryPerm = db.prepare(`
    SELECT * FROM admin_permissions WHERE name = 'Inventory'
  `).get()

  if (inventoryPerm) {
    console.log('✅ Inventory permission exists in database')
  } else {
    console.log('❌ Inventory permission NOT FOUND - need to run init-admin-roles.ts')
  }

  // Check role permissions for Inventory
  const rolePerms = db.prepare(`
    SELECT 
      r.name as role_name,
      p.name as permission_name,
      rp.permission_level
    FROM admin_role_permissions rp
    JOIN admin_roles r ON rp.role_id = r.id
    JOIN admin_permissions p ON rp.permission_id = p.id
    WHERE p.name = 'Inventory'
  `).all()

  console.log('\n📊 Roles with Inventory permission:')
  if (rolePerms.length === 0) {
    console.log('   ❌ No roles have Inventory permission assigned!')
  } else {
    rolePerms.forEach((rp: any) => {
      const levelName = rp.permission_level === -1 ? 'No Access' : 
                       rp.permission_level === 0 ? 'Read-Only' :
                       rp.permission_level === 1 ? 'Full Control' :
                       rp.permission_level === 2 ? 'Restricted' : 'Unknown'
      console.log(`   - ${rp.role_name}: ${levelName}`)
    })
  }

  console.log('\n💡 Recommended Actions:')
  if (admins.length === 0) {
    console.log('   1. Create an admin user first')
  } else if (admins.some((a: any) => !a.role_name)) {
    console.log('   1. Assign roles to admin users')
  } else if (rolePerms.length === 0) {
    console.log('   1. Re-run: npx tsx scripts/init-admin-roles.ts')
  } else {
    console.log('   ✓ Setup looks good! Make sure you are logged in as an admin.')
  }

} catch (error: any) {
  console.error('❌ Error:', error.message)
} finally {
  db.close()
}

