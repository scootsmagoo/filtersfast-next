/**
 * Setup Environment File
 * Creates .env.local with required configuration
 */

import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const envPath = join(process.cwd(), '.env.local')

const envContent = `# Better Auth Configuration
BETTER_AUTH_SECRET=FiltersFast-Secret-Key-For-Development-Testing-2025-Min32Chars
BETTER_AUTH_URL=http://localhost:3001
DATABASE_URL=./auth.db

# Optional: Social Auth
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# FACEBOOK_CLIENT_ID=
# FACEBOOK_CLIENT_SECRET=
# APPLE_CLIENT_ID=
# APPLE_CLIENT_SECRET=
`

console.log('🔧 Setting up environment file...\n')

if (existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!')
  console.log('Backing up to .env.local.backup...\n')
  
  const backupPath = join(process.cwd(), '.env.local.backup')
  const currentContent = require('fs').readFileSync(envPath, 'utf8')
  writeFileSync(backupPath, currentContent)
}

try {
  writeFileSync(envPath, envContent)
  console.log('✅ Created .env.local file')
  console.log(`📁 Location: ${envPath}`)
  console.log('\n📝 Contents:')
  console.log(envContent)
  console.log('\n✨ Environment setup complete!')
  console.log('\n🚀 Next steps:')
  console.log('1. Restart the dev server (Ctrl+C then npm run dev)')
  console.log('2. Go to http://localhost:3001/sign-in')
  console.log('3. Sign in with: falonya@gmail.com / Admin123!')
  console.log('4. Navigate to /admin')
  console.log('\n✅ Done!\n')
} catch (error: any) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

