'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { useTheme } from '@/lib/theme-provider';
import { sanitizeInput, validateEmail, validateName, validatePassword } from '@/lib/security';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  User, Mail, Lock, Trash2, Save, AlertCircle, CheckCircle, 
  Loader2, Eye, EyeOff, ArrowLeft, ShieldAlert, Bell, Moon, Sun, Monitor
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'profile' | 'password' | 'notifications' | 'appearance' | 'danger';

interface UserPreferences {
  emailNotifications: boolean;
  productReminders: boolean;
  newsletter: boolean;
  smsNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // WCAG: Announce status messages to screen readers
  useEffect(() => {
    if (error) {
      const announcement = document.getElementById('status-announcement');
      if (announcement) {
        announcement.textContent = `Error: ${error}`;
      }
    } else if (success) {
      const announcement = document.getElementById('status-announcement');
      if (announcement) {
        announcement.textContent = `Success: ${success}`;
      }
    }
  }, [error, success]);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Notification preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    productReminders: true,
    newsletter: true,
    smsNotifications: false,
    theme: 'system',
  });
  
  // Delete account
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  // Load user data and preferences
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
      
      // Load user preferences
      loadPreferences();
    }
  }, [session]);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate name
    const nameValidation = validateName(profileData.name);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid name');
      return;
    }
    
    // Validate email
    if (!validateEmail(profileData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sanitizeInput(profileData.name),
          email: profileData.email.toLowerCase().trim(),
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Profile updated successfully!');
        // Refresh session to show new data
        window.location.reload();
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate current password
    if (!passwordData.currentPassword) {
      setError('Please enter your current password');
      return;
    }
    
    // Validate new password
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Invalid password');
      return;
    }
    
    // Check confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    // Check new password is different
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password must be different from current password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Password changed successfully! Please sign in again.');
        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        // Sign out after 2 seconds (password changed, need to re-authenticate)
        setTimeout(async () => {
          await signOut();
          router.push('/sign-in?password-changed=true');
        }, 2000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle notification preferences update
  const handlePreferencesUpdate = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Notification preferences updated successfully!');
      } else {
        setError(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle theme change
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setPreferences({ ...preferences, theme: newTheme });
    
    // Save to database
    try {
      await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (err) {
      console.error('Error saving theme preference:', err);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setError('');
    setSuccess('');
    
    // Verify confirmation text
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Account deleted successfully. Redirecting...');
        // Sign out and redirect after 2 seconds
        setTimeout(async () => {
          await signOut();
          router.push('/?account-deleted=true');
        }, 2000);
      } else {
        setError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const { newPassword } = passwordData;
    if (!newPassword) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      {/* WCAG: Live region for screen reader announcements */}
      <div 
        id="status-announcement" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      />
      
      <div className="container-custom">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Account
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <nav className="space-y-2" aria-label="Settings navigation">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'profile'
                      ? 'bg-brand-orange text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-current={activeTab === 'profile' ? 'page' : undefined}
                  aria-label="Profile settings"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Profile</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('password');
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'password'
                      ? 'bg-brand-orange text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-current={activeTab === 'password' ? 'page' : undefined}
                  aria-label="Password settings"
                >
                  <Lock className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Password</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'notifications'
                      ? 'bg-brand-orange text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-current={activeTab === 'notifications' ? 'page' : undefined}
                  aria-label="Notification preferences"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Notifications</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('appearance');
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'appearance'
                      ? 'bg-brand-orange text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-current={activeTab === 'appearance' ? 'page' : undefined}
                  aria-label="Appearance and theme settings"
                >
                  <Moon className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Appearance</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('danger');
                    setError('');
                    setSuccess('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'danger'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}
                  aria-current={activeTab === 'danger' ? 'page' : undefined}
                  aria-label="Danger zone - Delete account"
                >
                  <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Danger Zone</span>
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="p-8 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Profile Information
                </h2>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Changing your email will require verification
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        // Reset to original values
                        if (session?.user) {
                          setProfileData({
                            name: session.user.name || '',
                            email: session.user.email || '',
                          });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <Card className="p-8 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Change Password
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrength.color} transition-all`}
                              style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {passwordStrength.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Use 8+ characters with uppercase, lowercase, and numbers
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                        )}
                      </button>
                      {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                        <div className="absolute inset-y-0 right-12 pr-3 flex items-center pointer-events-none">
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Forgot Password Link */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Forgot your current password?
                  </p>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brand-orange hover:text-brand-orange-dark font-medium"
                  >
                    Reset your password instead
                  </Link>
                </div>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card className="p-8 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Notification Preferences
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Manage how you receive notifications from FiltersFast
                </p>

                <fieldset className="space-y-6">
                  <legend className="sr-only">Notification preferences</legend>
                  {/* Email Notifications */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="emailNotifications"
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                        className="w-4 h-4 text-brand-orange bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-orange focus:ring-2"
                        aria-describedby="emailNotifications-description"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="emailNotifications" className="font-medium text-gray-900 dark:text-gray-100">
                        Email Notifications
                      </label>
                      <p id="emailNotifications-description" className="text-gray-500 dark:text-gray-400">
                        Receive order confirmations, shipping updates, and important account notifications via email
                      </p>
                    </div>
                  </div>

                  {/* Product Reminders */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="productReminders"
                        type="checkbox"
                        checked={preferences.productReminders}
                        onChange={(e) => setPreferences({ ...preferences, productReminders: e.target.checked })}
                        className="w-4 h-4 text-brand-orange bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-orange focus:ring-2"
                        aria-describedby="productReminders-description"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="productReminders" className="font-medium text-gray-900 dark:text-gray-100">
                        Filter Replacement Reminders
                      </label>
                      <p id="productReminders-description" className="text-gray-500 dark:text-gray-400">
                        Get reminded when it's time to replace your filters based on your purchase history
                      </p>
                    </div>
                  </div>

                  {/* Newsletter */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="newsletter"
                        type="checkbox"
                        checked={preferences.newsletter}
                        onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                        className="w-4 h-4 text-brand-orange bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-orange focus:ring-2"
                        aria-describedby="newsletter-description"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="newsletter" className="font-medium text-gray-900 dark:text-gray-100">
                        FiltersFast Newsletter
                      </label>
                      <p id="newsletter-description" className="text-gray-500 dark:text-gray-400">
                        Stay updated with new products, special offers, and helpful tips
                      </p>
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="smsNotifications"
                        type="checkbox"
                        checked={preferences.smsNotifications}
                        onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })}
                        className="w-4 h-4 text-brand-orange bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-orange focus:ring-2"
                        aria-describedby="smsNotifications-description"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="smsNotifications" className="font-medium text-gray-900 dark:text-gray-100">
                        SMS Notifications
                      </label>
                      <p id="smsNotifications-description" className="text-gray-500 dark:text-gray-400">
                        Receive text message notifications for orders and promotions
                      </p>
                      <Link
                        href="/account/sms"
                        className="text-brand-orange hover:text-brand-orange-dark text-xs mt-1 inline-block"
                      >
                        Manage SMS preferences →
                      </Link>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <Button
                        onClick={handlePreferencesUpdate}
                        disabled={loading}
                        className="flex items-center gap-2"
                        aria-label="Save notification preferences"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" aria-hidden="true" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                      <Link
                        href="/account/newsletter"
                        className="text-sm text-brand-orange hover:text-brand-orange-dark font-medium"
                      >
                        View detailed newsletter preferences →
                      </Link>
                    </div>
                  </div>
                </fieldset>
              </Card>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <Card className="p-8 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Appearance Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Customize how FiltersFast looks on your device
                </p>

                <fieldset className="space-y-4">
                  <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Theme
                  </legend>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="radiogroup" aria-label="Theme selection">
                    {/* Light Theme */}
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-brand-orange'
                      }`}
                      role="radio"
                      aria-checked={theme === 'light'}
                      aria-label="Light theme - Always use light theme"
                    >
                      <Sun className="w-8 h-8 text-yellow-500" aria-hidden="true" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">Light</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Always use light theme
                      </span>
                    </button>

                    {/* Dark Theme */}
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-brand-orange'
                      }`}
                      role="radio"
                      aria-checked={theme === 'dark'}
                      aria-label="Dark theme - Always use dark theme"
                    >
                      <Moon className="w-8 h-8 text-purple-500" aria-hidden="true" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">Dark</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Always use dark theme
                      </span>
                    </button>

                    {/* System Theme */}
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${
                        theme === 'system'
                          ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-brand-orange'
                      }`}
                      role="radio"
                      aria-checked={theme === 'system'}
                      aria-label="System theme - Use system preference"
                    >
                      <Monitor className="w-8 h-8 text-blue-500" aria-hidden="true" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">System</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Use system preference
                      </span>
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg" role="note">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Tip:</strong> Dark mode can help reduce eye strain in low-light environments and may help save battery on devices with OLED screens.
                    </p>
                  </div>
                </fieldset>
              </Card>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <Card className="p-8 border-red-200 dark:border-red-800 dark:bg-gray-800">
                <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">
                  Danger Zone
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Once you delete your account, there is no going back. Please be certain.
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                        ⚠️ Warning: This action cannot be undone
                      </h3>
                      <ul className="text-sm text-red-800 dark:text-red-400 space-y-1 list-disc list-inside">
                        <li>All your data will be permanently deleted</li>
                        <li>Your order history will be removed</li>
                        <li>Active subscriptions will be cancelled</li>
                        <li>You cannot recover your account</li>
                      </ul>
                    </div>

                    <div>
                      <label htmlFor="deleteConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type <strong>DELETE</strong> to confirm
                      </label>
                      <input
                        id="deleteConfirmation"
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        placeholder="Type DELETE"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmation('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={loading || deleteConfirmation !== 'DELETE'}
                        className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Permanently Delete Account
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
