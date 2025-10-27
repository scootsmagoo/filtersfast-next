/**
 * Create Admin Account Using Better Auth's Hashing
 */

import Database from 'better-sqlite3'
import { hash } from 'bcryptjs'

async function createAdminAccount() {
  console.log('🔧 Creating Admin Account (Better Auth Compatible)...\n')

  const firstName = 'Admin'
  const lastName = 'User'
  const email = 'falonya@gmail.com'
  const password = 'Admin123!'

  try {
    const db = new Database('auth.db')

    // Check if user already exists
    const existing = db.prepare('SELECT * FROM user WHERE email = ?').get(email)
    
    if (existing) {
      console.log('⚠️  User already exists! Deleting and recreating...\n')
      
      // Delete existing user and related data
      const userId = (existing as any).id
      db.prepare('DELETE FROM session WHERE userId = ?').run(userId)
      db.prepare('DELETE FROM account WHERE userId = ?').run(userId)
      db.prepare('DELETE FROM user WHERE id = ?').run(userId)
      console.log('✅ Deleted existing user')
    }

    // Hash password using Better Auth's method (async bcrypt)
    const hashedPassword = await hash(password, 10)
    
    console.log('✅ Generated password hash')

    // Create user
    const userId = crypto.randomUUID()
    const now = Date.now()

    db.prepare(`
      INSERT INTO user (id, email, emailVerified, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email.toLowerCase(),
      1,
      `${firstName} ${lastName}`,
      now,
      now
    )

    console.log('✅ Created user account')

    // Create account with proper password hash
    const accountId = crypto.randomUUID()
    db.prepare(`
      INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      accountId,
      userId,
      email.toLowerCase(),
      'credential',
      hashedPassword,
      now,
      now
    )

    console.log('✅ Set up authentication')

    db.close()

    console.log('\n' + '='.repeat(60))
    console.log('✨ Admin Account Created Successfully!')
    console.log('='.repeat(60))
    console.log(`\n📧 Email: ${email}`)
    console.log(`👤 Name: ${firstName} ${lastName}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`✅ Email Verified: Yes`)
    console.log(`✅ Better Auth Compatible: Yes`)
    console.log(`\n🎯 Sign in at: http://localhost:3000/sign-in`)
    console.log(`🎯 Then go to: http://localhost:3000/admin`)
    console.log('\n✅ Done!\n')

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

createAdminAccount()

