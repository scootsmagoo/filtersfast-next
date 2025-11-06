/**
 * Test Database Structure API
 * Validates database schema against expected structure
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import Database from 'better-sqlite3'

interface TableCheck {
  tableName: string
  exists: boolean
  fields: FieldCheck[]
  errors: string[]
}

interface FieldCheck {
  fieldName: string
  status: 'ok' | 'missing' | 'type_mismatch' | 'length_mismatch'
  message: string
}

// Define expected tables and their required fields
// Based on the actual FiltersFast-Next schema
const EXPECTED_TABLES: Record<string, string[]> = {
  mods: ['ModID', 'Titles', 'Insurance', 'Shipping', 'Discount', 'related', 'featuredcart', 'featwording', 'productshipping'],
  customer: ['idCust', 'status', 'dateCreated', 'name', 'lastName', 'email', 'password', 'address', 'city', 'locState', 'locCountry', 'zip'],
  products: ['id', 'name', 'slug', 'sku', 'description', 'price', 'status', 'inventory_quantity', 'type', 'created_at', 'updated_at'],
  orders: ['id', 'order_number', 'user_id', 'customer_email', 'status', 'payment_status', 'shipping_status', 'subtotal', 'total', 'created_at'],
  order_items: ['id', 'order_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'total_price', 'created_at'],
  product_categories: ['id', 'name', 'slug', 'parent_id', 'is_active', 'sort_order'],
  // Add more tables as needed
}

/**
 * POST /api/admin/utilities/test-db-structure
 * Test database structure
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
    const results: TableCheck[] = []
    let totalErrors = 0

    // Sanitize table and field names to prevent SQL injection
    // Only allow alphanumeric, underscore, and hyphen characters
    function sanitizeIdentifier(identifier: string): string {
      // Remove any characters that aren't alphanumeric, underscore, or hyphen
      return identifier.replace(/[^a-zA-Z0-9_-]/g, '')
    }

    try {
      // Check each expected table
      for (const [tableName, expectedFields] of Object.entries(EXPECTED_TABLES)) {
        // Sanitize table name to prevent SQL injection
        const sanitizedTableName = sanitizeIdentifier(tableName)
        if (sanitizedTableName !== tableName) {
          totalErrors++
          results.push({
            tableName,
            exists: false,
            fields: [],
            errors: [`Invalid table name: ${tableName}`],
          })
          continue
        }

        const tableCheck: TableCheck = {
          tableName: sanitizedTableName,
          exists: false,
          fields: [],
          errors: [],
        }

        try {
          // Try to query the table to see if it exists
          // Use parameterized query with table name validation
          db.prepare(`SELECT * FROM "${sanitizedTableName}" LIMIT 1`).all()
          
          // If we got here, the table exists
          tableCheck.exists = true

          // Get actual fields from the table
          // Note: SQLite doesn't have a direct way to get column info, so we'll try to describe
          // For now, we'll check if we can query each expected field
          for (const fieldName of expectedFields) {
            // Sanitize field name to prevent SQL injection
            const sanitizedFieldName = sanitizeIdentifier(fieldName)
            if (sanitizedFieldName !== fieldName) {
              totalErrors++
              tableCheck.fields.push({
                fieldName,
                status: 'missing',
                message: 'Invalid field name',
              })
              tableCheck.errors.push(`Invalid field name: ${fieldName}`)
              continue
            }

            try {
              // Try to select the field - if it doesn't exist, this will throw
              // Use quoted identifiers to prevent injection
              db.prepare(`SELECT "${sanitizedFieldName}" FROM "${sanitizedTableName}" LIMIT 1`).all()
              
              tableCheck.fields.push({
                fieldName: sanitizedFieldName,
                status: 'ok',
                message: 'Field exists',
              })
            } catch (fieldError: any) {
              totalErrors++
              tableCheck.fields.push({
                fieldName: sanitizedFieldName,
                status: 'missing',
                message: 'Field not found',
              })
              tableCheck.errors.push(`Field '${sanitizedFieldName}' is missing from table '${sanitizedTableName}'`)
            }
          }
        } catch (tableError: any) {
          // Table doesn't exist or can't be accessed
          totalErrors++
          tableCheck.exists = false
          tableCheck.errors.push(`Table '${sanitizedTableName}' not found or cannot be accessed`)
        }

        results.push(tableCheck)
      }
      
      // Close database connection
      db.close()

      await logAdminAction({
        action: 'admin.utilities.test-db-structure',
        resource: 'utilities',
        details: { 
          tablesChecked: results.length,
          errorsFound: totalErrors,
        },
      }, totalErrors === 0 ? 'success' : 'warning', undefined, request)

      return NextResponse.json({
        tables: results,
        errorCount: totalErrors,
        message: totalErrors === 0
          ? 'Database structure validation passed. All tables and fields are present.'
          : `Database structure validation found ${totalErrors} error(s).`,
      })
    } catch (dbError: any) {
      // Close database connection on error
      try {
        db.close()
      } catch {
        // Ignore close errors
      }
      
      await logAdminAction({
        action: 'admin.utilities.test-db-structure',
        resource: 'utilities',
        details: { result: 'failed', error: dbError.message },
      }, 'error', undefined, request)

      return NextResponse.json(
        {
          error: 'Database structure test failed',
          message: dbError.message || 'Unknown database error',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in test-db-structure route:', error)
    return NextResponse.json(
      { error: 'Failed to run database structure test', message: error.message },
      { status: 500 }
    )
  }
}

