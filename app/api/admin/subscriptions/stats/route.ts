/**
 * Admin Subscription Statistics API
 * GET /api/admin/subscriptions/stats - Get subscription statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getSubscriptionStats } from '@/lib/db/subscriptions'
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

    // Get overall statistics
    const stats = await getSubscriptionStats()

    // Get monthly revenue (estimate based on active subscriptions)
    const revenueQuery = await db.prepare(`
      SELECT SUM(si.price * si.quantity * (1 - s.discount_percentage / 100)) as monthly_revenue,
             AVG(si.price * si.quantity * (1 - s.discount_percentage / 100)) as avg_order_value
      FROM subscriptions s
      JOIN subscription_items si ON s.id = si.subscription_id
      WHERE s.status = 'active'
    `).get()

    // Get subscriptions created this month
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const newThisMonth = await db.prepare(`
      SELECT COUNT(*) as count
      FROM subscriptions
      WHERE created_at >= ?
    `).get(thisMonth.toISOString())

    // Calculate churn rate (cancelled / total)
    const churnRate = stats.total_count > 0 
      ? (stats.cancelled_count / stats.total_count) * 100 
      : 0

    return NextResponse.json({
      stats: {
        totalSubscriptions: stats.total_count || 0,
        activeSubscriptions: stats.active_count || 0,
        pausedSubscriptions: stats.paused_count || 0,
        cancelledSubscriptions: stats.cancelled_count || 0,
        monthlyRevenue: revenueQuery?.monthly_revenue || 0,
        averageOrderValue: revenueQuery?.avg_order_value || 0,
        churnRate,
        newThisMonth: newThisMonth?.count || 0
      }
    })
  } catch (error) {
    console.error('Error fetching subscription stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription statistics' },
      { status: 500 }
    )
  }
}

