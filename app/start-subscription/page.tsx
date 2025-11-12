import Card from '@/components/ui/Card'
import ActivationForm from '@/components/subscriptions/ActivationForm'
import { ActivationError, getActivationContext } from '@/lib/subscription-activation'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export const metadata = {
  title: 'Activate Home Filter Club | FiltersFast',
}

export const dynamic = 'force-dynamic'

interface StartSubscriptionPageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function StartSubscriptionPage({
  searchParams,
}: StartSubscriptionPageProps) {
  const accessKeyParam = searchParams?.accesskey
  const accessKey = Array.isArray(accessKeyParam)
    ? accessKeyParam[0]
    : accessKeyParam

  if (!accessKey) {
    return (
      <ErrorState
        title="Activation link missing"
        message="We weren’t able to find an activation code in the URL. Please open the subscription email from FiltersFast and follow the link again."
      />
    )
  }

  let context
  try {
    context = await getActivationContext(accessKey)
  } catch (error) {
    if (error instanceof ActivationError) {
      return (
        <ErrorState
          title="We can’t validate this link"
          message={error.message}
        />
      )
    }

    throw error
  }

  const { order, items, paidAt, customerName, securityLevel, warnings } =
    context

  const orderDate = order.created_at
    ? dateFormatter.format(new Date(order.created_at))
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
        <Card className="p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
                Home Filter Club
              </p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Activate Your Subscription Savings
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Thanks for shopping with FiltersFast! Your recent order qualifies
                for Subscribe &amp; Save. Pick how often you’d like each product
                delivered and we’ll lock in your discounts and free shipping.
              </p>
            </div>

            <dl className="grid gap-4 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/60 md:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Order
                </dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {order.order_number}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total
                </dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {currencyFormatter.format(order.total)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Placed
                </dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {orderDate ?? 'Recently'}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <ActivationForm
          accessKey={accessKey}
          items={items}
          orderNumber={order.order_number}
          orderTotal={order.total}
          paidAt={paidAt ? paidAt.toISOString() : null}
          customerName={customerName}
          securityLevel={securityLevel}
          warnings={warnings}
        />
      </div>
    </div>
  )
}

interface ErrorStateProps {
  title: string
  message: string
}

function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-16 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4">
        <Card className="p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Need help? Our team is happy to get you set up at{' '}
            <a
              href="mailto:support@filtersfast.com"
              className="text-brand-orange underline"
            >
              support@filtersfast.com
            </a>{' '}
            or 1-866-438-3458.
          </p>
        </Card>
      </div>
    </div>
  )
}


