'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { User, Mail, ShoppingBag, Heart, Settings, LogOut, Loader2, AlertCircle, CheckCircle, Send, Package, RefreshCw, CreditCard, Shield, MessageSquare, Gift, TrendingUp } from 'lucide-react';
import SavedModels from '@/components/models/SavedModels';
import QuickReorder from '@/components/orders/QuickReorder';
import { isAdmin } from '@/lib/auth-admin';

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showVerifyEmailPrompt, setShowVerifyEmailPrompt] = useState(false);
  const [showEmailVerified, setShowEmailVerified] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  // Check for URL parameters
  useEffect(() => {
    if (searchParams.get('verify-email') === 'true') {
      setShowVerifyEmailPrompt(true);
    }
    if (searchParams.get('email-verified') === 'true') {
      setShowEmailVerified(true);
      setTimeout(() => setShowEmailVerified(false), 10000);
    }
  }, [searchParams]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!session?.user.email) return;
    
    setSendingVerification(true);
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setVerificationSent(true);
        setShowVerifyEmailPrompt(false);
        setTimeout(() => setVerificationSent(false), 5000);
      } else {
        alert(data.message || 'Failed to send verification email');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Cart will automatically switch to anonymous cart when session ends
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/');
          },
        },
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Welcome back, {user.name || 'there'}!
          </p>
        </div>

        {/* Email Verified Success Banner */}
        {showEmailVerified && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">Email verified successfully!</p>
              <p className="text-sm text-green-800 mt-1">
                Your email address has been confirmed. You now have full access to all features.
              </p>
            </div>
          </div>
        )}

        {/* Verification Sent Banner */}
        {verificationSent && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Verification email sent!</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Check your inbox for the verification link. The link expires in 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* Verify Email Prompt Banner */}
        {showVerifyEmailPrompt && !verificationSent && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Please verify your email address
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                  We've sent a verification email to <strong>{user.email}</strong>. 
                  Click the link in the email to verify your account and unlock all features.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                    className="flex items-center gap-2"
                  >
                    {sendingVerification ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  <button
                    onClick={() => setShowVerifyEmailPrompt(false)}
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-brand-orange text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {user.name || 'User'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{user.email}</p>
              </div>

              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg bg-brand-orange/10 text-brand-orange font-medium">
                  <User className="w-5 h-5" />
                  Profile
                </button>
                <Link href="/account/orders" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <ShoppingBag className="w-5 h-5" />
                  Orders
                </Link>
                <Link href="/account/models" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Package className="w-5 h-5" />
                  My Models
                </Link>
                <Link href="/account/subscriptions" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <RefreshCw className="w-5 h-5" />
                  Subscriptions
                </Link>
                <Link href="/account/payment-methods" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </Link>
                <Link href="/account/sms" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <MessageSquare className="w-5 h-5" />
                  SMS Preferences
                </Link>
                <Link href="/account/referrals" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Gift className="w-5 h-5" />
                  Referral Program
                </Link>
                <Link href="/affiliate" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <TrendingUp className="w-5 h-5" />
                  Become an Affiliate
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Heart className="w-5 h-5" />
                  Favorites
                </button>
                <Link href="/account/settings" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                
                {/* Admin Portal Link - Only shown for admin users */}
                {isAdmin(user.email) && (
                  <>
                    <hr className="my-4" />
                    <Link href="/admin" className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-purple-50 transition-colors text-purple-600 font-medium border border-purple-200 bg-purple-50/50">
                      <Shield className="w-5 h-5" />
                      Admin Portal
                    </Link>
                  </>
                )}
                
                <hr className="my-4" />
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5" />
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Account Information
                </h2>
                <Link href="/account/settings">
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.name || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Recent Orders
                </h2>
                <Link href="/account/orders">
                  <Button variant="secondary" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {/* Order 1 */}
                <Link href="/account/orders/1" className="block">
                  <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-orange hover:shadow-md transition-all">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors">
                        <ShoppingBag className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Order #FF-2025-001</p>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 transition-colors">Delivered</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">January 15, 2025 • 2 items</p>
                      <p className="text-sm font-medium text-brand-orange mt-1">$89.99</p>
                    </div>
                  </div>
                </Link>

                {/* Order 2 */}
                <Link href="/account/orders/2" className="block">
                  <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-orange hover:shadow-md transition-all">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center transition-colors">
                        <ShoppingBag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Order #FF-2025-002</p>
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 transition-colors">Shipped</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">January 20, 2025 • 4 items</p>
                      <p className="text-sm font-medium text-brand-orange mt-1">$159.98</p>
                    </div>
                  </div>
                </Link>

                {/* Order 3 */}
                <Link href="/account/orders/3" className="block">
                  <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-orange hover:shadow-md transition-all">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                        <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Order #FF-2025-003</p>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors">Processing</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">January 22, 2025 • 1 item</p>
                      <p className="text-sm font-medium text-brand-orange mt-1">$49.99</p>
                    </div>
                  </div>
                </Link>
              </div>
            </Card>

            {/* Quick Reorder */}
            <QuickReorder />

            {/* Saved Models */}
            <SavedModels />

            {/* Saved Addresses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  Saved Addresses
                </h2>
                <Button variant="secondary" size="sm">
                  Add Address
                </Button>
              </div>
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 transition-colors">No saved addresses</p>
              </div>
            </Card>

            {/* Subscription */}
            <Card className="p-6 bg-gradient-to-br from-brand-orange/10 to-brand-blue/10 dark:from-brand-orange/20 dark:to-brand-blue/20 border-brand-orange/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                    🎯 Home Filter Club
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 transition-colors">
                    Save 5% and never forget to change your filters
                  </p>
                </div>
              </div>
              <Link href="/auto-delivery">
                <Button className="mt-4">
                  Learn More
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div><p className="mt-4 text-gray-600">Loading...</p></div></div>}>
      <AccountPageContent />
    </Suspense>
  );
}

