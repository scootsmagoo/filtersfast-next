import {
  claimRecipientsForSending,
  getCampaignsReadyToSend,
  getCampaignSummary,
  markRecipientFailed,
  markRecipientSent,
  recordCampaignEvent,
  setCampaignLastError,
  updateCampaignStatus,
  getEmailCampaignById,
} from '../db/email-campaigns'
import type { EmailCampaign, EmailCampaignRecipient } from '../types/email-campaign'
import { sendEmail } from '../email'
import type { SendEmailOptions } from '../email'
import { enqueueBackgroundJob } from '../background-jobs'

const DEFAULT_BATCH_SIZE = parseInt(process.env.EMAIL_CAMPAIGN_BATCH_SIZE || '100', 10)
const DEFAULT_MAX_CAMPAIGNS = parseInt(process.env.EMAIL_CAMPAIGN_MAX_PARALLEL || '3', 10)

interface ProcessEmailCampaignOptions {
  campaignIds?: number[]
  batchSize?: number
  maxCampaigns?: number
  log?: boolean
}

interface ProcessEmailCampaignResult {
  processedCampaigns: number
  processedRecipients: number
  failedRecipients: number
  errors: Array<{ campaignId: number; error: string }>
}

function formatFromAddress(campaign: EmailCampaign): string {
  const name = (campaign.from_name || '').trim()
  if (!name) {
    return campaign.from_email
  }
  return `${name} <${campaign.from_email}>`
}

function buildRecipientTemplateData(recipient: EmailCampaignRecipient) {
  const metadata = recipient.metadata || {}
  return {
    firstName: recipient.first_name || '',
    lastName: recipient.last_name || '',
    email: recipient.email,
    ...metadata,
  }
}

