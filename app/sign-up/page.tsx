'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';
import { sanitizeInput, validateEmail, validatePassword, validateName } from '@/lib/security';
import { logger } from '@/lib/logger';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { RecaptchaAction } from '@/lib/recaptcha';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SocialLoginButtons from '@/components/ui/SocialLoginButtons';
import { Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { executeRecaptcha, isReady: recaptchaReady } = useRecaptcha();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Security: Sanitize name inputs
    const sanitizedValue = (name === 'firstName' || name === 'lastName') ? sanitizeInput(value) : value;
    
    setFormData({
      ...formData,
      [name]: sanitizedValue,
    });
  };

  const validateForm = () => {
    // Validate first name
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.valid) {
      setError('First name: ' + (firstNameValidation.error || 'Invalid'));
      return false;
    }

    // Validate last name
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.valid) {
      setError('Last name: ' + (lastNameValidation.error || 'Invalid'));
      return false;
    }

    // Validate email with strict regex
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Invalid password');
      return false;
    }

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Execute reCAPTCHA verification
      let recaptchaToken = '';
      const isProduction = process.env.NODE_ENV === 'production';
      
      try {
        recaptchaToken = await executeRecaptcha(RecaptchaAction.SIGN_UP);
      } catch (recaptchaError) {
        console.warn('reCAPTCHA execution failed:', recaptchaError);
        
        // In production with reCAPTCHA configured, this is a security concern
        if (isProduction && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
          setError('Security verification failed. Please refresh the page and try again.');
          setLoading(false);
          return;
        }
        // In development or if reCAPTCHA not configured, allow signup
      }

      // Verify reCAPTCHA token on server if we have one
      if (recaptchaToken) {
        try {
          const verifyResponse = await fetch('/api/recaptcha/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: recaptchaToken,
              action: RecaptchaAction.SIGN_UP,
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

      await signUp.email({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
      }, {
        onSuccess: async () => {
          // Send verification email after successful signup
          try {
            const response = await fetch('/api/auth/send-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email }),
            });
            
            if (!response.ok) {
              // Security: Log failure without exposing details to client
              logger.warn('Verification email failed to send', { 
                status: response.status,
                email: formData.email.substring(0, 3) + '***' // Partially masked
              });
            }
          } catch (emailError) {
            // Security: Don't log full error which might contain sensitive info
            logger.error('Verification email error', { type: 'email_send_failed' });
            // Don't block signup if email fails
          }
          
          // Redirect to account with verification prompt
          router.push('/account?verify-email=true');
        },
        onError: (ctx) => {
          setError(ctx.error.message || 'Failed to create account. Please try again.');
        },
      });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors">
            Join FiltersFast and start shopping smarter
          </p>
        </div>

        {/* Sign Up Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                      <strong>Suggestion:</strong> Try refreshing the page and submitting again. If the problem persists, please contact support.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
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
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use 8+ characters with uppercase, numbers, and symbols
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                  title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-hidden="true" />
                  )}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-12 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 border-gray-300 dark:border-gray-600 rounded text-brand-orange focus:ring-brand-orange dark:bg-gray-700"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-600 dark:text-gray-300 transition-colors">
                  I agree to the{' '}
                  <Link href="/terms" className="text-brand-orange hover:text-brand-orange-dark">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand-orange hover:text-brand-orange-dark">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg"
              aria-busy={loading}
              aria-live="polite"
              aria-label={loading ? 'Creating your account, please wait' : 'Create account'}
            >
              {loading ? (
                <>
                  <span className="sr-only">Creating your account, please wait</span>
                  <span aria-hidden="true">Creating account...</span>
                </>
              ) : (
                'Create Account'
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
          <SocialLoginButtons mode="signup" />

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="font-medium text-brand-orange hover:text-brand-orange-dark transition-colors"
              >
                Sign in
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

