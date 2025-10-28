/**
 * Fix Better Auth Setup
 * 1. Delete old database
 * 2. Update .env.local with correct URL
 * 3. Let Better Auth create proper schema
 */

import { unlinkSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

console.log('🔧 Fixing Better Auth Setup...\n')

try {
  // Step 1: Delete old database
  const dbPath = join(process.cwd(), 'auth.db')
  if (existsSync(dbPath)) {
    unlinkSync(dbPath)
    console.log('✅ Deleted old auth.db (had wrong schema)\n')
  }

  // Step 2: Update .env.local with correct port
  const envPath = join(process.cwd(), '.env.local')
  const envContent = `# Better Auth Configuration
BETTER_AUTH_SECRET=FiltersFast-Secret-Key-For-Development-Testing-2025-Min32Chars
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=./auth.db

# Optional: Social Auth
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# FACEBOOK_CLIENT_ID=
# FACEBOOK_CLIENT_SECRET=
# APPLE_CLIENT_ID=
# APPLE_CLIENT_SECRET=
`

  writeFileSync(envPath, envContent)
  console.log('✅ Updated .env.local with correct URL (port 3000)\n')

  console.log('='.repeat(60))
  console.log('✨ Better Auth Setup Fixed!')
  console.log('='.repeat(60))
  console.log('\n🚀 Next Steps:')
  console.log('1. Restart dev server: npm run dev')
  console.log('2. Go to http://localhost:3000/sign-up')
  console.log('3. Create account:')
  console.log('   - First Name: Admin')
  console.log('   - Last Name: User')
  console.log('   - Email: falonya@gmail.com')
  console.log('   - Password: Admin123!')
  console.log('4. Sign in at /sign-in')
  console.log('5. Access /admin')
  console.log('\n💡 Better Auth will create the correct database schema automatically!')
  console.log('\n✅ Done!\n')

} catch (error: any) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}




