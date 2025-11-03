/**
 * Admin Orders API - List and Create Orders
 * GET /api/admin/orders - List all orders with filters
 * POST /api/admin/orders - Create a new order (manual order entry)
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/auth-admin'
import { listOrders, createOrder } from '@/lib/db/orders'
import { sanitize } from '@/lib/sanitize'
import type { OrderFilters } from '@/lib/types/order'

// Rate limiting
const RATE_LIMIT = 100 // requests per minute
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

// ==================== GET - List Orders ====================

export async function GET(request: NextRequest) {
  try {
    // Get headers once
    const headersList = await headers()
    
    // Get IP for rate limiting
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Rate limiting
    if (!checkRateLimit(`admin-orders-${ip}`)) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    
    // Validate and sanitize query parameters
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100) // Clamp 1-100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0) // Min 0
    
    const filters: OrderFilters = {
      status: searchParams.get('status')?.split(',').filter(Boolean) as any,
      payment_status: searchParams.get('payment_status')?.split(',').filter(Boolean) as any,
      shipping_status: searchParams.get('shipping_status')?.split(',').filter(Boolean) as any,
      user_id: searchParams.get('user_id') || undefined,
      is_b2b: searchParams.get('is_b2b') === 'true' ? true : searchParams.get('is_b2b') === 'false' ? false : undefined,
      is_subscription: searchParams.get('is_subscription') === 'true' ? true : searchParams.get('is_subscription') === 'false' ? false : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') ? sanitize(searchParams.get('search')!) : undefined,
      limit,
      offset,
    }

    const { orders, total } = listOrders(filters)

    return NextResponse.json({
      orders,
      total,
      limit: filters.limit,
      offset: filters.offset,
      has_more: (filters.offset! + filters.limit!) < total,
    })

  } catch (error: any) {
    console.error('Error listing orders:', error)
    
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

// ==================== POST - Create Order ====================

export async function POST(request: NextRequest) {
  try {
    // Get headers once
    const headersList = await headers()
    
    // Get IP for rate limiting
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Rate limiting
    if (!checkRateLimit(`admin-orders-create-${ip}`)) {
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

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.customer_email || !body.customer_name) {
      return NextResponse.json(
        { error: 'Customer email and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.customer_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one order item is required' },
        { status: 400 }
      )
    }

    if (!body.shipping_address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      ...body,
      customer_email: sanitize(body.customer_email),
      customer_name: sanitize(body.customer_name),
      customer_notes: body.customer_notes ? sanitize(body.customer_notes) : undefined,
    }

    // Create order
    const order = createOrder(sanitizedData)

    return NextResponse.json({ order }, { status: 201 })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

