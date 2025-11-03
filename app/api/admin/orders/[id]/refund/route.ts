/**
 * Admin Order Refund API
 * POST /api/admin/orders/[id]/refund - Process a refund for an order
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/auth-admin'
import { getOrder, createRefund, updateOrder } from '@/lib/db/orders'
import { sanitize } from '@/lib/sanitize'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

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
    if (!checkRateLimit(`admin-order-refund-${ip}`)) {
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

    // Check if order is paid
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Can only refund paid orders' },
        { status: 400 }
      )
    }

    // Check if order has payment intent ID
    if (!order.payment_intent_id) {
      return NextResponse.json(
        { error: 'Order has no payment intent ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.amount || !body.reason || !body.refund_type) {
      return NextResponse.json(
        { error: 'Amount, reason, and refund_type are required' },
        { status: 400 }
      )
    }

    if (!['full', 'partial'].includes(body.refund_type)) {
      return NextResponse.json(
        { error: 'Invalid refund_type. Must be full or partial' },
        { status: 400 }
      )
    }

    // Validate refund amount
    const refundAmount = parseFloat(body.amount)
    if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > order.total) {
      return NextResponse.json(
        { error: `Invalid refund amount. Must be between $0.01 and $${order.total.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Validate refund reason length
    if (!body.reason || body.reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Refund reason must be at least 10 characters' },
        { status: 400 }
      )
    }

    if (body.reason.length > 500) {
      return NextResponse.json(
        { error: 'Refund reason must be less than 500 characters' },
        { status: 400 }
      )
    }

    // Process refund with Stripe
    try {
      const stripeRefund = await stripe.refunds.create({
        payment_intent: order.payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer', // or other valid reason
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          admin_email: userObj.email || 'unknown',
        },
      })

      // Create refund record
      const refund = createRefund(id, {
        amount: refundAmount,
        reason: sanitize(body.reason),
        refund_type: body.refund_type,
        payment_intent_id: order.payment_intent_id,
        refund_id: stripeRefund.id,
        refunded_items: body.refunded_items || [],
        processed_by: {
          id: userObj.id,
          name: userObj.name || userObj.email || 'Admin',
        },
      })

      // Update order status if full refund
      if (body.refund_type === 'full') {
        updateOrder(
          id,
          {
            status: 'refunded',
            payment_status: 'refunded',
          },
          userObj.id,
          userObj.name || userObj.email
        )
      }

      // Report refund to TaxJar asynchronously (don't block refund processing)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tax/report-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: id,
          action: 'refund',
        }),
      }).catch(err => {
        console.error('TaxJar refund reporting error:', err);
        // Silently fail - refund is still processed
      });

      return NextResponse.json({
        success: true,
        refund,
        stripe_refund: stripeRefund,
      })

    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError)
      return NextResponse.json(
        { error: `Stripe error: ${stripeError.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

