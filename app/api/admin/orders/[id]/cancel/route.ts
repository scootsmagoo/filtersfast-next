/**
 * Admin Order Cancel API
 * POST /api/admin/orders/[id]/cancel - Cancel an order
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/auth-admin'
import { getOrder, updateOrder, addOrderNote, addOrderHistory } from '@/lib/db/orders'
import { sanitize } from '@/lib/sanitize'

// Rate limiting
const RATE_LIMIT = 20
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

export async function POST(
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
    if (!checkRateLimit(`admin-order-cancel-${ip}`)) {
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
    const order = getOrder(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot cancel delivered orders. Use refund instead.' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.reason || body.reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Cancellation reason must be at least 10 characters' },
        { status: 400 }
      )
    }

    if (body.reason.length > 500) {
      return NextResponse.json(
        { error: 'Cancellation reason must be less than 500 characters' },
        { status: 400 }
      )
    }

    // Sanitize reason
    const sanitizedReason = sanitize(body.reason)

    // Update order status
    const updatedOrder = updateOrder(
      id,
      {
        status: 'cancelled',
      },
      userObj.id,
      userObj.name || userObj.email
    )

    // Add cancellation note
    addOrderNote(
      id,
      `Order cancelled by admin. Reason: ${sanitizedReason}`,
      'internal',
      {
        id: userObj.id,
        name: userObj.name || userObj.email || 'Admin',
        email: userObj.email,
      }
    )

    // Add history
    addOrderHistory(id, {
      action: 'order_cancelled',
      description: `Order cancelled. Reason: ${sanitizedReason}`,
      performed_by_id: userObj.id,
      performed_by_name: userObj.name || userObj.email || 'Admin',
    })

    // Report cancellation to TaxJar asynchronously (don't block cancellation)
    // TaxJar allows deletion if in same month, otherwise should refund
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const sameMonth = orderDate.getMonth() === now.getMonth() && 
                      orderDate.getFullYear() === now.getFullYear();
    
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tax/report-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: id,
        action: sameMonth ? 'delete' : 'refund',
      }),
    }).catch(err => {
      console.error('TaxJar cancellation reporting error:', err);
      // Silently fail - order is still cancelled
    });

    // Note: In production, you would also:
    // 1. Void/refund the payment if applicable
    // 2. Send cancellation email to customer
    // 3. Update inventory

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order cancelled successfully',
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

