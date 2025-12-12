/**
 * Order Credits API
 * Endpoints for managing order credits
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderCredits,
  createOrderCredit,
  getOrderCreditStats,
  type CreateOrderCreditRequest,
} from '@/lib/db/order-credits'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize'

/**
 * GET /api/admin/order-credits
 * Get order credits with filters
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Sanitize and validate inputs
    const rawPage = searchParams.get('page')
    const rawLimit = searchParams.get('limit')
    const page = rawPage && !isNaN(parseInt(rawPage)) && parseInt(rawPage) > 0 
      ? parseInt(rawPage) 
      : 1
    const limit = rawLimit && !isNaN(parseInt(rawLimit)) && parseInt(rawLimit) > 0 && parseInt(rawLimit) <= 100
      ? parseInt(rawLimit)
      : 25
    
    const filters = {
      order_id: searchParams.get('order_id') ? sanitizeText(searchParams.get('order_id')!) : undefined,
      user_id: searchParams.get('user_id') ? sanitizeText(searchParams.get('user_id')!) : undefined,
      customer_email: searchParams.get('customer_email') ? sanitizeEmail(searchParams.get('customer_email')!) : undefined,
      status: searchParams.get('status') && ['pending', 'success', 'failed', 'cancelled'].includes(searchParams.get('status')!)
        ? searchParams.get('status')!
        : undefined,
      method: searchParams.get('method') && ['paypal', 'stripe', 'manual', 'store_credit', 'refund'].includes(searchParams.get('method')!)
        ? searchParams.get('method')!
        : undefined,
      search: searchParams.get('search') ? sanitizeText(searchParams.get('search')!) : undefined,
      page,
      limit,
    }

    const result = getOrderCredits(filters)

    await logAdminAction({
      action: 'admin.order_credits.list',
      resource: 'order_credits',
      details: { filters },
    }, 'success', undefined, request)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching order credits:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order credits' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/order-credits
 * Create a new order credit
 */
export async function POST(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      order_id,
      user_id,
      customer_email,
      customer_name,
      amount,
      currency,
      method,
      reason,
      note,
      payment_id,
    } = body

    // Validation
    if (!order_id || !customer_email || !customer_name || !amount || !method || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedOrderId = sanitizeText(order_id)
    const sanitizedCustomerEmail = sanitizeEmail(customer_email)
    const sanitizedCustomerName = sanitizeText(customer_name)
    const sanitizedReason = sanitizeText(reason)
    const sanitizedNote = note ? sanitizeText(note) : null
    const sanitizedPaymentId = payment_id ? sanitizeText(payment_id) : null
    const sanitizedUserId = user_id ? sanitizeText(user_id) : null

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1000000) {
      return NextResponse.json(
        { error: 'Amount must be between 0.01 and 1,000,000' },
        { status: 400 }
      )
    }

    // Validate method enum
    const validMethods = ['paypal', 'stripe', 'manual', 'store_credit', 'refund']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Validate currency (if provided)
    const validCurrencies = ['USD', 'CAD', 'EUR', 'GBP']
    const sanitizedCurrency = currency && validCurrencies.includes(currency.toUpperCase())
      ? currency.toUpperCase()
      : 'USD'

    const creditData: CreateOrderCreditRequest = {
      order_id: sanitizedOrderId,
      user_id: sanitizedUserId,
      customer_email: sanitizedCustomerEmail,
      customer_name: sanitizedCustomerName,
      amount: parsedAmount,
      currency: sanitizedCurrency,
      method: method as 'paypal' | 'stripe' | 'manual' | 'store_credit' | 'refund',
      reason: sanitizedReason,
      note: sanitizedNote,
      payment_id: sanitizedPaymentId,
      created_by: check.user!.id,
      created_by_name: check.user!.name || check.user!.email,
    }

    const credit = createOrderCredit(creditData)

    await logAdminAction({
      action: 'admin.order_credits.create',
      resource: 'order_credits',
      resourceId: credit.id.toString(),
      details: { order_id, amount, method, reason },
    }, 'success', undefined, request)

    return NextResponse.json({ credit }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order credit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order credit' },
      { status: 500 }
    )
  }
}

