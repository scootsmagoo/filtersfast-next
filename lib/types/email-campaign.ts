/**
 * Email Campaign Manager Types
 */

export type EmailCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'sent'
  | 'cancelled'

export type EmailCampaignRecipientStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'skipped'

export type EmailCampaignEventType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'recipient_added'
  | 'recipient_removed'
  | 'scheduled'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'unsubscribed'
  | 'test_sent'

export interface EmailCampaign {
  id: number
  name: string
  subject: string
  from_name: string
  from_email: string
  reply_to_email: string | null
  template_id: string | null
  content_html: string | null
  content_text: string | null
  target_audience: string | null
  segment_rules: Record<string, any> | null
  status: EmailCampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  test_mode: boolean
  metadata: Record<string, any> | null
  last_error: string | null
  created_by: number | null
  updated_by: number | null
  created_at: string
  updated_at: string
}

export interface EmailCampaignListItem extends EmailCampaign {
  total_recipients: number
  sent_count: number
  failed_count: number
  open_count: number
  click_count: number
}

export interface EmailCampaignRecipient {
  id: number
  campaign_id: number
  email: string
  first_name: string | null
  last_name: string | null
  status: EmailCampaignRecipientStatus
  error: string | null
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  suppressed_at: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface EmailCampaignEvent {
  id: number
  campaign_id: number
  recipient_email: string | null
  event_type: EmailCampaignEventType
  event_data: Record<string, any> | null
  created_at: string
}

export interface EmailCampaignSummary {
  total_recipients: number
  pending_count: number
  sending_count: number
  sent_count: number
  failed_count: number
  skipped_count: number
  open_count: number
  click_count: number
  bounce_count: number
  unsubscribe_count: number
  last_event_at: string | null
}

export interface CreateEmailCampaignInput {
  name: string
  subject: string
  fromName: string
  fromEmail: string
  replyToEmail?: string | null
  templateId?: string | null
  contentHtml?: string | null
  contentText?: string | null
  targetAudience?: string | null
  segmentRules?: Record<string, any> | null
  scheduledAt?: string | null
  testMode?: boolean
  metadata?: Record<string, any> | null
}

export interface UpdateEmailCampaignInput {
  name?: string
  subject?: string
  fromName?: string
  fromEmail?: string
  replyToEmail?: string | null
  templateId?: string | null
  contentHtml?: string | null
  contentText?: string | null
  targetAudience?: string | null
  segmentRules?: Record<string, any> | null
  scheduledAt?: string | null
  status?: EmailCampaignStatus
  testMode?: boolean
  metadata?: Record<string, any> | null
}

export interface CampaignRecipientQuery {
  status?: EmailCampaignRecipientStatus
  limit?: number
  offset?: number
}

export interface AddCampaignRecipientsInput {
  recipients: Array<{
    email: string
    firstName?: string
    lastName?: string
    metadata?: Record<string, any>
  }>
  overwrite?: boolean
}

export interface AddCampaignRecipientsResult {
  added: number
  skipped: number
}

export interface CampaignRecipientResult {
  recipients: EmailCampaignRecipient[]
  total: number
}




