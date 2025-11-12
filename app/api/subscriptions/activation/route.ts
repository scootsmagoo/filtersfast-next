import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

import {
  createSubscription,
  getSubscriptionItems,
  hasActiveSubscriptionForProduct,
  logSubscriptionEvent,
} from '@/lib/db/subscriptions'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { generateSubscriptionCreatedEmail } from '@/lib/email-templates/subscription-emails'
import { logger } from '@/lib/logger'
import {
  ActivationError,
  getActivationContext,
  markActivationTokenConsumed,
} from '@/lib/subscription-activation'
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit'
import { verifyOrigin } from '@/lib/security'

interface ActivationSelection {
  orderItemId: string
  frequency: number
}

export async function POST(req: NextRequest) {
  if (!verifyOrigin(req)) {
    logger.security('Blocked subscription activation due to invalid origin', {
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
    })
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 },
    )
  }

  const identifier = getClientIdentifier(req)
  const rateLimit = await checkRateLimit(identifier, rateLimitPresets.strict)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment and try again.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Reset': rateLimit.reset.toString(),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch (error) {
    logger.warn('Failed to parse subscription activation payload', { error })
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 },
    )
  }

  const accessKey = typeof (body as any)?.accessKey === 'string'
    ? (body as any).accessKey.trim()
    : ''
  const selectionsInput = Array.isArray((body as any)?.selections)
    ? ((body as any).selections as ActivationSelection[])
    : []

  if (!accessKey) {
    return NextResponse.json(
      { error: 'Activation key is required.' },
      { status: 400 },
    )
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json(
      {
        error:
          'Please sign in before activating your Home Filter Club subscription.',
        code: 'auth-required',
      },
      { status: 401 },
    )
  }

  let context
  try {
    context = await getActivationContext(accessKey)
  } catch (error) {
    if (error instanceof ActivationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      )
    }

    logger.error('Unexpected activation context failure', { error })
    return NextResponse.json(
      { error: 'Something went wrong while validating the activation link.' },
      { status: 500 },
    )
  }

  const { order, items, tokenRecord, customerEmail, customerName, userId } =
    context

  const sessionUserId = session.user.id
  const sessionEmail = session.user.email?.toLowerCase()
  const orderEmail = customerEmail.toLowerCase()

  if (!sessionEmail || sessionEmail !== orderEmail) {
    return NextResponse.json(
      {
        error:
          'Please sign in with the same email address you used for this order before activating your subscription.',
        code: 'account-mismatch',
      },
      { status: 403 },
    )
  }

  if (userId && userId !== sessionUserId) {
    logger.warn('Activation context user mismatch resolved via session email', {
      contextUserId: userId,
      sessionUserId,
      orderId: order.id,
    })
  }

  const customerId = sessionUserId

  if (!items.length) {
    return NextResponse.json(
      {
        error:
          'This order does not include any items eligible for Home Filter Club.',
        code: 'no-items',
      },
      { status: 409 },
    )
  }

  const availableItems = new Map(items.map(item => [item.orderItemId, item]))
  const selections = selectionsInput.filter(selection =>
    typeof selection === 'object' &&
    typeof selection.orderItemId === 'string' &&
    Number.isFinite(Number(selection.frequency)),
  )

  // default to all items if no selections provided
  const effectiveSelections = selections.length
    ? selections
    : items.map(item => ({
        orderItemId: item.orderItemId,
        frequency: item.defaultFrequency,
      }))

  const created: Array<{
    subscriptionId: string
    productId: string
    productName: string
    frequency: number
  }> = []
  const skipped: Array<{
    orderItemId: string
    reason:
      | 'excluded'
      | 'duplicate'
      | 'invalid'
      | 'creation_failed'
  }> = []

  for (const selection of effectiveSelections) {
    const rawFrequency = Number(selection.frequency)
    const frequency = Math.round(rawFrequency)

    if (!Number.isInteger(frequency) || frequency < 0 || frequency > 12) {
      skipped.push({
        orderItemId: selection.orderItemId,
        reason: 'invalid',
      })
      continue
    }

    if (frequency === 0) {
      skipped.push({
        orderItemId: selection.orderItemId,
        reason: 'excluded',
      })
      continue
    }

    const item = availableItems.get(selection.orderItemId)
    if (!item) {
      skipped.push({
        orderItemId: selection.orderItemId,
        reason: 'invalid',
      })
      continue
    }

    try {
      const existing = await hasActiveSubscriptionForProduct(
        customerId,
        item.productId,
      )

      if (existing) {
        skipped.push({
          orderItemId: selection.orderItemId,
          reason: 'duplicate',
        })
        continue
      }
    } catch (error) {
      logger.error('Failed to check for existing subscription', {
        error,
        customerId: userId,
        productId: item.productId,
      })
      skipped.push({
        orderItemId: selection.orderItemId,
        reason: 'creation_failed',
      })
      continue
    }

    try {
      const subscription = await createSubscription({
        customerId,
        frequency,
        items: [
          {
            productId: item.productId,
            productName: item.productName,
            productImage: item.image || undefined,
            quantity: item.quantity,
            price: item.unitPrice,
          },
        ],
      })

      created.push({
        subscriptionId: subscription.id,
        productId: item.productId,
        productName: item.productName,
        frequency,
      })

      await logSubscriptionEvent(
        subscription.id,
        customerId,
        'activation_link',
        `Activated via start-subscription for order ${order.order_number}`,
      )

      try {
        const subscriptionItems = await getSubscriptionItems(subscription.id)
        const emailPayload = generateSubscriptionCreatedEmail(
          customerName,
          subscription,
          subscriptionItems,
        )

        await sendEmail({
          to: customerEmail,
          subject: emailPayload.subject,
          html: emailPayload.html,
        })
      } catch (emailError) {
        logger.warn('Failed to send subscription activation email', {
          email: customerEmail,
          subscriptionId: created[created.length - 1]?.subscriptionId,
          error: emailError,
        })
      }
    } catch (error) {
      logger.error('Failed to create subscription from activation', {
        error,
        customerId: userId,
        productId: item.productId,
        orderId: order.id,
      })
      skipped.push({
        orderItemId: selection.orderItemId,
        reason: 'creation_failed',
      })
    }
  }

  if (!created.length) {
    return NextResponse.json(
      {
        error:
          'No new subscriptions were created from this activation request.',
        code: skipped.length ? skipped[0].reason : 'no-action',
        skipped,
      },
      { status: 409 },
    )
  }

  if (tokenRecord && !tokenRecord.consumedAt) {
    try {
      markActivationTokenConsumed(tokenRecord.token, {
        orderId: order.id,
        subscriptionIds: created.map(entry => entry.subscriptionId),
      })
    } catch (error) {
      logger.warn('Failed to mark activation token as consumed', {
        token: tokenRecord.token,
        error,
      })
    }
  }

  return NextResponse.json({
    success: true,
    created,
    skipped,
    message:
      created.length === 1
        ? 'Your Home Filter Club subscription is ready!'
        : 'Your Home Filter Club subscriptions are ready!',
  })
}


