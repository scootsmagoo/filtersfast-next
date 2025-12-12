import Card from '@/components/ui/Card'
import type { GiftCardCartDetails } from '@/lib/cart-context'

interface GiftCardPurchaseFormProps {
  details: GiftCardCartDetails
  onChange: (details: GiftCardCartDetails) => void
}

function toDateInputValue(timestamp?: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function GiftCardPurchaseForm({ details, onChange }: GiftCardPurchaseFormProps) {
  const updateField = (key: keyof GiftCardCartDetails, value: any) => {
    onChange({
      ...details,
      [key]: value,
    })
  }

  const handleSendDateChange = (value: string) => {
    if (!value) {
      updateField('sendAt', null)
      return
    }

    const parsed = new Date(`${value}T12:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      updateField('sendAt', null)
      return
    }

    updateField('sendAt', parsed.getTime())
  }

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
          Gift Card Delivery Details
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors mt-1">
          We&apos;ll email a digital gift card to your recipient. Schedule delivery or send it immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            Recipient Name (optional)
          </label>
          <input
            type="text"
            value={details.recipientName || ''}
            onChange={(event) => updateField('recipientName', event.target.value)}
            placeholder="Jane Doe"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            Recipient Email<span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            type="email"
            required
            value={details.recipientEmail}
            onChange={(event) => updateField('recipientEmail', event.target.value)}
            placeholder="recipient@example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
          Personal Message (optional)
        </label>
        <textarea
          value={details.message || ''}
          onChange={(event) => updateField('message', event.target.value.slice(0, 400))}
          rows={3}
          maxLength={400}
          placeholder="Add a personal note to include with the gift card."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
          Up to 400 characters. We&apos;ll include this in the gift email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            Send On
          </label>
          <input
            type="date"
            value={toDateInputValue(details.sendAt)}
            onChange={(event) => handleSendDateChange(event.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
            Leave blank to send immediately.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            Your Email (for receipt)
          </label>
          <input
            type="email"
            value={details.purchaserEmail || ''}
            onChange={(event) => updateField('purchaserEmail', event.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
          />
        </div>
      </div>
    </Card>
  )
}

