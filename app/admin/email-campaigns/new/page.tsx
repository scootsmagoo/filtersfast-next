'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { ArrowLeft, Info, Send } from 'lucide-react';

type FormState = {
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
  scheduledAt: string;
  testMode: boolean;
  metadata: string;
};

const INITIAL_STATE: FormState = {
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
  scheduledAt: '',
  testMode: false,
  metadata: '',
};

export default function NewEmailCampaignPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  if (!session?.user) {
    return null;
  }

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmissionError(null);
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

      const scheduledAtIso =
        form.scheduledAt.trim() !== '' ? new Date(form.scheduledAt).toISOString() : undefined;

      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        fromName: form.fromName.trim(),
        fromEmail: form.fromEmail.trim(),
        replyToEmail: form.replyToEmail.trim() || undefined,
        templateId: form.templateId.trim() || undefined,
        contentHtml: form.templateId.trim() ? undefined : form.contentHtml.trim() || undefined,
        contentText: form.templateId.trim() ? undefined : form.contentText.trim() || undefined,
        targetAudience: form.targetAudience.trim() || undefined,
        segmentRules,
        scheduledAt: scheduledAtIso,
        testMode: form.testMode,
        metadata,
      };

      if (!payload.templateId && !payload.contentHtml && !payload.contentText) {
        throw new Error('Provide either a Template ID or custom HTML/text content.');
      }

      const response = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || `Failed to create campaign (status ${response.status})`);
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Failed to create campaign');
      }

      router.push(`/admin/email-campaigns/${json.campaign.id}`);
    } catch (error) {
      console.error('Failed to create campaign', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-10">
        <AdminBreadcrumb />

        <div className="mb-6 flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-fit flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Campaigns
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
              Create Email Campaign
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 transition-colors">
              Set up campaign messaging, select content, and optionally schedule for later. You can
              add recipients and track analytics after creation.
            </p>
          </div>
        </div>

        <Card className="p-6">
          {submissionError && (
            <div
              className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
              role="alert"
              aria-live="assertive"
            >
              {submissionError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Campaign Basics */}
            <section>
              <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  Campaign Basics
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  Provide email metadata, sender identity, and optional targeting labels.
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Spring Filter Savings"
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Spring cleaning starts with fresh filters"
                    value={form.subject}
                    onChange={(event) => updateForm('subject', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    From Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FiltersFast Marketing"
                    value={form.fromName}
                    onChange={(event) => updateForm('fromName', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    From Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="marketing@filtersfast.com"
                    value={form.fromEmail}
                    onChange={(event) => updateForm('fromEmail', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    placeholder="support@filtersfast.com"
                    value={form.replyToEmail}
                    onChange={(event) => updateForm('replyToEmail', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Target Audience Label
                  </label>
                  <input
                    type="text"
                    placeholder="repeat_customers"
                    value={form.targetAudience}
                    onChange={(event) => updateForm('targetAudience', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional tag describing who should receive this campaign. Used for filtering only.
                  </p>
                </div>
              </div>
            </section>

            {/* Content */}
            <section>
              <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  Content
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  Choose between using a reusable template (e.g., SendGrid) or provide custom HTML/text content.
                </p>
              </div>

              <div className="mt-6 grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    placeholder="d-1234567890abcdef1234567890abcdef"
                    value={form.templateId}
                    onChange={(event) => updateForm('templateId', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    When provided, the template will be used and custom HTML/text will be ignored.
                  </p>
                </div>

                <div className={form.templateId.trim() ? 'opacity-50 pointer-events-none' : undefined}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    HTML Content
                  </label>
                  <textarea
                    rows={6}
                    placeholder="<h1>Spring Savings</h1>..."
                    value={form.contentHtml}
                    onChange={(event) => updateForm('contentHtml', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className={form.templateId.trim() ? 'opacity-50 pointer-events-none' : undefined}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Plain Text Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Save 20% on select filters this week only..."
                    value={form.contentText}
                    onChange={(event) => updateForm('contentText', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            </section>

            {/* Segmentation & Scheduling */}
            <section>
              <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  Segmentation & Scheduling
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  Attach segment metadata and optionally schedule the campaign for later.
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Segment Rules (JSON)
                  </label>
                  <textarea
                    rows={6}
                    placeholder='{"lifecycleStage": "repeat_customer"}'
                    value={form.segmentRules}
                    onChange={(event) => updateForm('segmentRules', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional JSON payload describing segmentation logic. Stored for reporting.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Metadata (JSON)
                  </label>
                  <textarea
                    rows={6}
                    placeholder='{"cta": "Start Filtering"}'
                    value={form.metadata}
                    onChange={(event) => updateForm('metadata', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional JSON metadata for downstream automation or analytics.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Schedule Send
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) => updateForm('scheduledAt', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave blank to keep the campaign in draft mode. You can schedule later from the detail
                    page once recipients are added.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                  <Info className="h-5 w-5 text-brand-orange" aria-hidden="true" />
                  <div>
                    <label className="flex items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={form.testMode}
                        onChange={(event) => updateForm('testMode', event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                      />
                      Enable Test Mode
                    </label>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      When enabled, campaign metadata will be marked as test-only to avoid real sends in
                      downstream processors.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (confirm('Clear all fields?')) {
                    setForm(INITIAL_STATE);
                  }
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                <Send className="w-4 h-4" aria-hidden="true" />
                {submitting ? 'Creating…' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}


