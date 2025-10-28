'use client';

import { useState } from 'react';
import { Shield, Copy, Check, Download, AlertCircle } from 'lucide-react';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'loading' | 'qr' | 'verify' | 'backup'>('loading');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [secretCopied, setSecretCopied] = useState<boolean>(false);
  const [codesCopied, setCodesCopied] = useState<boolean>(false);

  // Initialize MFA setup
  useState(() => {
    initializeSetup();
  });

  async function initializeSetup() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize MFA setup');
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('qr');
    } catch (err: any) {
      setError(err.message);
      setStep('qr'); // Show error state
    } finally {
      setLoading(false);
    }
  }

  async function verifyToken() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/mfa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setBackupCodes(data.backupCodes);
      setStep('backup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 2000);
  }

  function downloadBackupCodes() {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtersfast-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleComplete() {
    if (onComplete) {
      onComplete();
    }
  }

  // Step 1: QR Code Display
  if (step === 'qr') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Set Up Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-600">
                Step 1 of 3: Scan QR Code
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

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Install an authenticator app on your phone (Google Authenticator, Authy, 1Password, etc.)</li>
              <li>Open the app and scan the QR code below</li>
              <li>Or manually enter the secret key if you can't scan</li>
              <li>Click "Continue" when ready to verify</li>
            </ol>
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="mb-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                <img 
                  src={qrCode} 
                  alt="QR code for two-factor authentication setup"
                  className="w-64 h-64"
                />
              </div>
            </div>
          )}

          {/* Secret Key */}
          {secret && (
            <div className="mb-6">
              <label htmlFor="secret-key" className="block text-sm font-medium text-gray-700 mb-2">
                Or enter this key manually:
              </label>
              <div className="flex gap-2">
                <input
                  id="secret-key"
                  type="text"
                  value={secret}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  aria-label="Secret key for manual entry"
                />
                <button
                  onClick={copySecret}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label={secretCopied ? 'Secret key copied' : 'Copy secret key'}
                >
                  {secretCopied ? (
                    <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('verify')}
              disabled={loading || !qrCode}
              className="flex-1 px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Verification
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Verify Token
  if (step === 'verify') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Verify Your Setup
              </h2>
              <p className="text-sm text-gray-600">
                Step 2 of 3: Enter Verification Code
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

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Enter the 6-digit code from your authenticator app to verify the setup.
            </p>
          </div>

          {/* Token Input */}
          <div className="mb-6">
            <label htmlFor="verify-token" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="verify-token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-mono text-center tracking-widest"
              aria-label="Enter 6-digit verification code"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('qr')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={verifyToken}
              disabled={loading || token.length !== 6}
              className="flex-1 px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Enable MFA'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Backup Codes
  if (step === 'backup') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                MFA Enabled Successfully!
              </h2>
              <p className="text-sm text-gray-600">
                Step 3 of 3: Save Your Backup Codes
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
              Important: Save These Backup Codes
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>Each code can only be used once</li>
              <li>Use these if you lose access to your authenticator app</li>
              <li>Store them in a secure location</li>
              <li>You can regenerate new codes anytime in settings</li>
            </ul>
          </div>

          {/* Backup Codes */}
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="px-3 py-2 bg-white border border-gray-200 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={copyBackupCodes}
              className="flex-1 px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              aria-label={codesCopied ? 'Backup codes copied' : 'Copy backup codes'}
            >
              {codesCopied ? (
                <>
                  <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" aria-hidden="true" />
                  Copy Codes
                </>
              )}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex-1 px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              aria-label="Download backup codes"
            >
              <Download className="w-5 h-5" aria-hidden="true" />
              Download Codes
            </button>
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            className="w-full px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange border-t-transparent" role="status">
            <span className="sr-only">Loading MFA setup...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

