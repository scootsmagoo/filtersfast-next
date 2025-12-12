/**
 * Admin Order Notes API
 * POST /api/admin/orders/[id]/notes - Add a note to an order
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/auth-admin'
import { getOrder, addOrderNote } from '@/lib/db/orders'
import { sanitize } from '@/lib/sanitize'

// Rate limiting
const RATE_LIMIT = 50
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
    if (!checkRateLimit(`admin-order-notes-${ip}`)) {
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

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.note || !body.note_type) {
      return NextResponse.json(
        { error: 'Note and note_type are required' },
        { status: 400 }
      )
    }

    if (!['internal', 'customer'].includes(body.note_type)) {
      return NextResponse.json(
        { error: 'Invalid note_type. Must be internal or customer' },
        { status: 400 }
      )
    }

    // Validate note length
    if (body.note.trim().length < 3) {
      return NextResponse.json(
        { error: 'Note must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (body.note.length > 1000) {
      return NextResponse.json(
        { error: 'Note must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Sanitize note
    const sanitizedNote = sanitize(body.note)

    // Add note
    const note = addOrderNote(
      id,
      sanitizedNote,
      body.note_type,
      {
        id: userObj.id,
        name: userObj.name || userObj.email || 'Admin',
        email: userObj.email,
      }
    )

    return NextResponse.json({ note }, { status: 201 })

  } catch (error) {
    console.error('Error adding order note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

