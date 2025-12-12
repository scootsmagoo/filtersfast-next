/**
 * Public Returns Information Page
 * Explains return policy and how to initiate a return
 */

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const metadata = {
  title: 'Returns & Exchanges | FiltersFast',
  description: 'Easy returns with free return shipping. 365-day return window on all eligible items.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Returns & Exchanges
          </h1>
          <p className="text-xl text-blue-100">
            365-Day Returns • Free Return Shipping • No Hassle
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Call to Action */}
        <Card className="p-8 mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 transition-colors">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Need to Return an Order?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 transition-colors">
              Log in to your account to start a return request. It only takes a few minutes!
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/sign-in?redirect=/account/returns">
                <Button variant="primary" className="px-8 py-3">
                  Login to Return an Order
                </Button>
              </Link>
              <Link href="/account/orders">
                <Button variant="outline" className="px-8 py-3">
                  View My Orders
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center transition-colors">
            How Returns Work
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {/* Step 1 */}
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" aria-hidden="true">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Step 1: Login</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                Sign in to your account
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" aria-hidden="true">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Step 2: Select Order</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                Find the order to return
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" aria-hidden="true">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Step 3: Request</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                Fill out return form
              </p>
            </Card>

            {/* Step 4 */}
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" aria-hidden="true">
                4
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Step 4: Ship</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                Use free prepaid label
              </p>
            </Card>

            {/* Step 5 */}
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4" aria-hidden="true">
                ✓
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Step 5: Refund</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                Get your money back
              </p>
            </Card>
          </div>
        </section>

        {/* Return Policy */}
        <section className="mb-12">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
              Our Return Policy
            </h2>
            
            <div className="space-y-6">
              {/* What We Accept */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2 transition-colors">
                  <span className="text-green-600">✓</span>
                  What We Accept
                </h3>
                <ul className="space-y-2 ml-8 text-gray-700 dark:text-gray-300 transition-colors">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Returns within <strong>365 days</strong> of original ship date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Items in original, resalable condition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Unopened or gently used products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Defective or damaged items (with documentation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Wrong item received</span>
                  </li>
                </ul>
              </div>

              {/* What We Don't Accept */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2 transition-colors">
                  <span className="text-red-600">✗</span>
                  What We Don&apos;t Accept
                </h3>
                <ul className="space-y-2 ml-8 text-gray-700 dark:text-gray-300 transition-colors">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Custom air filters</strong> (made-to-order items)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Items damaged during installation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Items damaged due to incorrect installation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Items used beyond normal wear and tear</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Returns after the 365-day window</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Key Benefits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center transition-colors">
            Why Customers Love Our Return Policy
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Free Return Shipping
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                We provide a prepaid return label. No cost to you!
              </p>
            </Card>

            <Card className="p-6">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                365-Day Window
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                A full year to decide if it&apos;s right for you.
              </p>
            </Card>

            <Card className="p-6">
              <div className="text-4xl mb-4">💵</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                No Restocking Fees
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Get a full refund on eligible returns.
              </p>
            </Card>
          </div>
        </section>

        {/* Refund Details */}
        <section className="mb-12">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
              Refund Information
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300 transition-colors">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                  How Long Does It Take?
                </h3>
                <p>
                  Once we receive your return, we&apos;ll inspect the items (typically 1-2 business days) 
                  and process your refund. Refunds are issued to your original payment method and typically 
                  appear within 3-5 business days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                  What Gets Refunded?
                </h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Product cost (full purchase price)</li>
                  <li>Taxes paid on returned items</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                  What Doesn&apos;t Get Refunded?
                </h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Original shipping costs</li>
                  <li>Return shipping (we cover it, but it&apos;s not refunded)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                  Refund Options
                </h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Original Payment Method:</strong> 3-5 business days processing time</li>
                  <li><strong>Store Credit:</strong> Instant credit for faster processing</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Do I need the original packaging?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 transition-colors">
                No, original packaging is not required. However, please pack items securely to 
                prevent damage during shipping. We recommend using a sturdy box with adequate padding.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Can I return part of my order?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 transition-colors">
                Yes! You can return individual items from an order. Just select which items you&apos;d 
                like to return when filling out the return request form.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                What if I received the wrong item?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 transition-colors">
                We sincerely apologize! Please contact us immediately at{' '}
                <a href="mailto:support@filtersfast.com" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                  support@filtersfast.com
                </a>{' '}
                or start a return request. We&apos;ll send a prepaid label and ship the correct item 
                right away.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                What if my item arrived damaged?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 transition-colors">
                If your item arrived damaged, please document the damage with photos and contact us 
                within 7 days of delivery. We&apos;ll arrange for a replacement or full refund immediately.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Can I exchange an item?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 transition-colors">
                Currently, we process returns for refunds only. If you&apos;d like a different product, 
                please return your current item for a refund and place a new order for the item you want.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                How do I track my return?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 transition-colors">
                Once you request a return, you can track its status in your account under{' '}
                <Link href="/account/returns" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                  Returns
                </Link>
                . You&apos;ll also receive email updates at each stage of the process.
              </p>
            </Card>
          </div>
        </section>

        {/* Contact Support */}
        <Card className="p-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 transition-colors">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Still Have Questions?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 transition-colors">
              Our customer support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@filtersfast.com">
                <Button variant="outline">
                  Email Support
                </Button>
              </a>
              <a href="tel:1-800-555-0123">
                <Button variant="outline">
                  Call 1-800-555-0123
                </Button>
              </a>
              <Link href="/support">
                <Button variant="outline">
                  Visit Help Center
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <Link href="/sign-in?redirect=/account/returns">
            <Button variant="primary" className="px-12 py-4 text-lg">
              Start a Return Now
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 transition-colors">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

