import sgMail, { type MailDataRequired } from '@sendgrid/mail'
import type { SendEmailOptions, SendEmailResult } from './types'

let apiKeyConfigured = false

function configureClient() {
  if (apiKeyConfigured) {
    return
  }

  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    throw new Error('SendGrid API key is not configured')
  }

  sgMail.setApiKey(apiKey)
  apiKeyConfigured = true
}

function normalizeAddress(value?: string | string[]) {
  if (!value) return undefined
  return Array.isArray(value) ? value : [value]
}

export async function sendWithSendGrid(options: SendEmailOptions): Promise<SendEmailResult> {
  configureClient()

  const fromAddress =
    options.from ||
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.EMAIL_DEFAULT_FROM ||
    'no-reply@filtersfast.com'

  const message: MailDataRequired = {
    to: options.to,
    from: fromAddress,
    subject: options.subject,
    html: options.html,
  }

  if (options.text) {
    message.text = options.text
  }

  const cc = normalizeAddress(options.cc)
  if (cc) {
    message.cc = cc
  }

  const bcc = normalizeAddress(options.bcc)
  if (bcc) {
    message.bcc = bcc
  }

  if (options.replyTo) {
    message.replyTo = options.replyTo
  }

  if (options.attachments?.length) {
    message.attachments = options.attachments.map(attachment => ({
      filename: attachment.filename,
      content:
        typeof attachment.content === 'string'
          ? Buffer.from(attachment.content).toString('base64')
          : attachment.content.toString('base64'),
      type: attachment.type,
      disposition: attachment.disposition,
      contentId: attachment.contentId,
    }))
  }

  if (options.tags?.length) {
    message.categories = options.tags.slice(0, 10) // SendGrid allows up to 10 categories
  }

  if (options.meta && Object.keys(options.meta).length > 0) {
    message.customArgs = options.meta
  }

  if (process.env.SENDGRID_SANDBOX_MODE === 'true') {
    message.mailSettings = {
      sandboxMode: {
        enable: true,
      },
    }
  }

  try {
    const [response] = await sgMail.send(message)
    const headers = response.headers || {}
    const messageId =
      headers['x-message-id'] ||
      headers['X-Message-Id'] ||
      headers['x-messageid'] ||
      headers['X-MessageID']

    return {
      success: true,
      messageId: Array.isArray(messageId) ? messageId[0] : messageId,
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.body?.errors?.map((err: any) => err.message).join(', ') ||
      error?.message ||
      'SendGrid email send failed'

    return {
      success: false,
      error: errorMessage,
    }
  }
}

