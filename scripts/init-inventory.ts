/**
 * Initialize Inventory Management Tables
 * Run this to create all inventory-related database tables
 */

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const db = new Database('filtersfast.db')

console.log('🔧 Initializing Inventory Management Tables...\n')

try {
  // Read the SQL schema file
  const schemaPath = path.join(process.cwd(), 'database', 'inventory-schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  // Split by semicolons and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`📄 Found ${statements.length} SQL statements to execute\n`)
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    try {
      db.exec(stmt)
      // Only log table creation statements
      if (stmt.toLowerCase().includes('create table')) {
        const match = stmt.match(/create table (?:if not exists )?(\w+)/i)
        if (match) {
          console.log(`✅ Created table: ${match[1]}`)
        }
      }
    } catch (error: any) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists')) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message)
      }
    }
  }
  
  // Verify tables were created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE 'inventory_%'
    ORDER BY name
  `).all() as Array<{ name: string }>
  
  console.log(`\n✨ Inventory Management initialized successfully!`)
  console.log(`\n📊 Created ${tables.length} inventory tables:`)
  tables.forEach(t => console.log(`   - ${t.name}`))
  
  console.log('\n📝 Next steps:')
  console.log('   1. Make sure you\'ve run: npm run tsx scripts/init-admin-roles.ts')
  console.log('   2. Restart your dev server if it\'s running')
  console.log('   3. Navigate to /admin/products to see inventory features')
  console.log('')
  
} catch (error: any) {
  console.error('❌ Error:', error.message)
  process.exit(1)
} finally {
  db.close()
}

