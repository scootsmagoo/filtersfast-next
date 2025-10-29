/**
 * Delete Old Account and Create Fresh Admin via Better Auth API
 */

import Database from 'better-sqlite3'

async function resetAndCreateAdmin() {
  const email = 'falonya@gmail.com'
  const password = 'Admin123!'
  const name = 'Admin User'

  console.log('🔧 Resetting and Creating Admin Account...\n')

  try {
    // Step 1: Delete old account from database
    console.log('Step 1: Deleting old account...')
    const db = new Database('auth.db')
    
    const user = db.prepare('SELECT id FROM user WHERE email = ?').get(email) as any
    
    if (user) {
      db.prepare('DELETE FROM session WHERE userId = ?').run(user.id)
      db.prepare('DELETE FROM account WHERE userId = ?').run(user.id)
      db.prepare('DELETE FROM user WHERE id = ?').run(user.id)
      console.log('✅ Deleted old account\n')
    } else {
      console.log('ℹ️  No existing account found\n')
    }
    
    db.close()

    // Step 2: Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 3: Create new account via Better Auth API
    console.log('Step 2: Creating account via Better Auth API...')
    
    const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Account created successfully!\n')
      console.log('='.repeat(60))
      console.log('✨ Admin Account Ready!')
      console.log('='.repeat(60))
      console.log(`\n📧 Email: ${email}`)
      console.log(`🔑 Password: ${password}`)
      console.log(`👤 Name: ${name}`)
      console.log(`\n🎯 Sign in at: http://localhost:3000/sign-in`)
      console.log(`🎯 Admin access at: http://localhost:3000/admin`)
      console.log('\n✅ You can now sign in!\n')
    } else {
      console.error('❌ Error:', data)
      console.log('\n💡 Check that the dev server is running on http://localhost:3000')
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
    process.exit(1)
  }
}

resetAndCreateAdmin()




