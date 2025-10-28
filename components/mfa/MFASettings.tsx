'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Key, Smartphone, AlertCircle, Trash2, Download, Copy, Check } from 'lucide-react';
import MFASetup from './MFASetup';

interface MFAStatus {
  enabled: boolean;
  createdAt?: number;
  verifiedAt?: number;
  backupCodes?: {
    total: number;
    remaining: number;
    used: number;
  };
}

interface TrustedDevice {
  id: string;
  deviceName: string;
  ipAddress?: string;
  lastUsedAt?: number;
  createdAt: number;
  expiresAt: number;
}

export default function MFASettings() {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [showDisable, setShowDisable] = useState<boolean>(false);
  const [showRegenerateBackup, setShowRegenerateBackup] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMFAStatus();
    loadTrustedDevices();
  }, []);

  async function loadMFAStatus() {
    try {
      setLoading(true);
      const res = await fetch('/api/mfa/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load MFA status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrustedDevices() {
    try {
      const res = await fetch('/api/mfa/trusted-devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices);
      }
    } catch (err) {
      console.error('Failed to load trusted devices:', err);
    }
  }

  async function removeDevice(deviceId: string) {
    if (!confirm('Are you sure you want to remove this trusted device?')) {
      return;
    }

    try {
      const res = await fetch(`/api/mfa/trusted-devices/${deviceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDevices(devices.filter(d => d.id !== deviceId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove device');
      }
    } catch (err) {
      alert('Failed to remove device');
    }
  }

  function handleSetupComplete() {
    setShowSetup(false);
    loadMFAStatus();
    loadTrustedDevices();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange border-t-transparent" role="status">
          <span className="sr-only">Loading MFA settings...</span>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return <MFASetup onComplete={handleSetupComplete} onCancel={() => setShowSetup(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* MFA Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              status?.enabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Shield className={`w-6 h-6 ${status?.enabled ? 'text-green-600' : 'text-gray-400'}`} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-600">
                {status?.enabled ? 'MFA is enabled' : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status?.enabled ? (
              <CheckCircle className="w-6 h-6 text-green-600" aria-label="Enabled" />
            ) : (
              <XCircle className="w-6 h-6 text-gray-400" aria-label="Disabled" />
            )}
          </div>
        </div>

        {!status?.enabled ? (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Why enable two-factor authentication?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>Protect your account even if your password is compromised</li>
                <li>Prevent unauthorized access to your orders and payment methods</li>
                <li>Required security measure for high-value accounts</li>
                <li>Easy setup with any authenticator app</li>
              </ul>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="w-full px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Enable Two-Factor Authentication
            </button>
          </>
        ) : (
          <>
            {status.createdAt && (
              <div className="mb-4 text-sm text-gray-600">
                Enabled on {new Date(status.createdAt).toLocaleDateString()}
              </div>
            )}
            <button
              onClick={() => setShowDisable(true)}
              className="w-full px-6 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold hover:bg-red-100 transition-colors"
            >
              Disable Two-Factor Authentication
            </button>
          </>
        )}
      </div>

      {/* Backup Codes Card */}
      {status?.enabled && status.backupCodes && (
        <BackupCodesCard
          backupCodes={status.backupCodes}
          onRegenerate={() => {
            setShowRegenerateBackup(true);
          }}
        />
      )}

      {/* Trusted Devices Card */}
      {status?.enabled && (
        <TrustedDevicesCard
          devices={devices}
          onRemove={removeDevice}
        />
      )}

      {/* Disable MFA Modal */}
      {showDisable && (
        <DisableMFAModal
          onClose={() => setShowDisable(false)}
          onSuccess={() => {
            setShowDisable(false);
            loadMFAStatus();
            loadTrustedDevices();
          }}
        />
      )}

      {/* Regenerate Backup Codes Modal */}
      {showRegenerateBackup && (
        <RegenerateBackupCodesModal
          onClose={() => setShowRegenerateBackup(false)}
          onSuccess={() => {
            setShowRegenerateBackup(false);
            loadMFAStatus();
          }}
        />
      )}
    </div>
  );
}

// Backup Codes Card Component
function BackupCodesCard({ backupCodes, onRegenerate }: { 
  backupCodes: { total: number; remaining: number; used: number },
  onRegenerate: () => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Backup Codes</h3>
            <p className="text-sm text-gray-600">For emergency access</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{backupCodes.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{backupCodes.remaining}</div>
          <div className="text-xs text-gray-600">Remaining</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{backupCodes.used}</div>
          <div className="text-xs text-gray-600">Used</div>
        </div>
      </div>

      {backupCodes.remaining < 3 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            Low on backup codes. Generate new ones to ensure you don't lose access.
          </p>
        </div>
      )}

      <button
        onClick={onRegenerate}
        className="w-full px-6 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
      >
        Regenerate Backup Codes
      </button>
    </div>
  );
}

// Trusted Devices Card Component
function TrustedDevicesCard({ devices, onRemove }: {
  devices: TrustedDevice[],
  onRemove: (deviceId: string) => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Trusted Devices</h3>
            <p className="text-sm text-gray-600">Devices that don't require MFA</p>
          </div>
        </div>
      </div>

      {devices.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-8">No trusted devices</p>
      ) : (
        <div className="space-y-3">
          {devices.map(device => (
            <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{device.deviceName}</div>
                <div className="text-sm text-gray-600">
                  {device.ipAddress && <span>IP: {device.ipAddress} • </span>}
                  Last used: {device.lastUsedAt ? new Date(device.lastUsedAt).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-xs text-gray-500">
                  Expires: {new Date(device.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => onRemove(device.id)}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label={`Remove ${device.deviceName}`}
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Disable MFA Modal Component
function DisableMFAModal({ onClose, onSuccess }: {
  onClose: () => void,
  onSuccess: () => void
}) {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDisable() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to disable MFA');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disable-mfa-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 id="disable-mfa-title" className="text-xl font-bold text-gray-900 mb-4">Disable Two-Factor Authentication</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Warning: Disabling MFA will make your account less secure. You'll need to enter your password and current MFA code to proceed.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="disable-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="disable-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              required
            />
          </div>

          <div>
            <label htmlFor="disable-token" className="block text-sm font-medium text-gray-700 mb-1">
              MFA Code
            </label>
            <input
              id="disable-token"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-center tracking-widest focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              required
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDisable}
            disabled={loading || !password || token.length !== 6}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Disabling...' : 'Disable MFA'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Regenerate Backup Codes Modal Component
function RegenerateBackupCodesModal({ onClose, onSuccess }: {
  onClose: () => void,
  onSuccess: () => void
}) {
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleRegenerate() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/mfa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate codes');
      }

      setBackupCodes(data.backupCodes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (backupCodes.length > 0) {
          onSuccess();
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, onSuccess, backupCodes.length]);

  if (backupCodes.length > 0) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
        onClick={() => { onSuccess(); onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-backup-codes-title"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <h3 id="new-backup-codes-title" className="text-xl font-bold text-gray-900 mb-4">New Backup Codes</h3>

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Save these codes in a secure location. Your old codes are no longer valid.
            </p>
          </div>

          <div className="mb-4 bg-gray-50 border border-gray-300 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="px-3 py-2 bg-white border border-gray-200 rounded text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={copyBackupCodes}
              className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download
            </button>
          </div>

          <button
            onClick={() => { onSuccess(); onClose(); }}
            className="w-full px-4 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="regenerate-codes-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 id="regenerate-codes-title" className="text-xl font-bold text-gray-900 mb-4">Regenerate Backup Codes</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            This will invalidate your current backup codes. Make sure you have access to your authenticator app.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="regenerate-token" className="block text-sm font-medium text-gray-700 mb-1">
            Enter your current MFA code
          </label>
          <input
            id="regenerate-token"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-center tracking-widest focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
            autoFocus
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRegenerate}
            disabled={loading || token.length !== 6}
            className="flex-1 px-4 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
      </div>
    </div>
  );
}