function renderTemplateString(
  template: string | null,
  data: Record<string, any>
): string | null {
  if (!template) return null
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => {
    const value = data[key]
    if (value === undefined || value === null) {
      return ''
    }
    return String(value)
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function textToHtml(text: string): string {
  const escaped = escapeHtml(text)
  return `<p>${escaped.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br />')}</p>`
}

function renderRecipientContent(
  campaign: EmailCampaign,
  recipient: EmailCampaignRecipient
): { html: string; text: string | undefined; subject: string } {
  const data = buildRecipientTemplateData(recipient)
  const renderedSubject = renderTemplateString(campaign.subject, data) || campaign.subject
  const renderedHtml = renderTemplateString(campaign.content_html, data)
  const renderedText = renderTemplateString(campaign.content_text, data) || undefined

  let finalHtml = renderedHtml
  if (!finalHtml) {
    if (renderedText) {
      finalHtml = textToHtml(renderedText)
    } else {
      finalHtml = `<p>${escapeHtml(renderedSubject)}</p>`
    }
  }

  return {
    html: finalHtml,
    text: renderedText,
    subject: renderedSubject,
  }
}

async function sendToRecipient(
  campaign: EmailCampaign,
  recipient: EmailCampaignRecipient
): Promise<{ success: boolean; error?: string }> {
  const data = buildRecipientTemplateData(recipient)
  const { html, text, subject } = renderRecipientContent(campaign, recipient)

  const testRecipient = campaign.test_mode
    ? process.env.EMAIL_CAMPAIGN_TEST_RECIPIENT || campaign.from_email
    : null

  const emailOptions: SendEmailOptions = {
    to: testRecipient ? testRecipient : recipient.email,
    subject,
    html,
    text,
    from: formatFromAddress(campaign),
    replyTo: campaign.reply_to_email || undefined,
    tags: ['email-campaign', `campaign-${campaign.id}`],
    meta: {
      campaignId: String(campaign.id),
      campaignName: campaign.name,
      recipientId: String(recipient.id),
      recipientEmail: recipient.email,
      ...(testRecipient ? { testOverride: 'true' } : {}),
    },
  }

  if (campaign.template_id) {
    emailOptions.templateId = campaign.template_id
    emailOptions.dynamicTemplateData = data
  }

  const result = await sendEmail(emailOptions)
  return result.success
    ? { success: true }
    : { success: false, error: result.error || 'Unknown send failure' }
}

async function processCampaign(
  campaign: EmailCampaign,
  options: ProcessEmailCampaignOptions,
  result: ProcessEmailCampaignResult
) {
  if (campaign.status === 'paused' || campaign.status === 'cancelled') {
    if (options.log) {
      console.log(`⏭️  Skipping campaign ${campaign.id} (${campaign.status})`)
    }
    return
  }

  if (
    campaign.status === 'scheduled' &&
    campaign.scheduled_at &&
    new Date(campaign.scheduled_at) > new Date()
  ) {
    if (options.log) {
      console.log(
        `⏳ Campaign ${campaign.id} scheduled for ${campaign.scheduled_at}, skipping until due`
      )
    }
    return
  }

  if (campaign.status === 'scheduled') {
    updateCampaignStatus(campaign.id, 'sending')
  }

  let processedForCampaign = 0
  let failedForCampaign = 0
  const batchSize = Math.max(1, options.batchSize || DEFAULT_BATCH_SIZE)

  while (true) {
    const recipients = claimRecipientsForSending(campaign.id, batchSize)
    if (recipients.length === 0) {
      break
    }

    for (const recipient of recipients) {
      recordCampaignEvent(campaign.id, 'queued', {
        recipientEmail: recipient.email,
        recipientId: recipient.id,
      })

      try {
        const sendResult = await sendToRecipient(campaign, recipient)

        if (sendResult.success) {
          markRecipientSent(recipient.id)
          processedForCampaign += 1
          recordCampaignEvent(campaign.id, 'sent', {
            recipientEmail: recipient.email,
            recipientId: recipient.id,
            testMode: campaign.test_mode,
          })
        } else {
          failedForCampaign += 1
          markRecipientFailed(recipient.id, sendResult.error || 'Unknown error')
          recordCampaignEvent(campaign.id, 'failed', {
            recipientEmail: recipient.email,
            recipientId: recipient.id,
            error: sendResult.error || 'Unknown error',
          })
        }
      } catch (error) {
        failedForCampaign += 1
        const message =
          error instanceof Error ? error.message : 'Unhandled error while sending email'
        markRecipientFailed(recipient.id, message.slice(0, 500))
        recordCampaignEvent(campaign.id, 'failed', {
          recipientEmail: recipient.email,
          recipientId: recipient.id,
          error: message,
        })
      }
    }
  }

  if (processedForCampaign === 0 && failedForCampaign === 0) {
    const summary = getCampaignSummary(campaign.id)
    if (summary.total_recipients === 0) {
      updateCampaignStatus(campaign.id, 'sent')
      setCampaignLastError(campaign.id, null)
    }
  }

  const summary = getCampaignSummary(campaign.id)
  if (summary.pending_count === 0 && summary.sending_count === 0) {
    updateCampaignStatus(campaign.id, 'sent')

    if (summary.failed_count > 0) {
      setCampaignLastError(
        campaign.id,
        `${summary.failed_count} recipient${summary.failed_count === 1 ? '' : 's'} failed`
      )
    } else {
      setCampaignLastError(campaign.id, null)
    }
  }

  result.processedCampaigns += 1
  result.processedRecipients += processedForCampaign
  result.failedRecipients += failedForCampaign
}

export async function processEmailCampaigns(
  options: ProcessEmailCampaignOptions = {}
): Promise<ProcessEmailCampaignResult> {
  const result: ProcessEmailCampaignResult = {
    processedCampaigns: 0,
    processedRecipients: 0,
    failedRecipients: 0,
    errors: [],
  }

  try {
    const campaigns: EmailCampaign[] = []

    if (options.campaignIds && options.campaignIds.length > 0) {
      for (const campaignId of options.campaignIds) {
        const campaign = getEmailCampaignById(campaignId)
        if (campaign) {
          campaigns.push(campaign)
        }
      }
    } else {
      const maxCampaigns = Math.max(1, options.maxCampaigns || DEFAULT_MAX_CAMPAIGNS)
      campaigns.push(...getCampaignsReadyToSend(maxCampaigns))
    }

    if (campaigns.length === 0 && options.log) {
      console.log('📭 No email campaigns ready to process')
    }

    for (const campaign of campaigns) {
      try {
        if (options.log) {
          console.log(
            `🚀 Processing campaign #${campaign.id} (${campaign.name}) [status=${campaign.status}]`
          )
        }
        await processCampaign(campaign, options, result)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error processing campaign'
        result.errors.push({ campaignId: campaign.id, error: message })
        setCampaignLastError(campaign.id, message)
        recordCampaignEvent(campaign.id, 'failed', {
          error: message,
        })
        if (options.log) {
          console.error(`❌ Error processing campaign ${campaign.id}:`, message)
        }
      }
    }
  } catch (outerError) {
    const message =
      outerError instanceof Error ? outerError.message : 'Unknown dispatcher error'
    result.errors.push({ campaignId: -1, error: message })
    if (options.log) {
      console.error('❌ Email campaign dispatcher error:', message)
    }
  }

  return result
}

export function enqueueCampaignDispatch(campaignId: number) {
  enqueueBackgroundJob({
    id: `email-campaign-${campaignId}-${Date.now()}`,
    description: `Process email campaign ${campaignId}`,
    run: async () => {
      await processEmailCampaigns({ campaignIds: [campaignId], log: process.env.NODE_ENV !== 'production' })
    },
  })
}

export function enqueueCampaignSweep() {
  enqueueBackgroundJob({
    id: `email-campaign-sweep-${Date.now()}`,
    description: 'Process pending email campaigns',
    run: async () => {
      await processEmailCampaigns({ log: process.env.NODE_ENV !== 'production' })
    },
  })
}

