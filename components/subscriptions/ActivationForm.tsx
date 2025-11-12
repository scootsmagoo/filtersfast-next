'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react'

import type {
  ActivationItem,
  ActivationSecurityLevel,
} from '@/lib/subscription-activation'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface ActivationFormProps {
  accessKey: string
  items: ActivationItem[]
  orderNumber: string
  orderTotal: number
  paidAt?: string | null
  customerName: string
  securityLevel: ActivationSecurityLevel
  warnings?: string[]
}

interface ActivationFormRow extends ActivationItem {
  frequency: number
}

interface ActivationSuccess {
  success: true
  created: Array<{
    subscriptionId: string
    productId: string
    productName: string
    frequency: number
  }>
  skipped: Array<{
    orderItemId: string
    reason: string
  }>
  message: string
}

type ActivationResponse =
  | ActivationSuccess
  | {
      success?: false
      error: string
      code?: string
      skipped?: ActivationSuccess['skipped']
    }

const frequencyOptions = Array.from({ length: 12 }, (_, index) => index + 1)
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export default function ActivationForm({
  accessKey,
  items,
  orderNumber,
  orderTotal,
  paidAt,
  customerName,
  securityLevel,
  warnings = [],
}: ActivationFormProps) {
  const [rows, setRows] = useState<ActivationFormRow[]>(
    items.map(item => ({
      ...item,
      frequency: item.defaultFrequency,
    })),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ActivationSuccess | null>(null)

  const selectedCount = useMemo(
    () => rows.filter(row => row.frequency > 0).length,
    [rows],
  )

  const handleFrequencyChange = (orderItemId: string, value: number) => {
    setRows(current =>
      current.map(row =>
        row.orderItemId === orderItemId
          ? { ...row, frequency: value }
          : row,
      ),
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/subscriptions/activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessKey,
          selections: rows.map(row => ({
            orderItemId: row.orderItemId,
            frequency: row.frequency,
          })),
        }),
      })

      const data = (await response.json()) as ActivationResponse

      if (!response.ok || !('success' in data && data.success)) {
        const message =
          'error' in data && typeof data.error === 'string'
            ? data.error
            : 'We could not activate your subscription.'
        setError(message)
        return
      }

      setResult(data)

      // Update the UI so already-created subscriptions default to disabled state
      setRows(current =>
        current.map(row => {
          const createdItem = data.created.find(
            created => created.productId === row.productId,
          )
          if (createdItem) {
            return { ...row, frequency: row.frequency }
          }
          return row
        }),
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not reach the subscription service. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const securityMessage =
    securityLevel === 'legacy'
      ? 'This secure activation link uses our legacy format. We still honour it, but please activate soon so your savings are locked in.'
      : securityLevel === 'token'
        ? 'This activation link is secured with a one-time access key.'
        : 'This activation link is signed and validated for your order.'

  return (
    <Card className="p-8 space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Finalize Your Home Filter Club Subscription
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose the delivery schedule for each item you want to receive on
          auto-delivery. You’ll save on every shipment and keep replacement
          filters arriving right on time.
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <ShieldCheck
              aria-hidden="true"
              className="h-4 w-4 text-brand-orange"
            />
            <span>{securityMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock
              aria-hidden="true"
              className="h-4 w-4 text-brand-orange"
            />
            <span>
              Order {orderNumber} • {currencyFormatter.format(orderTotal)}
              {paidAt
                ? ` • Paid ${dateFormatter.format(new Date(paidAt))}`
                : ''}
            </span>
          </div>
        </div>

        {warnings.includes('missing-user') && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Heads up, {customerName.split(' ')[0]} — if you haven’t created an
              account yet, please sign in or create one with your order email
              before activating. That lets you manage your new subscription
              online anytime.
            </span>
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {rows.map(item => (
            <div
              key={item.orderItemId}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm transition hover:border-brand-orange/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-brand-orange/60"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    No image
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {item.productName}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {item.variantName ? `${item.variantName} • ` : ''}
                    Qty {item.quantity} •{' '}
                    {currencyFormatter.format(item.unitPrice)}
                  </div>
                  <div className="text-sm text-brand-orange font-medium">
                    Subscribe & Save {item.subscriptionDiscount}% + Free Shipping
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label
                  htmlFor={`frequency-${item.orderItemId}`}
                  className="text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Delivery frequency
                </label>
                <select
                  id={`frequency-${item.orderItemId}`}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-brand-orange md:w-64"
                  value={item.frequency}
                  onChange={event =>
                    handleFrequencyChange(
                      item.orderItemId,
                      Number(event.target.value),
                    )
                  }
                >
                  <option value={0}>Do not include in subscription</option>
                  {frequencyOptions.map(option => (
                    <option key={option} value={option}>
                      Every {option} month{option > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div
            className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {result.message}
                </p>
                <ul className="mt-2 space-y-1 text-emerald-900 dark:text-emerald-100">
                  {result.created.map(entry => (
                    <li key={entry.subscriptionId}>
                      • {entry.productName} — every {entry.frequency} month
                      {entry.frequency > 1 ? 's' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {result.skipped.length > 0 && (
              <div className="rounded-md bg-white/60 px-3 py-2 text-xs text-emerald-700 shadow-inner dark:bg-gray-900/40 dark:text-emerald-200">
                {result.skipped.map(skipped => {
                  const skippedItem = rows.find(
                    row => row.orderItemId === skipped.orderItemId,
                  )
                  if (!skippedItem) return null

                  const reason =
                    skipped.reason === 'duplicate'
                      ? 'You already have an active subscription for this product.'
                      : skipped.reason === 'excluded'
                        ? 'You chose not to include this item.'
                        : skipped.reason === 'creation_failed'
                          ? 'We hit a snag creating this subscription.'
                          : 'This selection could not be processed.'

                  return (
                    <div key={skipped.orderItemId}>
                      {skippedItem.productName}: {reason}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {selectedCount > 0
              ? `You’re activating ${selectedCount} subscription${selectedCount > 1 ? 's' : ''}.`
              : 'Select at least one item to activate.'}
          </div>
          <Button
            type="submit"
            disabled={submitting || selectedCount === 0}
            className={cn(
              'flex items-center justify-center gap-2 px-6 py-2 text-base',
              selectedCount === 0 && 'cursor-not-allowed opacity-60',
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Activating…
              </>
            ) : (
              'Start Subscription'
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}


