import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getGiftCardByCode } from '@/lib/db/gift-cards'

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  active: 'Active',
  pending: 'Scheduled',
  partially_redeemed: 'Partially Redeemed',
  redeemed: 'Redeemed',
  void: 'Voided',
}

const statusDescriptions: Record<string, string> = {
  active: 'This gift card is ready to use.',
  pending: 'This gift card is scheduled for a future delivery date.',
  partially_redeemed: 'This gift card has been used, but funds remain.',
  redeemed: 'This gift card has been fully redeemed.',
  void: 'This gift card is no longer active.',
}

function normalizeCode(raw: string | string[]): string {
  if (Array.isArray(raw)) {
    return normalizeCode(raw[0])
  }

  return decodeURIComponent(raw).trim().toUpperCase()
}

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const [local, domain] = email.split('@')
  if (!domain) return email
  const maskedLocal = local.length <= 2
    ? `${local[0] ?? ''}*`
    : `${local.slice(0, 2)}***`
  return `${maskedLocal}@${domain}`
}

export async function generateMetadata({ params }: { params: { code: string } }) {
  const code = normalizeCode(params.code)
  if (!code) {
    return {
      title: 'Gift Card Lookup',
      description: 'Check the balance of your FiltersFast digital gift card.',
    }
  }

  const giftCard = getGiftCardByCode(code)
  if (!giftCard) {
    return {
      title: 'Gift Card Not Found',
      description: 'We couldn’t find a gift card with that code.',
    }
  }

  return {
    title: `Gift Card ${giftCard.code}`,
    description: `Balance: ${formatCurrency(giftCard.balance, giftCard.currency)} (${statusLabels[giftCard.status] || giftCard.status})`,
  }
}

export default function GiftCardDetailPage({ params }: { params: { code: string } }) {
  const code = normalizeCode(params.code)
  if (!code) {
    notFound()
  }

  const giftCard = getGiftCardByCode(code)
  if (!giftCard) {
    notFound()
  }

  const statusLabel = statusLabels[giftCard.status] || giftCard.status
  const statusDescription = statusDescriptions[giftCard.status] || 'Status information unavailable.'
  const formattedBalance = formatCurrency(giftCard.balance, giftCard.currency)
  const issuedOn = giftCard.issued_at ? new Date(giftCard.issued_at).toLocaleDateString() : null
  const scheduledSend = giftCard.send_at ? new Date(giftCard.send_at).toLocaleDateString() : null
  const lastRedeemed = giftCard.last_redeemed_at ? new Date(giftCard.last_redeemed_at).toLocaleDateString() : null
  const maskedRecipientEmail = maskEmail(giftCard.recipient_email)
  const maskedPurchaserEmail = maskEmail(giftCard.purchaser_email)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="container-custom max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
            Digital Gift Card
          </h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">
            Redeem this code at checkout or share it with the intended recipient. Gift cards never expire.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
              Gift Card Code
            </span>
            <p className="text-2xl font-mono font-semibold tracking-[0.35em] text-gray-900 dark:text-gray-100 transition-colors">
              {giftCard.code}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 transition-colors">
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-gray-700 dark:text-gray-300 transition-colors">
                {statusLabel}
              </span>
              <span>{statusDescription}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors">
                Current Balance
              </span>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 transition-colors">
                {formattedBalance}
              </p>
              {giftCard.initial_value !== giftCard.balance && (
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                  Issued for {formatCurrency(giftCard.initial_value, giftCard.currency)}
                </p>
              )}
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 transition-colors">
              {giftCard.recipient_name && (
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors">Recipient:</span>{' '}
                  {giftCard.recipient_name}{maskedRecipientEmail ? ` (${maskedRecipientEmail})` : ''}
                </p>
              )}
              {!giftCard.recipient_name && maskedRecipientEmail && (
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors">Recipient:</span>{' '}
                  {maskedRecipientEmail}
                </p>
              )}
              {giftCard.purchaser_name && (
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors">Purchased by:</span>{' '}
                  {giftCard.purchaser_name}{maskedPurchaserEmail ? ` (${maskedPurchaserEmail})` : ''}
                </p>
              )}
              {issuedOn && (
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors">Issued on:</span>{' '}
                  {issuedOn}
                </p>
              )}
              {scheduledSend && (
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors">Scheduled delivery:</span>{' '}
                  {scheduledSend}
                </p>
              )}
              {lastRedeemed && (
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors">Last redeemed:</span>{' '}
                  {lastRedeemed}
                </p>
              )}
            </div>
          </div>

          {giftCard.message && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 transition-colors mb-2">
                Personal Message
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200 whitespace-pre-line transition-colors">
                {giftCard.message}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/checkout">
                Redeem at Checkout
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/gift-cards">
                Check Another Gift Card
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
            How to Redeem
          </h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 transition-colors">
            <li>Add FiltersFast products to your cart and proceed to checkout.</li>
            <li>Enter the gift card code in the payment step under “Apply Gift Card”.</li>
            <li>If your order total is less than the gift card value, the remaining balance stays on this code.</li>
          </ol>
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
            Need help? Contact{' '}
            <a href="mailto:support@filtersfast.com" className="text-brand-orange hover:text-orange-600 transition-colors">
              support@filtersfast.com
            </a>{' '}
            or call 1-866-438-3458.
          </p>
        </Card>
      </div>
    </div>
  )
}

