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
  templateId?: string
  dynamicTemplateData?: Record<string, any>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

