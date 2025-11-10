/**
 * Email Sending Utilities
 * 
 * Centralized email send helper so features can dispatch transactional emails.
 * Currently this is a lightweight abstraction that logs emails to the console.
 * Integrate your provider (SendGrid, SES, etc.) here when ready.
 */

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  type?: string
  disposition?: 'attachment' | 'inline'
  contentId?: string
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  attachments?: EmailAttachment[]
  tags?: string[]
  meta?: Record<string, string>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email via the configured provider.
 * 
 * In development we output to the console. Swap this implementation with your
 * transactional provider when ready.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to

  // eslint-disable-next-line no-console
  console.log('📧 [Email] Sending message', {
    to: recipients,
    subject: options.subject,
    hasText: Boolean(options.text),
    hasHtml: Boolean(options.html),
    metadata: options.meta,
    tags: options.tags,
  })

  // TODO: Integrate real email provider (SendGrid, SES, etc.)
  // This stub always succeeds to keep flows unblocked in development.
  return {
    success: true,
    messageId: `mock-${Date.now()}`,
  }
}

