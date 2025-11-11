/**
 * Test Email API
 * Sends a test email to verify email configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { getSystemConfig } from '@/lib/db/system-config'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/admin/utilities/test-email
 * Send a test email
 */
export async function POST(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    // Validate request body size (prevent DoS)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1000) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    const config = getSystemConfig()
    
    // Get admin email from config or use a default
    const adminEmail = config?.pEmailAdmin || process.env.ADMIN_EMAIL || 'admin@example.com'
    const companyName = config?.pCompany || 'FiltersFast'

    try {
      const subject = 'Email Test - FiltersFast'
      const plainTextBody = `Hello from ${companyName}!\n\nThis is a test email sent at ${new Date().toISOString()} to confirm that transactional email delivery is configured correctly.\n\nIf you received this message, no further action is required.`
      const htmlBody = `
        <p>Hello from <strong>${companyName}</strong>!</p>
        <p>This is a test message sent at <code>${new Date().toISOString()}</code> to verify that transactional email delivery is configured correctly.</p>
        <p>If you received this message, no further action is required.</p>
      `

      const result = await sendEmail({
        to: adminEmail,
        subject,
        html: htmlBody,
        text: plainTextBody,
        tags: ['utilities', 'email-test'],
        meta: {
          source: 'admin.utilities.test-email',
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Email provider returned a failure response')
      }

      await logAdminAction({
        action: 'admin.utilities.test-email',
        resource: 'utilities',
        details: { emailAddress: adminEmail, result: 'success' },
      }, 'success', undefined, request)

      return NextResponse.json({
        message: 'Test email sent successfully. Please check your inbox (and spam folder) to confirm delivery.',
        emailAddress: adminEmail,
      })
    } catch (emailError: any) {
      await logAdminAction({
        action: 'admin.utilities.test-email',
        resource: 'utilities',
        details: { emailAddress: adminEmail, result: 'failed', error: emailError.message },
      }, 'error', undefined, request)

      return NextResponse.json(
        {
          error: 'Failed to send test email',
          message: emailError.message || 'Unknown email error',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in test-email route:', error)
    return NextResponse.json(
      { error: 'Failed to run email test', message: error.message },
      { status: 500 }
    )
  }
}

