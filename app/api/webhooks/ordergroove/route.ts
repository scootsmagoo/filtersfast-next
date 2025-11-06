/**
 * OrderGroove Webhook Handler
 * POST /api/webhooks/ordergroove - Receive OrderGroove webhook events
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyOGWebhookSignature, processOGWebhook } from '@/lib/ordergroove'
import { logSubscriptionEvent } from '@/lib/db/subscriptions'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-ordergroove-signature') || ''

    // Verify webhook signature
    if (!verifyOGWebhookSignature(body, signature)) {
      console.error('Invalid OrderGroove webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    const { event_type, merchant_id, data } = payload

    console.log(`Received OrderGroove webhook: ${event_type}`)

    // Process the webhook event
    await processOGWebhook(event_type, data)

    // Log the webhook
    if (data.customer) {
      await logSubscriptionEvent(
        data.subscription?.id || 'webhook',
        data.customer,
        `og_webhook_${event_type}`,
        JSON.stringify(data),
        body
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully'
    })

  } catch (error) {
    console.error('Error processing OrderGroove webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}



