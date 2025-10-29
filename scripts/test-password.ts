/**
 * Test Password Hash
 */

import Database from 'better-sqlite3'
import { compareSync } from 'bcryptjs'

const db = new Database('auth.db')

const email = 'falonya@gmail.com'
const testPassword = 'Admin123!'

console.log('🔐 Testing Password Hash...\n')

try {
  const account = db.prepare(`
    SELECT a.password, u.email, u.name 
    FROM account a 
    JOIN user u ON a.userId = u.id 
    WHERE u.email = ?
  `).get(email) as any

  if (!account) {
    console.log('❌ Account not found!')
  } else {
    console.log(`✅ Found account: ${account.email} (${account.name})`)
    console.log(`Password hash exists: ${account.password ? 'Yes' : 'No'}`)
    console.log(`Hash length: ${account.password?.length || 0}`)
    
    // Test password
    const matches = compareSync(testPassword, account.password)
    console.log(`\nPassword "${testPassword}" matches: ${matches ? '✅ YES' : '❌ NO'}`)
    
    if (!matches) {
      console.log('\n💡 The password in the database doesn\'t match.')
      console.log('This might be a Better Auth configuration issue.')
    }
  }

} catch (error: any) {
  console.error('❌ Error:', error.message)
} finally {
  db.close()
}

