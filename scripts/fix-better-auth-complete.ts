/**
 * Complete Better Auth Fix
 * Run this with dev server STOPPED
 */

import { unlinkSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

console.log('🔧 Fixing Better Auth Setup...\n')

try {
  // Step 1: Delete old database
  const dbPath = join(process.cwd(), 'auth.db')
  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath)
      console.log('✅ Deleted old auth.db\n')
    } catch (error: any) {
      if (error.code === 'EBUSY') {
        console.log('⚠️  Database is locked (dev server running?)')
        console.log('   Please STOP the dev server (Ctrl+C) and run this again.\n')
        process.exit(1)
      }
      throw error
    }
  } else {
    console.log('ℹ️  No database file found (will be created fresh)\n')
  }

  // Step 2: Update .env.local
  const envPath = join(process.cwd(), '.env.local')
  const envContent = `# Better Auth Configuration
BETTER_AUTH_SECRET=FiltersFast-Secret-Key-For-Development-Testing-2025-Min32Chars
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=./auth.db
`

  writeFileSync(envPath, envContent)
  console.log('✅ Updated .env.local (port 3000)\n')

  console.log('='.repeat(70))
  console.log('✨ Better Auth Setup Complete!')
  console.log('='.repeat(70))
  console.log('\n🚀 Next Steps:')
  console.log('\n1. START DEV SERVER:')
  console.log('   npm run dev')
  console.log('\n2. GO TO SIGN-UP PAGE:')
  console.log('   http://localhost:3000/sign-up')
  console.log('\n3. CREATE YOUR ACCOUNT (Better Auth will create proper schema):')
  console.log('   First Name: Admin')
  console.log('   Last Name: User')
  console.log('   Email: falonya@gmail.com')
  console.log('   Password: Admin123!')
  console.log('\n4. SIGN IN:')
  console.log('   http://localhost:3000/sign-in')
  console.log('\n5. ACCESS ADMIN:')
  console.log('   http://localhost:3000/admin')
  console.log('\n💡 This will let Better Auth create the database with the correct schema!')
  console.log('\n✅ Done!\n')

} catch (error: any) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

