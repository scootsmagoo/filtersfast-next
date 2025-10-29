/**
 * Create Admin Account Script
 * Run with: npx tsx scripts/create-admin.ts
 * 
 * This script creates an admin account and adds the email to the admin list
 */

import Database from 'better-sqlite3'
import { hashSync } from 'bcryptjs'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function createAdminAccount() {
  console.log('🔧 FiltersFast Admin Account Creator\n')
  console.log('This will create an admin account and add it to the admin list.\n')

  try {
    // Get user input
    const firstName = await question('First Name: ')
    const lastName = await question('Last Name: ')
    const email = await question('Email: ')
    const password = await question('Password (min 8 chars, 1 uppercase, 1 number): ')

    if (!firstName || !lastName || !email || !password) {
      console.error('❌ All fields are required!')
      process.exit(1)
    }

    // Validate password
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters!')
      process.exit(1)
    }

    if (!/[A-Z]/.test(password)) {
      console.error('❌ Password must contain at least one uppercase letter!')
      process.exit(1)
    }

    if (!/[0-9]/.test(password)) {
      console.error('❌ Password must contain at least one number!')
      process.exit(1)
    }

    // Open database
    const db = new Database('auth.db')

    // Check if user already exists
    const existing = db.prepare('SELECT * FROM user WHERE email = ?').get(email)
    
    if (existing) {
      console.log('\n⚠️  User with this email already exists!')
      const cont = await question('Delete and recreate? (yes/no): ')
      
      if (cont.toLowerCase() !== 'yes') {
        console.log('Aborted.')
        process.exit(0)
      }

      // Delete existing user and sessions
      db.prepare('DELETE FROM session WHERE userId = ?').run((existing as any).id)
      db.prepare('DELETE FROM user WHERE id = ?').run((existing as any).id)
      console.log('✅ Deleted existing user')
    }

    // Hash password
    const hashedPassword = hashSync(password, 10)

    // Create user
    const userId = crypto.randomUUID()
    const now = Date.now()

    db.prepare(`
      INSERT INTO user (id, email, emailVerified, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email.toLowerCase(),
      1, // Set as verified
      `${firstName} ${lastName}`,
      now,
      now
    )

    console.log('✅ Created user account')

    // Create account (Better Auth requirement)
    db.prepare(`
      INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      userId,
      email.toLowerCase(),
      'credential',
      hashedPassword,
      now,
      now
    )

    console.log('✅ Set up authentication')

    db.close()

    // Instructions for adding to admin list
    console.log('\n' + '='.repeat(60))
    console.log('✨ Admin Account Created Successfully!')
    console.log('='.repeat(60))
    console.log(`\nEmail: ${email}`)
    console.log(`Name: ${firstName} ${lastName}`)
    console.log(`Email Verified: Yes`)
    console.log('\n📝 IMPORTANT: Add this email to the admin list!')
    console.log('\nOpen: lib/auth-admin.ts')
    console.log('Add this line to ADMIN_EMAILS:')
    console.log(`  '${email.toLowerCase()}',`)
    console.log('\nExample:')
    console.log('```typescript')
    console.log('const ADMIN_EMAILS = [')
    console.log('  \'admin@filtersfast.com\',')
    console.log('  \'adam@filtersfast.com\',')
    console.log(`  '${email.toLowerCase()}', // <-- Add this`)
    console.log(']')
    console.log('```')
    console.log('\nThen you can sign in at /sign-in and access /admin!')
    console.log('\n✅ Done!\n')

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

createAdminAccount()

