'use client'

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AutoDeliveryPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session?.user) {
      // If logged in, go to their subscription management
      router.push('/account/subscriptions');
    } else {
      // If not logged in, go to sign-up with redirect to subscriptions
      router.push('/sign-up?redirect=/account/subscriptions');
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white">
        <div className="container-custom py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Home Filter Club</h1>
            <p className="text-xl mb-6">Never Forget to Change Your Filters Again</p>
            <p className="text-lg opacity-90">Subscribe and save up to 10% with FREE shipping on every order</p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">Save Up to 10%</h3>
            <p className="text-brand-gray-600">Automatic discount applied to every subscription order</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">FREE Shipping</h3>
            <p className="text-brand-gray-600">Get free shipping on every subscription order, no minimum</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">Flexible Schedule</h3>
            <p className="text-brand-gray-600">Choose your delivery frequency: every 30, 60, 90, or 180 days</p>
          </Card>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center text-brand-gray-900 mb-8">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">Choose Your Filter</h3>
                <p className="text-brand-gray-600">Browse our selection and select the filters you need for your home</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">Set Your Schedule</h3>
                <p className="text-brand-gray-600">Pick how often you want your filters delivered - every 1, 2, 3, or 6 months</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-2">Relax & Save</h3>
                <p className="text-brand-gray-600">We'll automatically send your filters on your schedule. Modify or cancel anytime!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center text-brand-gray-900 mb-8">Subscription Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 border-2 border-brand-gray-200">
              <h3 className="text-2xl font-bold text-brand-gray-900 mb-4">Standard Subscription</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-brand-orange mb-2">5% OFF</div>
                <p className="text-brand-gray-600">Applied to every order automatically</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-brand-gray-700">FREE shipping on all orders</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-brand-gray-700">Flexible delivery schedule</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-brand-gray-700">Cancel or modify anytime</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                {session?.user ? 'Manage Subscriptions' : 'Get Started'}
              </Button>
            </Card>

            <Card className="p-8 border-2 border-brand-orange bg-brand-orange/5">
              <div className="inline-block bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold text-brand-gray-900 mb-4">Premium Subscription</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-brand-orange mb-2">10% OFF</div>
                <p className="text-brand-gray-600">For 3+ filter subscriptions</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-brand-gray-700">Everything in Standard</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-brand-gray-700">10% savings (vs. 5%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-brand-gray-700">Priority customer support</span>
                </li>
              </ul>
              <Button variant="primary" className="w-full" onClick={handleGetStarted}>
                {session?.user ? 'Manage Subscriptions' : 'Get Started'}
              </Button>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-brand-gray-900 mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-brand-gray-600">
                Yes! You can cancel, pause, or modify your subscription at any time with no penalties or fees.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">What if I need to skip a delivery?</h3>
              <p className="text-brand-gray-600">
                Simply log into your account and skip your next delivery. You can do this as many times as needed.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">Can I change my delivery frequency?</h3>
              <p className="text-brand-gray-600">
                Absolutely! Adjust your delivery schedule anytime to match your needs - monthly, bi-monthly, quarterly, or semi-annually.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">How do I manage my subscription?</h3>
              <p className="text-brand-gray-600">
                Log into your account to view, modify, pause, or cancel your subscriptions. You have full control at all times.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <Card className="p-8 bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Join Home Filter Club?</h2>
            <p className="text-lg mb-6 opacity-90">Start saving today with automatic filter deliveries</p>
            <div className="flex gap-4 justify-center">
              {session?.user ? (
                <Button variant="primary" className="bg-brand-orange hover:bg-brand-orange-dark border-0" onClick={handleGetStarted}>
                  Manage My Subscriptions
                </Button>
              ) : (
                <Button variant="primary" className="bg-brand-orange hover:bg-brand-orange-dark border-0" onClick={handleGetStarted}>
                  Sign Up & Subscribe
                </Button>
              )}
              <Link href="/refrigerator-filters">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Browse Filters
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

