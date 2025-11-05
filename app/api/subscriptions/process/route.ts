/**
 * Process Subscription Orders API
 * POST /api/subscriptions/process - Process all due subscriptions (cron job)
 * 
 * This endpoint should be called by a cron job daily to process subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getSubscriptionsDueForProcessing,
  getSubscriptionItems,
  markSubscriptionProcessed
} from '@/lib/db/subscriptions'
import { Subscription } from '@/lib/types/subscription'
import { sendEmail } from '@/lib/email'
import { 
  generateUpcomingOrderEmail,
  generateOrderProcessedEmail 
} from '@/lib/email-templates/subscription-emails'
import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

/**
 * Process due subscriptions
 * Should be called by cron job (e.g., daily at 6am)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify this is coming from authorized source (cron job or admin)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all subscriptions due for processing
    const dueSubscriptions = await getSubscriptionsDueForProcessing()

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const subscription of dueSubscriptions) {
      try {
        // Get subscription items
        const items = await getSubscriptionItems(subscription.id)

        if (items.length === 0) {
          console.log(`Subscription ${subscription.id} has no items, skipping`)
          continue
        }

        // Get customer details
        const customer = await db.prepare(`
          SELECT * FROM users WHERE id = ?
        `).get(subscription.customerId)

        if (!customer) {
          throw new Error(`Customer ${subscription.customerId} not found`)
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const discount = subtotal * (subscription.discountPercentage / 100)
        const total = subtotal - discount

        // Create order
        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const orderNumber = generateOrderNumber()
        const now = new Date().toISOString()

        await db.prepare(`
          INSERT INTO orders (
            id, order_number, customer_id, customer_email, customer_name,
            status, payment_status, shipping_status,
            subtotal, tax, shipping_cost, total, discount_amount,
            is_subscription_order, subscription_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'pending', 'pending', 'pending', ?, 0, 0, ?, ?, 1, ?, ?, ?)
        `).run(
          orderId,
          orderNumber,
          subscription.customerId,
          customer.email,
          customer.name,
          subtotal,
          total,
          discount,
          subscription.id,
          now,
          now
        )

        // Add order items
        for (const item of items) {
          const orderItemId = `oi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          await db.prepare(`
            INSERT INTO order_items (
              id, order_id, product_id, product_name, 
              quantity, unit_price, total_price,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            orderItemId,
            orderId,
            item.productId,
            item.productName,
            item.quantity,
            item.price,
            item.price * item.quantity,
            now
          )
        }

        // Mark subscription as processed
        await markSubscriptionProcessed(subscription.id, orderId)

        // Send order confirmation email
        const emailData = generateOrderProcessedEmail(
          customer.name,
          subscription,
          orderNumber
        )

        await sendEmail({
          to: customer.email,
          subject: emailData.subject,
          html: emailData.html
        })

        results.processed++
        console.log(`✅ Processed subscription ${subscription.id} -> Order ${orderNumber}`)

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        results.failed++
        results.errors.push(`${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} subscriptions`,
      results
    })

  } catch (error) {
    console.error('Error processing subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to process subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * Generate sequential order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `FF${timestamp}${random}`.slice(-12)
}

/**
 * Send upcoming order reminders (3 days before processing)
 * Should be called by separate cron job
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get subscriptions due in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(23, 59, 59, 999)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    tomorrow.setHours(0, 0, 0, 0)

    const subscriptions = await db.prepare(`
      SELECT * FROM subscriptions
      WHERE status = 'active'
      AND next_delivery_date >= ?
      AND next_delivery_date <= ?
    `).all(tomorrow.toISOString(), threeDaysFromNow.toISOString())

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const row of subscriptions) {
      try {
        const subscription: Subscription = {
          id: row.id,
          customerId: row.customer_id,
          status: row.status,
          frequency: row.frequency,
          nextDeliveryDate: new Date(row.next_delivery_date),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          discountPercentage: row.discount_percentage
        }

        const items = await getSubscriptionItems(subscription.id)
        const customer = await db.prepare(`
          SELECT * FROM users WHERE id = ?
        `).get(subscription.customerId)

        if (!customer) continue

        // Send reminder email
        const emailData = generateUpcomingOrderEmail(
          customer.name,
          subscription,
          items,
          3
        )

        await sendEmail({
          to: customer.email,
          subject: emailData.subject,
          html: emailData.html
        })

        results.sent++
        console.log(`📧 Sent reminder for subscription ${subscription.id}`)

      } catch (error) {
        console.error(`Error sending reminder for subscription ${row.id}:`, error)
        results.failed++
        results.errors.push(`${row.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} reminder emails`,
      results
    })

  } catch (error) {
    console.error('Error sending subscription reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}

