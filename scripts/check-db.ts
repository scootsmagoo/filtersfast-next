/**
 * Check Database Contents
 */

import Database from 'better-sqlite3'

const db = new Database('auth.db')

console.log('🔍 Checking Database Contents...\n')

try {
  // Check users
  console.log('📋 Users:')
  const users = db.prepare('SELECT id, email, name, emailVerified FROM user').all()
  if (users.length === 0) {
    console.log('  No users found\n')
  } else {
    users.forEach((user: any) => {
      console.log(`  - ${user.email} (${user.name}) [Verified: ${user.emailVerified}]`)
    })
    console.log()
  }

  // Check accounts
  console.log('🔑 Accounts:')
  const accounts = db.prepare('SELECT id, userId, accountId, providerId FROM account').all()
  if (accounts.length === 0) {
    console.log('  No accounts found\n')
  } else {
    accounts.forEach((acc: any) => {
      console.log(`  - ${acc.accountId} (Provider: ${acc.providerId})`)
    })
    console.log()
  }

  // Check sessions
  console.log('🔐 Sessions:')
  const sessions = db.prepare('SELECT id, userId FROM session').all()
  console.log(`  ${sessions.length} active session(s)\n`)

} catch (error: any) {
  console.error('❌ Error:', error.message)
} finally {
  db.close()
}




