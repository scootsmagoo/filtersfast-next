/**
 * Server Variables API
 * Returns server environment variables for debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/utilities/server-vars
 * Get server environment variables
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    // Collect server variables from process.env and request headers
    const variables: Array<{ name: string; value: string }> = []

    // Environment variables (filter out sensitive ones or mask them)
    // Expanded list of sensitive patterns to prevent data exposure
    const sensitiveKeys = [
      'PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'AUTH', 'CREDENTIAL',
      'API_KEY', 'PRIVATE', 'ACCESS', 'SESSION', 'COOKIE',
      'DATABASE_URL', 'CONNECTION_STRING', 'DB_PASSWORD',
      'STRIPE', 'PAYPAL', 'AWS', 'GCP', 'AZURE',
      'JWT', 'OAUTH', 'CLIENT_SECRET', 'PRIVATE_KEY'
    ]
    
    Object.keys(process.env).forEach((key) => {
      const isSensitive = sensitiveKeys.some(sensitive => 
        key.toUpperCase().includes(sensitive)
      )
      
      if (isSensitive) {
        variables.push({
          name: `process.env.${key}`,
          value: '***REDACTED***',
        })
      } else {
        variables.push({
          name: `process.env.${key}`,
          value: process.env[key] || '',
        })
      }
    })

    // Request headers (some may be sensitive)
    request.headers.forEach((value, key) => {
      const isSensitive = sensitiveKeys.some(sensitive => 
        key.toUpperCase().includes(sensitive)
      )
      
      if (isSensitive) {
        variables.push({
          name: `request.headers.${key}`,
          value: '***REDACTED***',
        })
      } else {
        variables.push({
          name: `request.headers.${key}`,
          value: value,
        })
      }
    })

    // Add some Next.js specific variables
    variables.push({
      name: 'NEXT_RUNTIME',
      value: process.env.NEXT_RUNTIME || 'unknown',
    })

    variables.push({
      name: 'NODE_ENV',
      value: process.env.NODE_ENV || 'unknown',
    })

    // Sort alphabetically by name
    variables.sort((a, b) => a.name.localeCompare(b.name))

    // Limit the number of variables returned to prevent DoS
    const maxVariables = 500
    const limitedVariables = variables.slice(0, maxVariables)

    await logAdminAction({
      action: 'admin.utilities.server-vars',
      resource: 'utilities',
      details: { count: limitedVariables.length, total: variables.length },
    }, 'success', undefined, request)

    return NextResponse.json({
      variables: limitedVariables,
      count: limitedVariables.length,
      total: variables.length,
      truncated: variables.length > maxVariables,
    })
  } catch (error: any) {
    console.error('Error in server-vars route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch server variables', message: error.message },
      { status: 500 }
    )
  }
}

