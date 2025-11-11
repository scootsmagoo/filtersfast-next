import { sendWithSendGrid } from './sendgrid'
import type { SendEmailOptions, SendEmailResult } from './types'

export type { EmailAttachment, SendEmailOptions, SendEmailResult } from './types'

const providerOverride = process.env.EMAIL_PROVIDER?.toLowerCase()

function determineProvider(): 'sendgrid' | 'console' {
  if (providerOverride === 'sendgrid') return 'sendgrid'
  if (providerOverride === 'console') return 'console'
  return process.env.SENDGRID_API_KEY ? 'sendgrid' : 'console'
}

function logEmail(options: SendEmailOptions): SendEmailResult {
  const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to

  // eslint-disable-next-line no-console
  console.log('📧 [Email] (mock) Sending message', {
    to: recipients,
    subject: options.subject,
    hasText: Boolean(options.text),
    hasHtml: Boolean(options.html),
    metadata: options.meta,
    tags: options.tags,
  })

  return {
    success: true,
    messageId: `mock-${Date.now()}`,
  }
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const provider = determineProvider()

  if (provider === 'sendgrid') {
    const result = await sendWithSendGrid(options)

    if (result.success || providerOverride === 'sendgrid') {
      return result
    }

    // eslint-disable-next-line no-console
    console.error('SendGrid send failed, falling back to console logger:', result.error)
  }

  return logEmail(options)
}
