/**
 * Test Database Read/Write API
 * Tests database connectivity and write permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import Database from 'better-sqlite3'

/**
 * POST /api/admin/utilities/test-db
 * Test database read and write operations
 */
export async function POST(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    // Validate request body size (prevent DoS)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1000) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    const db = new Database('filtersfast.db')
    const details: string[] = []

    try {
      // Step 1: Create test table
      details.push('Step 1: Creating temporary test table...')
      db.exec(`
        CREATE TABLE IF NOT EXISTS testWriteTable (
          testcol INTEGER
        )
      `)
      details.push('✓ Test table created successfully')

      // Step 2: Write data
      details.push('Step 2: Writing test data...')
      db.exec(`
        INSERT INTO testWriteTable (testcol) VALUES (12345)
      `)
      details.push('✓ Data written successfully')

      // Step 3: Read data
      details.push('Step 3: Reading test data...')
      const result = db.prepare('SELECT testcol FROM testWriteTable WHERE testcol = ?').get(12345)
      if (!result || (result as any).testcol !== 12345) {
        throw new Error('Data read back does not match written data')
      }
      details.push('✓ Data read successfully')

      // Step 4: Delete test table
      details.push('Step 4: Cleaning up test table...')
      db.exec('DROP TABLE IF EXISTS testWriteTable')
      details.push('✓ Test table removed successfully')
      
      // Close database connection
      db.close()

      await logAdminAction({
        action: 'admin.utilities.test-db',
        resource: 'utilities',
        details: { result: 'success' },
      }, 'success', undefined, request)

      return NextResponse.json({
        message: 'Database test passed successfully. Connection and write permissions are working correctly.',
        details: details.join('\n'),
      })
    } catch (dbError: any) {
      // Try to clean up even if there was an error
      try {
        db.exec('DROP TABLE IF EXISTS testWriteTable')
      } catch {
        // Ignore cleanup errors
      } finally {
        // Close database connection
        db.close()
      }

      await logAdminAction({
        action: 'admin.utilities.test-db',
        resource: 'utilities',
        details: { result: 'failed', error: dbError.message },
      }, 'error', undefined, request)

      return NextResponse.json(
        {
          error: 'Database test failed',
          message: dbError.message || 'Unknown database error',
          details: details.length > 0 ? details.join('\n') : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in test-db route:', error)
    return NextResponse.json(
      { error: 'Failed to run database test', message: error.message },
      { status: 500 }
    )
  }
}

