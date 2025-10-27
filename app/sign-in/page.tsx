'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { validateEmail } from '@/lib/security';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SocialLoginButtons from '@/components/ui/SocialLoginButtons';
import { Mail, Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  // Check for password reset success
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setShowResetSuccess(true);
      // Hide message after 10 seconds
      setTimeout(() => setShowResetSuccess(false), 10000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Security: Validate email format before sending to server
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Security: Basic password length check
    if (!password || password.length < 1) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      await signIn.email({
        email: email.toLowerCase().trim(), // Normalize email
        password,
      }, {
        onSuccess: () => {
          // Reset attempt count on success
          setAttemptCount(0);
          router.push('/account');
        },
        onError: (ctx) => {
          // Security: Increment failed attempt count
          const newAttemptCount = attemptCount + 1;
          setAttemptCount(newAttemptCount);
          
          // Security: Generic error message to prevent user enumeration
          setError('Invalid email or password');
          
          // Security: Warn user after multiple failed attempts
          if (newAttemptCount >= 3) {
            setError('Multiple failed login attempts. Please double-check your credentials or reset your password.');
          }
        },
      });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your FiltersFast account
          </p>
        </div>

        {/* Sign In Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Reset Success Message */}
            {showResetSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Password reset successful!</p>
                  <p className="text-sm text-green-800 mt-1">You can now sign in with your new password.</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-brand-orange hover:text-brand-orange-dark transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons mode="signin" />

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/sign-up"
                className="font-medium text-brand-orange hover:text-brand-orange-dark transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure SSL encryption • Your data is safe with us
          </p>
        </div>
      </div>
    </div>
  );
}

