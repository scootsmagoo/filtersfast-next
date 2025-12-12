/**
 * Admin Subscriptions API
 * GET /api/admin/subscriptions - List all subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = `
      SELECT 
        s.*,
        u.name as customer_name,
        u.email as customer_email,
        COUNT(si.id) as item_count,
        SUM(si.price * si.quantity) as total_value
      FROM subscriptions s
      JOIN users u ON s.customer_id = u.id
      LEFT JOIN subscription_items si ON s.id = si.subscription_id
    `

    const conditions: string[] = []
    const params: any[] = []

    if (status && status !== 'all') {
      conditions.push('s.status = ?')
      params.push(status)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += `
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)

    const subscriptions = await db.prepare(query).all(...params)

    return NextResponse.json({
      subscriptions: subscriptions.map(row => ({
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        status: row.status,
        frequency: row.frequency,
        itemCount: row.item_count || 0,
        totalValue: row.total_value || 0,
        nextDeliveryDate: row.next_delivery_date,
        createdAt: row.created_at
      }))
    })
  } catch (error) {
    console.error('Error fetching admin subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

