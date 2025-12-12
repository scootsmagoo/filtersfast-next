/**
 * Admin Order Detail API - Get, Update, Delete Order
 * GET /api/admin/orders/[id] - Get order details
 * PATCH /api/admin/orders/[id] - Update order
 * DELETE /api/admin/orders/[id] - Delete order (rarely used)
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/auth-admin'
import {
  getOrder,
  updateOrder,
  getOrderItems,
  getOrderNotes,
  getOrderHistory,
  getOrderRefunds,
} from '@/lib/db/orders'
import { sanitize } from '@/lib/sanitize'
import type { OrderDetailResponse } from '@/lib/types/order'

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

// ==================== GET - Get Order Details ====================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get headers once
    const headersList = await headers()
    
    // Get IP for rate limiting
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Rate limiting
    if (!checkRateLimit(`admin-order-${ip}`)) {
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

    // Get order
    const order = getOrder(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get related data
    const items = getOrderItems(id)
    const notes = getOrderNotes(id)
    const history = getOrderHistory(id)
    const refunds = getOrderRefunds(id)

    const response: OrderDetailResponse = {
      ...order,
      items,
      notes,
      history,
      refunds,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error getting order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==================== PATCH - Update Order ====================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get headers once
    const headersList = await headers()
    
    // Get IP for rate limiting
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Rate limiting
    if (!checkRateLimit(`admin-order-update-${ip}`)) {
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

    const userObj = session.user

    // Check if order exists
    const existingOrder = getOrder(id)
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()

    // Validate and sanitize inputs
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'on-hold', 'failed']
    const validPaymentStatuses = ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially-refunded', 'voided']
    const validShippingStatuses = ['not-shipped', 'preparing', 'shipped', 'in-transit', 'out-for-delivery', 'delivered', 'failed-delivery', 'returned']
    
    const sanitizedData: any = {}
    
    if (body.status) {
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
      }
      sanitizedData.status = body.status
    }
    if (body.payment_status) {
      if (!validPaymentStatuses.includes(body.payment_status)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
      }
      sanitizedData.payment_status = body.payment_status
    }
    if (body.shipping_status) {
      if (!validShippingStatuses.includes(body.shipping_status)) {
        return NextResponse.json({ error: 'Invalid shipping status' }, { status: 400 })
      }
      sanitizedData.shipping_status = body.shipping_status
    }
    if (body.shipping_method) sanitizedData.shipping_method = sanitize(body.shipping_method)
    if (body.tracking_number) sanitizedData.tracking_number = sanitize(body.tracking_number)
    if (body.shipped_at) sanitizedData.shipped_at = body.shipped_at
    if (body.delivered_at) sanitizedData.delivered_at = body.delivered_at
    if (body.internal_notes !== undefined) sanitizedData.internal_notes = sanitize(body.internal_notes)
    if (body.shipping_address) sanitizedData.shipping_address = body.shipping_address
    if (body.billing_address) sanitizedData.billing_address = body.billing_address

    // Update order
    const updatedOrder = updateOrder(
      id,
      sanitizedData,
      userObj.id,
      userObj.name || userObj.email
    )

    return NextResponse.json({ order: updatedOrder })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ==================== DELETE - Delete Order ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get headers once
    const headersList = await headers()
    
    // Get IP for rate limiting
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Rate limiting
    if (!checkRateLimit(`admin-order-delete-${ip}`)) {
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

    // Check if order exists
    const existingOrder = getOrder(id)
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Note: In production, you typically don't delete orders
    // Instead, cancel them and keep them for records
    return NextResponse.json(
      { error: 'Deleting orders is not supported. Use cancel instead.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

