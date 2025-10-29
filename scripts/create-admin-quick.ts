/**
 * Quick Admin Account Creator (Non-Interactive)
 * Creates admin account with predefined credentials
 */

import Database from 'better-sqlite3'
import { hashSync } from 'bcryptjs'

async function createAdminAccount() {
  console.log('🔧 Creating Admin Account...\n')

  // Predefined admin credentials
  const firstName = 'Admin'
  const lastName = 'User'
  const email = 'falonya@gmail.com'
  const password = 'Admin123!' // You can change this after first login

  try {
    // Open database
    const db = new Database('auth.db')

    // Check if user already exists
    const existing = db.prepare('SELECT * FROM user WHERE email = ?').get(email)
    
    if (existing) {
      console.log('⚠️  User already exists! Deleting and recreating...\n')
      
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

    // Success message
    console.log('\n' + '='.repeat(60))
    console.log('✨ Admin Account Created Successfully!')
    console.log('='.repeat(60))
    console.log(`\n📧 Email: ${email}`)
    console.log(`👤 Name: ${firstName} ${lastName}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`✅ Email Verified: Yes`)
    console.log(`\n🎯 Sign in at: http://localhost:3000/sign-in`)
    console.log(`🎯 Then go to: http://localhost:3000/admin`)
    console.log('\n✅ Done!\n')

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    if (error.message.includes('no such table')) {
      console.error('\n💡 The database tables might not exist yet.')
      console.error('Try starting the dev server first: npm run dev')
      console.error('Then run this script again.')
    }
    process.exit(1)
  }
}

createAdminAccount()

