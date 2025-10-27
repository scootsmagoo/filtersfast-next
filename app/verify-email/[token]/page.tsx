'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Verify email on mount
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setSuccess(true);
          // Redirect to account after 3 seconds
          setTimeout(() => {
            router.push('/account?email-verified=true');
          }, 3000);
        } else {
          setError(data.message || 'Failed to verify email. The link may have expired.');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setVerifying(false);
      }
    };
    
    verifyEmail();
  }, [token, router]);

  // Verifying state
  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 animate-spin text-brand-orange mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying your email...
          </h1>
          <p className="text-gray-600">
            Please wait while we confirm your email address
          </p>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your email address has been successfully verified. 
              You now have full access to your account.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✅ You can now:
              </p>
              <ul className="text-sm text-green-800 mt-2 space-y-1 text-left list-disc list-inside">
                <li>Place orders and track shipments</li>
                <li>Save addresses and payment methods</li>
                <li>Join Home Filter Club subscriptions</li>
                <li>Receive important account notifications</li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to your account in 3 seconds...
            </p>
            
            <Link href="/account">
              <Button className="w-full flex items-center justify-center gap-2">
                Go to Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Failed
          </h1>
          
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-yellow-900 mb-2">
              Common reasons:
            </p>
            <ul className="text-sm text-yellow-800 text-left list-disc list-inside space-y-1">
              <li>The link has expired (valid for 24 hours)</li>
              <li>The link has already been used</li>
              <li>Too many verification attempts</li>
              <li>The link is invalid or corrupted</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Link href="/account">
              <Button className="w-full">
                Request New Verification Email
              </Button>
            </Link>
            
            <Link href="/sign-in" className="block text-center text-sm text-gray-600 hover:text-gray-900">
              Return to sign in
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

