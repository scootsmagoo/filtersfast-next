'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { validateEmail } from '@/lib/security';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { RecaptchaAction } from '@/lib/recaptcha';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SocialLoginButtons from '@/components/ui/SocialLoginButtons';
import MFAVerification from '@/components/mfa/MFAVerification';
import { Mail, Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { executeRecaptcha, isReady: recaptchaReady } = useRecaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

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
      // Execute reCAPTCHA verification
      let recaptchaToken = '';
      const isProduction = process.env.NODE_ENV === 'production';
      
      try {
        recaptchaToken = await executeRecaptcha(RecaptchaAction.SIGN_IN);
      } catch (recaptchaError) {
        console.warn('reCAPTCHA execution failed:', recaptchaError);
        
        // In production with reCAPTCHA configured, this is a security concern
        if (isProduction && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
          setError('Security verification failed. Please refresh the page and try again.');
          setLoading(false);
          return;
        }
        // In development or if reCAPTCHA not configured, allow login
      }

      // Verify reCAPTCHA token on server if we have one
      if (recaptchaToken) {
        try {
          const verifyResponse = await fetch('/api/recaptcha/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: recaptchaToken,
              action: RecaptchaAction.SIGN_IN,
            }),
          });

          const verifyResult = await verifyResponse.json();
          if (!verifyResult.success) {
            console.warn('reCAPTCHA verification failed:', verifyResult.message);
            
            // In production, block suspicious activity
            if (isProduction) {
              setError('Security verification failed. Please try again.');
              setLoading(false);
              return;
            }
            // In development, allow it
          }
        } catch (verifyError) {
          console.warn('reCAPTCHA verification error:', verifyError);
          
          // In production, be safe and block
          if (isProduction) {
            setError('Security verification failed. Please try again.');
            setLoading(false);
            return;
          }
        }
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user has MFA enabled
      const mfaCheckResponse = await fetch('/api/mfa/check-required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      
      let userHasMFA = false;
      if (mfaCheckResponse.ok) {
        const mfaCheck = await mfaCheckResponse.json();
        userHasMFA = mfaCheck.required;
      }
      
      // Check if there's a trusted device token
      const deviceToken = localStorage.getItem('mfa_device_token');
      let deviceTrusted = false;
      
      if (userHasMFA && deviceToken) {
        // Check if device is still trusted
        const deviceCheckResponse = await fetch('/api/mfa/check-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, deviceToken }),
        });
        
        if (deviceCheckResponse.ok) {
          const deviceCheck = await deviceCheckResponse.json();
          deviceTrusted = deviceCheck.trusted;
        }
      }
      
      // If user has MFA and device is not trusted, we need MFA verification BEFORE sign-in
      if (userHasMFA && !deviceTrusted) {
        // Store credentials temporarily to complete sign-in after MFA
        setPendingEmail(normalizedEmail);
        setRequiresMFA(true);
        setAttemptCount(0);
        setLoading(false); // Stop loading, show MFA screen
        return;
      }
      
      // Otherwise, proceed with normal sign-in
      await signIn.email({
        email: normalizedEmail,
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
  
  const handleMFASuccess = async (deviceToken?: string) => {
    // Store device token if provided
    if (deviceToken) {
      localStorage.setItem('mfa_device_token', deviceToken);
    }
    
    // Now complete the sign-in
    try {
      await signIn.email({
        email: pendingEmail,
        password,
      }, {
        onSuccess: () => {
          router.push('/account');
        },
        onError: () => {
          setError('Authentication failed. Please try again.');
          setRequiresMFA(false);
        },
      });
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setRequiresMFA(false);
    }
  };
  
  const handleMFACancel = () => {
    setRequiresMFA(false);
    setPendingEmail('');
    setPassword('');
  };

  // If MFA is required, show MFA verification screen
  if (requiresMFA) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-md w-full">
          <MFAVerification
            email={pendingEmail}
            onSuccess={handleMFASuccess}
            onCancel={handleMFACancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors">
            Sign in to your FiltersFast account
          </p>
        </div>

        {/* Sign In Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Reset Success Message */}
            {showResetSuccess && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3 transition-colors">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Password reset successful!</p>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">You can now sign in with your new password.</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div 
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 transition-colors"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  {error.includes('Security verification') && (
                    <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                      <strong>Suggestion:</strong> Try refreshing the page and signing in again. If the problem persists, please contact support.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-hidden="true" />
                  )}
                </button>
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
              aria-busy={loading}
              aria-live="polite"
              aria-label={loading ? 'Signing you in, please wait' : 'Sign in to your account'}
            >
              {loading ? (
                <>
                  <span className="sr-only">Signing you in, please wait</span>
                  <span aria-hidden="true">Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons mode="signin" />

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
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
        <div className="text-center space-y-2" role="contentinfo" aria-label="Security and privacy information">
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
            <span role="img" aria-label="Lock icon">🔒</span> Secure SSL encryption • Your data is safe with us
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 transition-colors">
            Protected by reCAPTCHA • <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-orange dark:hover:text-brand-orange transition-colors">Privacy Policy</a> • <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-orange dark:hover:text-brand-orange transition-colors">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  );
}

