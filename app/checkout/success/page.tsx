'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DonationSummary from '@/components/checkout/DonationSummary';
import SocialShare from '@/components/social/SocialShare';
import { CheckCircle, Package, Mail, Home, Printer, Gift, Share2 } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || searchParams.get('session_id') || 'UNKNOWN';
  const [email, setEmail] = useState('');
  const [donation, setDonation] = useState<{ charityName: string; amount: number } | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Get email from localStorage or session
    const savedEmail = localStorage.getItem('checkout-email');
    if (savedEmail) {
      setEmail(savedEmail);
      localStorage.removeItem('checkout-email');
    }
    
    // Get donation from localStorage
    const savedDonation = localStorage.getItem('checkout-donation');
    if (savedDonation) {
      try {
        setDonation(JSON.parse(savedDonation));
        localStorage.removeItem('checkout-donation');
      } catch (e) {
        console.error('Error parsing donation:', e);
      }
    }

    // Fetch user's referral code if logged in
    const fetchReferralCode = async () => {
      try {
        const response = await fetch('/api/referrals');
        if (response.ok) {
          const data = await response.json();
          if (data.code) {
            setReferralCode(data.code);
          }
        }
      } catch (error) {
        // Silently fail - not critical
        console.log('Could not fetch referral code:', error);
      }
    };

    fetchReferralCode();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            
            <p className="text-lg text-gray-600 mb-4">
              Thank you for your purchase
            </p>
            
            <div className="inline-flex items-center gap-2 bg-gray-100 px-6 py-3 rounded-lg">
              <span className="text-sm text-gray-600">Order Number:</span>
              <span className="text-lg font-bold text-brand-orange">#{orderNumber}</span>
            </div>
          </div>

          {/* Donation Thank You */}
          {donation && (
            <div className="mb-6">
              <DonationSummary 
                charityName={donation.charityName}
                amount={donation.amount}
              />
            </div>
          )}

          {/* Order Details Card */}
          <Card className="p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              What's Next?
            </h2>
            
            <div className="space-y-6">
              {/* Email Confirmation */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-gray-600">
                    We've sent an order confirmation to {email || 'your email address'}. 
                    You'll receive shipping updates as your order progresses.
                  </p>
                </div>
              </div>

              {/* Processing */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-brand-orange" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Order Processing
                  </h3>
                  <p className="text-sm text-gray-600">
                    We're preparing your order for shipment. Most orders ship within 1-2 business days.
                  </p>
                </div>
              </div>

              {/* Tracking */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Track Your Order
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    You'll receive tracking information once your order ships. 
                    Expected delivery: 3-5 business days.
                  </p>
                  <Link 
                    href="/account/orders" 
                    className="text-sm text-brand-orange hover:underline font-medium"
                  >
                    View order status →
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-sm text-brand-orange hover:underline"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">#{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">Credit Card</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Share Section */}
          {referralCode && (
            <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Share & Earn Rewards!</h3>
                  <p className="text-sm text-gray-600">
                    Love your purchase? Share FiltersFast with friends and earn ${' '}
                    <span className="font-semibold">$10 credit</span> for each referral!
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">Your referral code:</p>
                <p className="text-2xl font-bold text-blue-600 font-mono mb-3">{referralCode}</p>
                <SocialShare
                  data={{
                    url: typeof window !== 'undefined' 
                      ? `${window.location.origin}?ref=${referralCode}` 
                      : '',
                    title: 'Check out FiltersFast - Get 10% off your first order!',
                    description: `I just ordered from FiltersFast and love it! Use my code ${referralCode} to get 10% off your first order.`,
                    hashtags: ['FiltersFast', 'Filters', 'HomeImprovement']
                  }}
                  shareType="referral"
                  referralCode={referralCode}
                  variant="buttons"
                  showLabels={true}
                />
              </div>

              <Link 
                href="/account/referrals"
                className="text-sm text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
              >
                View your referral dashboard →
              </Link>
            </Card>
          )}

          {/* Or just general sharing if no referral code */}
          {!referralCode && (
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Love your purchase?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Share FiltersFast with friends and family!
              </p>
              <SocialShare
                data={{
                  url: typeof window !== 'undefined' ? window.location.origin : '',
                  title: 'Check out FiltersFast!',
                  description: 'I just ordered from FiltersFast - great selection and fast shipping!',
                  hashtags: ['FiltersFast', 'Filters']
                }}
                shareType="general"
                variant="icons"
              />
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Continue Shopping
              </Button>
            </Link>
            
            <Link href="/account/orders" className="flex-1">
              <Button className="w-full flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />
                View Order Status
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Need help with your order?
            </p>
            <Link 
              href="/support" 
              className="text-sm text-brand-orange hover:underline font-medium"
            >
              Contact Customer Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
