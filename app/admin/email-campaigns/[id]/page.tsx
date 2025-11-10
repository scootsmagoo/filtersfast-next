'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CampaignStatusBadge from '@/components/admin/email-campaigns/CampaignStatusBadge';
import type {
  EmailCampaign,
  EmailCampaignEvent,
  EmailCampaignRecipient,
  EmailCampaignSummary,
} from '@/lib/types/email-campaign';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Pause,
  Play,
  RefreshCcw,
  Send,
  Target,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';

type RecipientStatusFilter = 'all' | 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

type EditFormState = {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  templateId: string;
  contentHtml: string;
  contentText: string;
  targetAudience: string;
  segmentRules: string;
  metadata: string;
  testMode: boolean;
};

const INITIAL_FORM: EditFormState = {
  name: '',
  subject: '',
  fromName: '',
  fromEmail: '',
  replyToEmail: '',
  templateId: '',
  contentHtml: '',
  contentText: '',
  targetAudience: '',
  segmentRules: '',
  metadata: '',
  testMode: false,
};

const RECIPIENT_PAGE_SIZE = 25;

export default function EmailCampaignDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const campaignId = Number(params?.id);
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [summary, setSummary] = useState<EmailCampaignSummary | null>(null);
  const [form, setForm] = useState<EditFormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [recipients, setRecipients] = useState<EmailCampaignRecipient[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<RecipientStatusFilter>('all');
  const [recipientOffset, setRecipientOffset] = useState(0);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  const [events, setEvents] = useState<EmailCampaignEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [addRecipientsInput, setAddRecipientsInput] = useState('');
  const [overwriteRecipients, setOverwriteRecipients] = useState(false);
  const [addingRecipients, setAddingRecipients] = useState(false);

  const [scheduleDate, setScheduleDate] = useState('');
  const [sendAction, setSendAction] = useState<null | 'schedule' | 'send-now' | 'pause' | 'resume' | 'cancel'>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  if (!Number.isFinite(campaignId) || campaignId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="rounded-lg border border-red-300 bg-red-50 px-6 py-8 text-center text-red-700 shadow dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          <p className="text-lg font-semibold">Invalid campaign identifier</p>
          <p className="mt-2 text-sm">Please return to the campaigns list and select a valid campaign.</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/email-campaigns')}
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!session?.user) return;

    fetchCampaign();
    fetchRecipientsData(recipientStatusFilter, recipientOffset);
    fetchEvents();
  }, [session?.user, campaignId]);

  useEffect(() => {
    if (!session?.user) return;
    fetchRecipientsData(recipientStatusFilter, recipientOffset);
  }, [session?.user, campaignId, recipientStatusFilter, recipientOffset]);

  const fetchCampaign = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/email-campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error(`Failed to load campaign (${response.status})`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to load campaign');
      }

      setCampaign(json.campaign);
      setSummary(json.summary);
      setForm({
        name: json.campaign.name ?? '',
        subject: json.campaign.subject ?? '',
        fromName: json.campaign.from_name ?? '',
        fromEmail: json.campaign.from_email ?? '',
        replyToEmail: json.campaign.reply_to_email ?? '',
        templateId: json.campaign.template_id ?? '',
        contentHtml: json.campaign.content_html ?? '',
        contentText: json.campaign.content_text ?? '',
        targetAudience: json.campaign.target_audience ?? '',
        segmentRules: json.campaign.segment_rules
          ? JSON.stringify(json.campaign.segment_rules, null, 2)
          : '',
        metadata: json.campaign.metadata ? JSON.stringify(json.campaign.metadata, null, 2) : '',
        testMode: json.campaign.test_mode ?? false,
      });
    } catch (err) {
      console.error('Failed to load campaign', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipientsData = async (status: RecipientStatusFilter, offset: number) => {
    setRecipientsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(RECIPIENT_PAGE_SIZE));
      params.set('offset', String(offset));
      if (status !== 'all') {
        params.set('status', status);
      }

      const response = await fetch(
        `/api/admin/email-campaigns/${campaignId}/recipients?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load recipients (${response.status})`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to load recipients');
      }

      setRecipients(json.recipients ?? []);
      setRecipientsTotal(json.total ?? 0);
    } catch (err) {
      console.error('Failed to load recipients', err);
      setError((prev) => prev || (err instanceof Error ? err.message : 'Failed to load recipients'));
    } finally {
      setRecipientsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch(`/api/admin/email-campaigns/${campaignId}/events?limit=200`);
      if (!response.ok) {
        throw new Error(`Failed to load events (${response.status})`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to load events');
      }

      setEvents(json.events ?? []);
    } catch (err) {
      console.error('Failed to load events', err);
      setError((prev) => prev || (err instanceof Error ? err.message : 'Failed to load events'));
    } finally {
      setEventsLoading(false);
    }
  };

  const updateForm = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setOperationMessage(null);
    setOperationError(null);
    try {
      let segmentRules: Record<string, any> | undefined;
      let metadata: Record<string, any> | undefined;

      if (form.segmentRules.trim()) {
        try {
          segmentRules = JSON.parse(form.segmentRules);
        } catch (error) {
          throw new Error('Segment rules must be valid JSON.');
        }
      }

      if (form.metadata.trim()) {
        try {
          metadata = JSON.parse(form.metadata);
        } catch (error) {
          throw new Error('Metadata must be valid JSON.');
        }
      }

      const payload: Record<string, any> = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        fromName: form.fromName.trim(),
        fromEmail: form.fromEmail.trim(),
        testMode: form.testMode,
      };

      payload.replyToEmail = form.replyToEmail.trim();
      payload.targetAudience = form.targetAudience.trim();
      payload.templateId = form.templateId.trim();

      if (!payload.templateId) {
        payload.contentHtml = form.contentHtml;
        payload.contentText = form.contentText;
      } else {
        payload.contentHtml = '';
        payload.contentText = '';
      }

      if (segmentRules !== undefined) {
        payload.segmentRules = segmentRules;
      }
      if (metadata !== undefined) {
        payload.metadata = metadata;
      }

      const response = await fetch(`/api/admin/email-campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || `Failed to save campaign (${response.status})`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to save campaign');
      }

      setCampaign(json.campaign);
      setSummary(json.summary);
      setOperationMessage('Campaign updated successfully.');
      setOperationError(null);
    } catch (error) {
      console.error('Failed to update campaign', error);
      setOperationError(error instanceof Error ? error.message : 'Failed to update campaign');
      setOperationMessage(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecipients = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addingRecipients) return;

    const lines = addRecipientsInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setOperationError('Provide at least one recipient (one per line).');
      setOperationMessage(null);
      return;
    }

    const recipientsPayload = lines
      .map((line) => {
        const parts = line.split(',').map((part) => part.trim());
        const email = parts[0];
        if (!email || !email.includes('@')) {
          return null;
        }
        return {
          email,
          firstName: parts[1] || undefined,
          lastName: parts[2] || undefined,
        };
      })
      .filter((entry): entry is { email: string; firstName?: string; lastName?: string } => Boolean(entry));

    if (recipientsPayload.length === 0) {
      setOperationError('Unable to parse valid email addresses. Use one per line with optional first/last names.');
      setOperationMessage(null);
      return;
    }

    setAddingRecipients(true);
    setOperationMessage(null);
    setOperationError(null);
    try {
      const response = await fetch(`/api/admin/email-campaigns/${campaignId}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipientsPayload,
          overwrite: overwriteRecipients,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || `Failed to add recipients (${response.status})`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to add recipients');
      }

      setOperationMessage(`Recipients processed. Added: ${json.added}, skipped/updated: ${json.skipped}.`);
      setOperationError(null);
      setAddRecipientsInput('');
      setOverwriteRecipients(false);

      await Promise.all([fetchCampaign(), fetchRecipientsData(recipientStatusFilter, recipientOffset)]);
    } catch (error) {
      console.error('Failed to add recipients', error);
      setOperationError(error instanceof Error ? error.message : 'Failed to add recipients');
      setOperationMessage(null);
    } finally {
      setAddingRecipients(false);
    }
  };

  const handleSendAction = async (
    action: 'schedule' | 'send-now' | 'pause' | 'resume' | 'cancel',
    options: { scheduledAt?: string } = {}
  ) => {
    if (sendAction) return;

    if ((action === 'schedule' || action === 'send-now') && (summary?.total_recipients ?? 0) === 0) {
      setOperationError('Add recipients before scheduling or sending this campaign.');
      setOperationMessage(null);
      return;
    }

    if (action === 'schedule') {
      if (!options.scheduledAt) {
        setOperationError('Choose a schedule date and time first.');
        setOperationMessage(null);
        return;
      }
    }

    setOperationMessage(null);
    setOperationError(null);
    setSendAction(action);
    try {
      const payload: Record<string, any> = { action };
      if (options.scheduledAt) {
        payload.scheduledAt = options.scheduledAt;
      }

      const response = await fetch(`/api/admin/email-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || `Failed to update campaign (${response.status})`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to update campaign status');
      }

      await fetchCampaign();
      await fetchEvents();
      setOperationMessage(`Campaign ${action.replace('-', ' ')} request accepted.`);
      setOperationError(null);
    } catch (error) {
      console.error('Failed to update campaign status', error);
      setOperationError(error instanceof Error ? error.message : 'Failed to update campaign status');
      setOperationMessage(null);
    } finally {
      setSendAction(null);
    }
  };

  const campaignStatus = campaign?.status ?? 'draft';
  const scheduledLabel = campaign?.scheduled_at
    ? new Date(campaign.scheduled_at).toLocaleString()
    : 'Not scheduled';
  const sentLabel = campaign?.sent_at ? new Date(campaign.sent_at).toLocaleString() : 'Not sent';
  const createdLabel = campaign?.created_at ? new Date(campaign.created_at).toLocaleString() : '';
  const updatedLabel = campaign?.updated_at ? new Date(campaign.updated_at).toLocaleString() : '';

  const canScheduleOrSend =
    summary && summary.total_recipients > 0 && !['sent', 'cancelled'].includes(campaignStatus);

  const recipientPages = Math.ceil(recipientsTotal / RECIPIENT_PAGE_SIZE);
  const currentPage = Math.floor(recipientOffset / RECIPIENT_PAGE_SIZE) + 1;

  if (!session?.user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-300">
          <Loader2 className="h-10 w-10 animate-spin text-brand-orange" aria-hidden="true" />
          <p>Loading campaign details…</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="rounded-lg border border-red-300 bg-red-50 px-6 py-8 text-center text-red-700 shadow dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          <p className="text-lg font-semibold">Unable to load campaign</p>
          <p className="mt-2 text-sm">{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/email-campaigns')}>
              Return to list
            </Button>
            <Button onClick={fetchCampaign}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-10 space-y-8">
        <AdminBreadcrumb />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/email-campaigns')}
              className="w-fit flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Campaigns
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {campaign?.name}
                </h1>
                <CampaignStatusBadge status={campaignStatus} />
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-300 transition-colors">
                Subject: <span className="font-medium text-gray-800 dark:text-gray-100">{campaign?.subject}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                Created {createdLabel} · Last updated {updatedLabel}
              </p>
            </div>
          </div>

            <div className="flex flex-col items-stretch gap-3 md:items-end">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={fetchCampaign}
                >
                  <RefreshCcw className="w-4 h-4" aria-hidden="true" />
                  Refresh
                </Button>
                {canScheduleOrSend && (
                  <Button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => handleSendAction('send-now')}
                    disabled={sendAction !== null}
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    {sendAction === 'send-now' ? 'Sending…' : 'Send Now'}
                  </Button>
                )}
                {campaignStatus === 'scheduled' || campaignStatus === 'sending' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleSendAction('pause')}
                      disabled={sendAction !== null}
                    >
                      <Pause className="w-4 h-4" aria-hidden="true" />
                      {sendAction === 'pause' ? 'Pausing…' : 'Pause'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 dark:text-red-400"
                      onClick={() => {
                        if (confirm('Cancel this campaign? This cannot be undone.')) {
                          handleSendAction('cancel');
                        }
                      }}
                      disabled={sendAction !== null}
                    >
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                      {sendAction === 'cancel' ? 'Cancelling…' : 'Cancel'}
                    </Button>
                  </>
                ) : null}
                {campaignStatus === 'paused' ? (
                  <Button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => handleSendAction('resume')}
                    disabled={sendAction !== null}
                  >
                    <Play className="w-4 h-4" aria-hidden="true" />
                    {sendAction === 'resume' ? 'Resuming…' : 'Resume Send'}
                  </Button>
                ) : null}
              </div>

              {canScheduleOrSend && (
                <Card className="w-full md:w-auto border border-dashed border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 px-4 py-3">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!scheduleDate) {
                        alert('Select a date/time to schedule.');
                        return;
                      }
                      const iso = new Date(scheduleDate).toISOString();
                      handleSendAction('schedule', { scheduledAt: iso });
                    }}
                    className="flex flex-col gap-3 md:flex-row md:items-center"
                  >
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Schedule Send
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(event) => setScheduleDate(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={sendAction !== null}
                      className="flex items-center gap-2"
                    >
                      <CalendarClock className="w-4 h-4" aria-hidden="true" />
                      {sendAction === 'schedule' ? 'Scheduling…' : 'Schedule'}
                    </Button>
                  </form>
                </Card>
              )}
            </div>
        </div>

        {operationError && (
          <div
            className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
            role="alert"
            aria-live="assertive"
          >
            {operationError}
          </div>
        )}

        {operationMessage && (
          <div
            className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"
            role="status"
            aria-live="polite"
          >
            {operationMessage}
          </div>
        )}

        {/* Status overview cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-brand-orange/10 p-3 text-brand-orange">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Recipients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {summary?.total_recipients ?? 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-3 text-blue-600 dark:text-blue-300">
                <Activity className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {summary && summary.sent_count > 0
                    ? ((summary.open_count / summary.sent_count) * 100).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-3 text-green-600 dark:text-green-300">
                <Target className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Click Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {summary && summary.sent_count > 0
                    ? ((summary.click_count / summary.sent_count) * 100).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-3 text-purple-600 dark:text-purple-300">
                <Clock className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Schedule</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {scheduledLabel}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sent: {sentLabel}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            {/* Campaign configuration form */}
            <Card className="p-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Campaign Configuration</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update sender information, subject, and content. Template ID supersedes custom content.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => updateForm('subject', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={form.fromName}
                      onChange={(e) => updateForm('fromName', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={form.fromEmail}
                      onChange={(e) => updateForm('fromEmail', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Reply-To Email
                    </label>
                    <input
                      type="email"
                      value={form.replyToEmail}
                      onChange={(e) => updateForm('replyToEmail', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Target Audience Label
                    </label>
                    <input
                      type="text"
                      value={form.targetAudience}
                      onChange={(e) => updateForm('targetAudience', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      placeholder="repeat_customers"
                    />
                  </div>
                </div>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Template ID
                    </label>
                    <input
                      type="text"
                      value={form.templateId}
                      onChange={(e) => updateForm('templateId', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      placeholder="d-1234567890abcdef1234567890abcdef"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Provide a transactional template ID (e.g., SendGrid). When set, custom HTML/text below
                      is ignored.
                    </p>
                  </div>

                  <div className={form.templateId.trim() ? 'opacity-50 pointer-events-none' : undefined}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      HTML Content
                    </label>
                    <textarea
                      rows={6}
                      value={form.contentHtml}
                      onChange={(e) => updateForm('contentHtml', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      placeholder="<h1>Spring Savings</h1>..."
                    />
                  </div>

                  <div className={form.templateId.trim() ? 'opacity-50 pointer-events-none' : undefined}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Plain Text Content
                    </label>
                    <textarea
                      rows={4}
                      value={form.contentText}
                      onChange={(e) => updateForm('contentText', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      placeholder="Plain text fallback content…"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Segment Rules (JSON)
                    </label>
                    <textarea
                      rows={6}
                      value={form.segmentRules}
                      onChange={(e) => updateForm('segmentRules', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      placeholder='{"lifecycleStage": "repeat_customer"}'
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Metadata (JSON)
                    </label>
                    <textarea
                      rows={6}
                      value={form.metadata}
                      onChange={(e) => updateForm('metadata', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      placeholder='{"cta": "Shop Now"}'
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                  <AlertCircle className="h-5 w-5 text-brand-orange" aria-hidden="true" />
                  <div>
                    <label className="flex items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={form.testMode}
                        onChange={(e) => updateForm('testMode', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                      />
                      Test Mode
                    </label>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Keep enabled for internal QA campaigns. Downstream processors should treat test-mode
                      campaigns differently.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="submit" disabled={saving} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Recipients */}
            <Card className="p-6 space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recipients</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage who should receive this campaign. Import CSV rows by pasting emails below.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'pending', 'sending', 'sent', 'failed', 'skipped'] as RecipientStatusFilter[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setRecipientStatusFilter(status);
                          setRecipientOffset(0);
                        }}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                          recipientStatusFilter === status
                            ? 'bg-brand-orange text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
                <form onSubmit={handleAddRecipients} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Bulk Add Recipients
                    </label>
                    <textarea
                      rows={8}
                      value={addRecipientsInput}
                      onChange={(e) => setAddRecipientsInput(e.target.value)}
                      placeholder={`email@example.com,First,Last\nfriend@example.com\ncustomer@example.com,Jane,Smith`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      One per line. Optionally include first and last name separated by commas.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={overwriteRecipients}
                      onChange={(e) => setOverwriteRecipients(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    Replace existing recipients
                  </label>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={addingRecipients} className="flex items-center gap-2">
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      {addingRecipients ? 'Processing…' : 'Import Recipients'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAddRecipientsInput('');
                        setOverwriteRecipients(false);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </form>

                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/70 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                    <InfoIcon />
                    Tips
                  </h3>
                  <ul className="mt-3 space-y-2 list-disc pl-4">
                    <li>
                      Recipients are deduplicated by email. Existing records will be updated rather than
                      duplicated.
                    </li>
                    <li>
                      Use the overwrite option to reset the entire list before importing a fresh segment.
                    </li>
                    <li>
                      Add recipients before scheduling or sending the campaign. Minimum 1 recipient required.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                    {recipientsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                          Loading recipients…
                        </td>
                      </tr>
                    ) : recipients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                          No recipients found for this filter.
                        </td>
                      </tr>
                    ) : (
                      recipients.map((recipient) => (
                        <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {recipient.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {[recipient.first_name, recipient.last_name].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
                            {recipient.status}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            {recipient.sent_at && <p>Sent: {new Date(recipient.sent_at).toLocaleString()}</p>}
                            {recipient.opened_at && <p>Opened: {new Date(recipient.opened_at).toLocaleString()}</p>}
                            {recipient.clicked_at && (
                              <p>Clicked: {new Date(recipient.clicked_at).toLocaleString()}</p>
                            )}
                            {recipient.bounced_at && (
                              <p className="text-red-600 dark:text-red-400">
                                Bounced: {new Date(recipient.bounced_at).toLocaleString()}
                              </p>
                            )}
                            {!recipient.sent_at && !recipient.opened_at && !recipient.clicked_at && (
                              <p>—</p>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {recipientPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    Showing{' '}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {Math.min(recipientsTotal, recipientOffset + 1)}-
                      {Math.min(recipientsTotal, recipientOffset + recipients.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {recipientsTotal.toLocaleString()}
                    </span>{' '}
                    recipients
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRecipientOffset(Math.max(0, recipientOffset - RECIPIENT_PAGE_SIZE))}
                      disabled={recipientOffset === 0}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {currentPage} / {recipientPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRecipientOffset(
                          Math.min(
                            RECIPIENT_PAGE_SIZE * (recipientPages - 1),
                            recipientOffset + RECIPIENT_PAGE_SIZE
                          )
                        )
                      }
                      disabled={currentPage === recipientPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Events & metadata */}
          <div className="space-y-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Events</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchEvents}
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" aria-hidden="true" />
                  Refresh
                </Button>
              </div>

              <div className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {eventsLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading timeline…</p>
                ) : events.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No events recorded yet.</p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <p className="font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                        {event.event_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                      {event.recipient_email && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Recipient: <span className="font-medium">{event.recipient_email}</span>
                        </p>
                      )}
                      {event.event_data && (
                        <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
{JSON.stringify(event.event_data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Campaign Metadata</h2>
              <dl className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start justify-between">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">From</dt>
                  <dd className="text-right">
                    {campaign?.from_name} &lt;{campaign?.from_email}&gt;
                  </dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Reply-To</dt>
                  <dd className="text-right">{campaign?.reply_to_email || '—'}</dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Template ID</dt>
                  <dd className="text-right font-mono text-xs">{campaign?.template_id || 'None'}</dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Status</dt>
                  <dd className="text-right">{campaignStatus}</dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Test Mode</dt>
                  <dd className="text-right">{campaign?.test_mode ? 'Enabled' : 'Disabled'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Target Audience</dt>
                  <dd className="mt-1 text-gray-700 dark:text-gray-300">{campaign?.target_audience || '—'}</dd>
                </div>
              </dl>

              {campaign?.segment_rules && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Segment Rules</h3>
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
{JSON.stringify(campaign.segment_rules, null, 2)}
                  </pre>
                </div>
              )}

              {campaign?.metadata && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Metadata</h3>
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
{JSON.stringify(campaign.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon() {
  return <Info className="w-4 h-4 text-brand-orange" aria-hidden="true" />;
}


