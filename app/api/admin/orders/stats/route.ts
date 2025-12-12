/**
 * Admin Order Statistics API
 * GET /api/admin/orders/stats - Get order statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/auth-admin'
import { getOrderStats } from '@/lib/db/orders'

// Rate limiting
const RATE_LIMIT = 100
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60000 })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Get headers once
    const headersList = await headers()
    
    // Get IP for rate limiting
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Rate limiting
    if (!checkRateLimit(`admin-order-stats-${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Auth check
    const session = await auth.api.getSession({ headers: headersList })
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get statistics
    const stats = getOrderStats()

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Error getting order stats:', error)
    
    // Check if it's a database table error
    if (error.message && error.message.includes('no such table')) {
      return NextResponse.json(
        { error: 'Order tables not initialized. Please run: npm run init:orders' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

