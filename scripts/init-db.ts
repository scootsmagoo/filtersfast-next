/**
 * Initialize Better Auth Database Tables (v1.3.32 Schema)
 */

import Database from 'better-sqlite3'

const db = new Database('auth.db')

console.log('🔧 Initializing Better Auth database tables (v1.3.32)...\n')

try {
  // Create user table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      emailVerified INTEGER DEFAULT 0,
      name TEXT,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `)
  console.log('✅ Created user table')

  // Create account table  
  db.exec(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      expiresAt INTEGER,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      UNIQUE(userId, providerId)
    )
  `)
  console.log('✅ Created account table')

  // Create session table (v1.3.32 includes 'token' column)
  db.exec(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `)
  console.log('✅ Created session table (with token column)')

  // Create verification table
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `)
  console.log('✅ Created verification table')

  console.log('\n✨ Database initialized successfully with Better Auth v1.3.32 schema!\n')
  
} catch (error: any) {
  console.error('❌ Error:', error.message)
  process.exit(1)
} finally {
  db.close()
}

