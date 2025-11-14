/**
 * Admin Direct Email API
 * Legacy parity for Manager/email.asp + email_exec.asp
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getDirectEmailConfig,
  DIRECT_EMAIL_PERMISSION,
  DIRECT_EMAIL_BODY_MAX_LENGTH,
  DIRECT_EMAIL_SUBJECT_MAX_LENGTH,
  isSenderAllowed,
} from '@/lib/email/direct-email'
import {
  verifyPermission,
  PERMISSION_LEVEL,
  logAdminAction,
} from '@/lib/admin-permissions'
import { validateEmail } from '@/lib/security'
import { sanitizeEmail } from '@/lib/sanitize'
import { sendEmail } from '@/lib/email'
import { sanitizeHtml } from '@/lib/sanitize-html'

interface DirectEmailRequestBody {
  from: string
  to: string
  toName?: string
  subject: string
  message: string
  sendAsHtml?: boolean
  sendCopy?: boolean
  replyTo?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function clampLength(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value
}

function normalizePlaintextMessage(value: string): string {
  return value.replace(/\r\n/g, '\n')
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim()
}

export async function GET(request: NextRequest) {
  const permissionCheck = await verifyPermission(
    DIRECT_EMAIL_PERMISSION,
    PERMISSION_LEVEL.READ_ONLY,
    request,
  )

  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error || 'Unauthorized' },
      { status: permissionCheck.user ? 403 : 401 },
    )
  }

  const config = getDirectEmailConfig()

  return NextResponse.json({
    companyName: config.companyName,
    provider: config.provider,
    emailEnabled: config.emailEnabled,
    allowedFromAddresses: config.allowedFromAddresses,
    defaultFromAddress: config.defaultFromAddress,
    subjectMaxLength: config.subjectMaxLength,
    bodyMaxLength: config.bodyMaxLength,
    defaultSendCopy: config.defaultSendCopy,
    prefillTemplate: config.prefillTemplate,
  })
}

export async function POST(request: NextRequest) {
  const permissionCheck = await verifyPermission(
    DIRECT_EMAIL_PERMISSION,
    PERMISSION_LEVEL.FULL_CONTROL,
    request,
  )

  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error || 'Unauthorized' },
      { status: permissionCheck.user ? 403 : 401 },
    )
  }

  const userEmail = permissionCheck.user?.email ?? 'admin@filtersfast.com'
  const config = getDirectEmailConfig()

  if (config.allowedFromAddresses.length === 0) {
    await logAdminAction(
      {
        action: 'admin.direct-email.blocked',
        resource: 'direct-email',
        details: {
          reason: 'No allowed sender addresses configured',
        },
      },
      'failure',
      undefined,
      request,
    )

    return NextResponse.json(
      { error: 'Direct email sender addresses are not configured.' },
      { status: 500 },
    )
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > 250_000) {
    return NextResponse.json(
      { error: 'Request payload too large' },
      { status: 413 },
    )
  }

  let body: DirectEmailRequestBody

  try {
    body = (await request.json()) as DirectEmailRequestBody
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 },
    )
  }

  const fromAddress = sanitizeEmail(body.from || '')
  const toAddress = sanitizeEmail(body.to || '')
  const toName = typeof body.toName === 'string' ? body.toName.trim().slice(0, 200) : ''
  const replyTo = body.replyTo ? sanitizeEmail(body.replyTo) : undefined
  const rawSubject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const rawMessage = typeof body.message === 'string' ? body.message : ''
  const sendAsHtml = Boolean(body.sendAsHtml)
  const sendCopy = body.sendCopy === undefined ? config.defaultSendCopy : Boolean(body.sendCopy)

  const errors: string[] = []

  if (!isSenderAllowed(fromAddress, config)) {
    errors.push('Invalid or unauthorized sender address.')
  }

  if (!validateEmail(toAddress)) {
    errors.push('Invalid recipient email address.')
  }

  if (replyTo && !validateEmail(replyTo)) {
    errors.push('Reply-to address is invalid.')
  }

  if (!rawSubject) {
    errors.push('Email subject is required.')
  }

  if (!rawMessage || rawMessage.trim().length === 0) {
    errors.push('Email message body is required.')
  }

  if (rawSubject.length > DIRECT_EMAIL_SUBJECT_MAX_LENGTH) {
    errors.push(`Subject must be ${DIRECT_EMAIL_SUBJECT_MAX_LENGTH} characters or fewer.`)
  }

  if (rawMessage.length > DIRECT_EMAIL_BODY_MAX_LENGTH) {
    errors.push(`Message body must be ${DIRECT_EMAIL_BODY_MAX_LENGTH.toLocaleString()} characters or fewer.`)
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: errors.join(' ') },
      { status: 400 },
    )
  }

  const normalizedSubject = clampLength(rawSubject, DIRECT_EMAIL_SUBJECT_MAX_LENGTH)
  const normalizedMessage = clampLength(rawMessage, DIRECT_EMAIL_BODY_MAX_LENGTH)

  let htmlBody: string
  let textBody: string

  if (sendAsHtml) {
    htmlBody = sanitizeHtml(normalizedMessage)
    textBody = htmlToPlainText(htmlBody)
  } else {
    const plain = normalizePlaintextMessage(normalizedMessage)
    textBody = plain
    htmlBody = escapeHtml(plain).replace(/\n/g, '<br />')
  }

  try {
    const sendResult = await sendEmail({
      to: toAddress,
      from: fromAddress,
      subject: normalizedSubject,
      html: htmlBody,
      text: textBody,
      replyTo,
      tags: ['admin', 'direct-email'],
      meta: {
        initiatedBy: userEmail,
        sendAsHtml: String(sendAsHtml),
        provider: config.provider,
        toName,
      },
    })

    if (!sendResult.success) {
      await logAdminAction(
        {
          action: 'admin.direct-email.failed',
          resource: 'direct-email',
          details: {
            to: toAddress,
            from: fromAddress,
            sendAsHtml,
            error: sendResult.error ?? 'Unknown error',
          },
        },
        'failure',
        sendResult.error,
        request,
      )

      return NextResponse.json(
        { error: sendResult.error || 'Failed to send email' },
        { status: 502 },
      )
    }

    if (sendCopy) {
      await sendEmail({
        to: fromAddress,
        from: fromAddress,
        subject: `[Copy] ${normalizedSubject}`,
        html: htmlBody,
        text: textBody,
        replyTo,
        tags: ['admin', 'direct-email', 'copy'],
        meta: {
          initiatedBy: userEmail,
          originalRecipient: toAddress,
          sendAsHtml: String(sendAsHtml),
          provider: config.provider,
        },
      })
    }

    await logAdminAction(
      {
        action: 'admin.direct-email.sent',
        resource: 'direct-email',
        details: {
          to: toAddress,
          from: fromAddress,
          sendAsHtml,
          sendCopy,
          provider: config.provider,
        },
      },
      'success',
      undefined,
      request,
    )

    const responsePayload: Record<string, any> = {
      success: true,
      message: 'Email sent successfully.',
      provider: config.provider,
      messageId: sendResult.messageId,
    }

    if (config.provider === 'console' || !config.emailEnabled) {
      responsePayload.notice =
        'Email provider is configured in console mode. Message was logged to the server console.'
    }

    return NextResponse.json(responsePayload)
  } catch (error: any) {
    await logAdminAction(
      {
        action: 'admin.direct-email.error',
        resource: 'direct-email',
        details: {
          to: toAddress,
          from: fromAddress,
          sendAsHtml,
          error: error?.message ?? 'Unknown error',
        },
      },
      'failure',
      error?.message,
      request,
    )

    return NextResponse.json(
      {
        error: 'Unexpected error while sending email.',
        message: error?.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}


