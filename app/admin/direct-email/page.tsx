'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Mail,
  Send,
  AlertCircle,
  Loader2,
  ShieldAlert,
  CheckCircle,
  Info,
} from 'lucide-react'

interface DirectEmailSenderOption {
  address: string
  label: string
}

interface DirectEmailConfig {
  companyName: string
  provider: 'sendgrid' | 'console'
  emailEnabled: boolean
  allowedFromAddresses: DirectEmailSenderOption[]
  defaultFromAddress: string
  subjectMaxLength: number
  bodyMaxLength: number
  defaultSendCopy: boolean
  prefillTemplate: string
}

type StatusVariant = 'success' | 'error' | 'info'

interface StatusMessage {
  type: StatusVariant
  message: string
}

function clamp(value: string, maxLength: number): string {
  if (!maxLength || maxLength <= 0) return value
  return value.length > maxLength ? value.slice(0, maxLength) : value
}

export default function AdminDirectEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()

  const [config, setConfig] = useState<DirectEmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [isSending, setIsSending] = useState(false)
  const didPrefillRef = useRef(false)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [toName, setToName] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sendAsHtml, setSendAsHtml] = useState(false)
  const [sendCopy, setSendCopy] = useState(true)

  const initialParams = useMemo(() => {
    const emailTo = searchParams.get('emailTo') ?? ''
    const emailToName = searchParams.get('emailToName') ?? ''
    const emailSubject = searchParams.get('emailSubj') ?? ''
    const emailBody = searchParams.get('emailBody') ?? ''

    return { emailTo, emailToName, emailSubject, emailBody }
  }, [searchParams])

  const prefillBody = useCallback(
    (conf: DirectEmailConfig) => {
      if (initialParams.emailBody) {
        return clamp(initialParams.emailBody, conf.bodyMaxLength)
      }

      if (!conf.prefillTemplate) {
        return ''
      }

      const safeRecipient = initialParams.emailToName || initialParams.emailTo || ''
      const safeSubject = initialParams.emailSubject || ''

      return clamp(
        conf.prefillTemplate
          .replace('{{recipientName}}', safeRecipient)
          .replace('{{subject}}', safeSubject),
        conf.bodyMaxLength,
      )
    },
    [initialParams.emailBody, initialParams.emailSubject, initialParams.emailTo, initialParams.emailToName],
  )

  useEffect(() => {
    if (!session?.user || isPending) {
      return
    }

    async function fetchConfig() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin/direct-email')

        if (response.status === 401) {
          router.push('/sign-in?redirect=/admin/direct-email')
          return
        }

        if (response.status === 403) {
          setError('You do not have permission to send direct emails.')
          return
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load email configuration.')
        }

        const data: DirectEmailConfig = await response.json()
        setConfig(data)

        if (!didPrefillRef.current) {
          setFrom(data.defaultFromAddress || data.allowedFromAddresses[0]?.address || '')
          setSendCopy(data.defaultSendCopy)
          setSendAsHtml(false)
          setTo(initialParams.emailTo ? clamp(initialParams.emailTo, 254) : '')
          setToName(initialParams.emailToName ? clamp(initialParams.emailToName, 200) : '')
          setSubject(
            initialParams.emailSubject
              ? clamp(initialParams.emailSubject, data.subjectMaxLength)
              : '',
          )
          setMessage(prefillBody(data))
          didPrefillRef.current = true
        }
      } catch (fetchError: any) {
        setError(fetchError?.message || 'Unable to load email configuration.')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [session?.user, isPending, router, prefillBody, initialParams, setConfig])

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/direct-email')
    }
  }, [session, isPending, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    if (!config) {
      setStatus({ type: 'error', message: 'Email configuration is not available yet.' })
      return
    }

    if (!from) {
      setStatus({ type: 'error', message: 'Please select a sender address.' })
      return
    }

    if (!to) {
      setStatus({ type: 'error', message: 'Please provide a recipient email address.' })
      return
    }

    if (!subject.trim()) {
      setStatus({ type: 'error', message: 'Email subject is required.' })
      return
    }

    if (!message.trim()) {
      setStatus({ type: 'error', message: 'Email message body is required.' })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/admin/direct-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          toName,
          subject: clamp(subject, config.subjectMaxLength),
          message: clamp(message, config.bodyMaxLength),
          sendAsHtml,
          sendCopy,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to send email.',
        })
        return
      }

      const noticeSuffix = data.notice ? ` ${data.notice}` : ''
      setStatus({
        type: 'success',
        message: (data.message || 'Email sent successfully.') + noticeSuffix,
      })
    } catch (submitError: any) {
      setStatus({
        type: 'error',
        message: submitError?.message || 'Unexpected error while sending email.',
      })
    } finally {
      setIsSending(false)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center" role="status" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto motion-reduce:animate-none" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading email composer…</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container-custom py-12">
          <Card className="max-w-2xl mx-auto p-8 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 transition-colors" role="alert">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-1" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Unable to load email composer
                </h1>
                <p className="text-gray-700 dark:text-gray-300">
                  {error}
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                  >
                    Return to Admin Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const providerNotice = config?.provider === 'console'
    ? 'Email provider is running in console mode. Messages will be logged server-side but not delivered.'
    : 'Emails are sent via SendGrid transactional API.'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Direct Email Composer
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Send individual customer emails directly from the FiltersFast admin console. Legacy parity for <code>email.asp</code>.
            </p>
          </div>

          {config && (
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {config.emailEnabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Provider: {config.provider === 'sendgrid' ? 'SendGrid' : 'Console (mock)'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {providerNotice}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Subject max: {config.subjectMaxLength} chars · Body max: {config.bodyMaxLength.toLocaleString()} chars
                </div>
              </div>
            </Card>
          )}

          {status && (
            <Card
              className={[
                'p-4',
                status.type === 'success'
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30'
                  : status.type === 'error'
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'
                  : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30',
              ].join(' ')}
              role={status.type === 'error' ? 'alert' : 'status'}
            >
              <div className="flex items-start gap-3">
                {status.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" aria-hidden="true" />
                ) : status.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true" />
                )}
                <p className="text-sm text-gray-800 dark:text-gray-200">{status.message}</p>
              </div>
            </Card>
          )}

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From Email <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="from"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select sender</option>
                    {config?.allowedFromAddresses.map((option) => (
                      <option key={option.address} value={option.address}>
                        {option.label} ({option.address})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="to"
                    type="email"
                    value={to}
                    onChange={(event) => setTo(clamp(event.target.value, 254))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="customer@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="toName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Name
                  </label>
                  <input
                    id="toName"
                    type="text"
                    value={toName}
                    onChange={(event) => setToName(clamp(event.target.value, 200))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Customer Name"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(event) => {
                      if (!config) {
                        setSubject(event.target.value)
                        return
                      }
                      setSubject(clamp(event.target.value, config.subjectMaxLength))
                    }}
                    maxLength={config?.subjectMaxLength}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Subject line"
                    required
                  />
                  {config && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {subject.length} / {config.subjectMaxLength} characters
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(event) => {
                    if (!config) {
                      setMessage(event.target.value)
                      return
                    }
                    const incoming = event.target.value
                    if (incoming.length <= config.bodyMaxLength) {
                      setMessage(incoming)
                    } else {
                      setMessage(incoming.slice(0, config.bodyMaxLength))
                    }
                  }}
                  rows={12}
                  maxLength={config?.bodyMaxLength}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white resize-y"
                  placeholder="Write your message here…"
                  required
                ></textarea>
                {config && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {message.length.toLocaleString()} / {config.bodyMaxLength.toLocaleString()} characters
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={sendAsHtml}
                    onChange={(event) => setSendAsHtml(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  Send as HTML email
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={sendCopy}
                    onChange={(event) => setSendCopy(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  Send copy to sender
                </label>
              </div>

              {!config?.emailEnabled && (
                <div className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5" aria-hidden="true" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    Email component is currently running in console (mock) mode. Messages will be logged in the server console rather than being delivered to the recipient. Configure SendGrid credentials to enable live delivery.
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Emails are logged with admin audit trail for compliance. Legacy fields <code>TO</code>, <code>RE</code> pre-fill supported via query parameters.
                </p>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}


