'use client';

import { useState } from 'react';
import { Shield, AlertCircle, Key } from 'lucide-react';

interface MFAVerificationProps {
  email: string;
  onSuccess: (deviceToken?: string) => void;
  onCancel?: () => void;
}

export default function MFAVerification({ email, onSuccess, onCancel }: MFAVerificationProps) {
  const [method, setMethod] = useState<'totp' | 'backup'>('totp');
  const [token, setToken] = useState<string>('');
  const [backupCode, setBackupCode] = useState<string>('');
  const [trustDevice, setTrustDevice] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function verifyTOTP() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, trustDevice }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store device token if provided
      if (data.deviceToken) {
        localStorage.setItem('mfa_device_token', data.deviceToken);
      }

      onSuccess(data.deviceToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyBackup() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/mfa/verify-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: backupCode, trustDevice }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store device token if provided
      if (data.deviceToken) {
        localStorage.setItem('mfa_device_token', data.deviceToken);
      }

      onSuccess(data.deviceToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (method === 'totp') {
      verifyTOTP();
    } else {
      verifyBackup();
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-600">
              Verification required
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Method Toggle */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMethod('totp')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                method === 'totp'
                  ? 'bg-white text-brand-orange shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={method === 'totp'}
            >
              <Shield className="w-4 h-4 inline mr-2" aria-hidden="true" />
              Authenticator App
            </button>
            <button
              type="button"
              onClick={() => setMethod('backup')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                method === 'backup'
                  ? 'bg-white text-brand-orange shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={method === 'backup'}
            >
              <Key className="w-4 h-4 inline mr-2" aria-hidden="true" />
              Backup Code
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TOTP Input */}
          {method === 'totp' && (
            <div className="mb-6">
              <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 mb-2">
                Enter the 6-digit code from your authenticator app
              </label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-mono text-center tracking-widest focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                aria-label="Enter 6-digit verification code"
                autoFocus
                required
              />
            </div>
          )}

          {/* Backup Code Input */}
          {method === 'backup' && (
            <div className="mb-6">
              <label htmlFor="backup-code" className="block text-sm font-medium text-gray-700 mb-2">
                Enter one of your backup codes
              </label>
              <input
                id="backup-code"
                type="text"
                maxLength={8}
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="XXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-xl font-mono text-center tracking-widest focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                aria-label="Enter 8-character backup code"
                autoFocus
                required
              />
              <p className="mt-2 text-xs text-gray-600">
                Each backup code can only be used once
              </p>
            </div>
          )}

          {/* Trust Device Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="mt-1 w-4 h-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
                aria-describedby="trust-device-description"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Trust this device</span>
                <p id="trust-device-description" className="text-xs text-gray-600">
                  Don't ask for codes on this device for 30 days
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading || (method === 'totp' ? token.length !== 6 : backupCode.length !== 8)}
              className="w-full px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            {method === 'totp' ? (
              <>Lost your authenticator? Use a backup code instead.</>
            ) : (
              <>Lost your backup codes? Contact support for help.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

