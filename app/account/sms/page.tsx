'use client';

/**
 * SMS Preferences Page
 * Allows customers to manage their SMS notification settings
 */

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Bell, BellOff, Settings, Save, Check, 
  AlertCircle, Package, Truck, Home, RefreshCw, Tag, 
  Sparkles, Zap, Clock, Phone
} from 'lucide-react';

interface SMSPreferences {
  // Transactional
  order_confirmation: boolean;
  shipping_updates: boolean;
  delivery_notifications: boolean;
  return_updates: boolean;
  // Marketing
  promotional_offers: boolean;
  new_products: boolean;
  flash_sales: boolean;
  filter_reminders: boolean;
  // Frequency
  max_messages_per_week: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export default function SMSPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferences, setPreferences] = useState<SMSPreferences | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Subscription form state
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/sms/status');
      const data = await response.json();
      
      setSubscribed(data.subscribed);
      setPhoneNumber(data.subscription?.phone_number || '');
      setPreferences(data.subscription?.preferences || null);
    } catch (error) {
      console.error('Error loading SMS status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to unsubscribe from SMS notifications?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/sms/unsubscribe', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Successfully unsubscribed from SMS notifications' });
        setSubscribed(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to unsubscribe' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch('/api/sms/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof SMSPreferences, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Format as (XXX) XXX-XXXX
    let formatted = value;
    if (value.length > 0) {
      if (value.length <= 3) {
        formatted = `(${value}`;
      } else if (value.length <= 6) {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      }
    }
    
    setNewPhoneNumber(formatted);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tcpaConsent) {
      setMessage({ type: 'error', text: 'You must consent to receive SMS messages' });
      return;
    }

    const digits = newPhoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setSubscribing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sms/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: digits,
          tcpa_consent: true,
          transactional_opt_in: true,
          marketing_opt_in: false,
          subscription_source: 'account_settings',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Successfully subscribed to SMS notifications!' });
        // Reload the page to show preferences
        setTimeout(() => {
          loadStatus();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to subscribe' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-900 transition-colors" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" aria-hidden="true" />
          <span className="sr-only">Loading SMS preferences, please wait</span>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors" aria-hidden="true">Loading SMS preferences...</p>
        </div>
      </div>
    );
  }

  if (!subscribed) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
          <div className="text-center mb-8">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors" role="img" aria-label="SMS notification icon">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-colors" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Enable SMS Notifications</h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">
              Get order updates and exclusive offers sent directly to your phone
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div 
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 transition-colors ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}
              role="alert"
              aria-live="assertive"
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          {/* Subscription Form */}
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
            {/* Phone Number Input */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                Mobile Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
                <input
                  type="tel"
                  id="phone"
                  value={newPhoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 transition-colors"
                  required
                  disabled={subscribing}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                We'll send order updates and notifications to this number
              </p>
            </div>

            {/* What You'll Receive */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">What you'll receive:</h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 transition-colors" role="list">
                <li className="flex items-start gap-2" role="listitem">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Order confirmations and shipping updates</span>
                </li>
                <li className="flex items-start gap-2" role="listitem">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Delivery notifications</span>
                </li>
                <li className="flex items-start gap-2" role="listitem">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Return and refund updates</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400 transition-colors">
                Marketing messages are optional and can be enabled later in preferences
              </p>
            </div>

            {/* TCPA Consent */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tcpaConsent}
                  onChange={(e) => setTcpaConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                  disabled={subscribing}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed transition-colors">
                  I agree to receive text messages from FiltersFast. Message & data rates may apply. 
                  Text <strong>STOP</strong> to opt out. Standard message and data rates apply.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={subscribing || !tcpaConsent || newPhoneNumber.replace(/\D/g, '').length !== 10}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              aria-disabled={subscribing || !tcpaConsent || newPhoneNumber.replace(/\D/g, '').length !== 10}
              aria-label={subscribing ? 'Subscribing to SMS notifications' : 'Enable SMS notifications'}
            >
              {subscribing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true" />
                  <span>Subscribing...</span>
                  <span className="sr-only">Please wait, subscribing to SMS notifications</span>
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  Enable SMS Notifications
                </>
              )}
            </button>

            {/* Privacy Notice */}
            <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400 transition-colors">
              Your privacy is important to us. View our{' '}
              <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors">
                Privacy Policy
              </a>
              {' '}and{' '}
              <a href="/terms/sms-terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors">
                SMS Terms
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg transition-colors">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-colors" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">SMS Preferences</h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">Manage your text message notifications</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div 
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 transition-colors ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
          role="alert"
          aria-live="assertive"
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Current Phone Number */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 transition-colors" role="region" aria-labelledby="phone-section">
        <div className="flex items-center justify-between">
          <div>
            <p id="phone-section" className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Subscribed Phone Number</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">{phoneNumber}</p>
          </div>
          <button
            onClick={handleUnsubscribe}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Unsubscribe from SMS notifications"
            aria-disabled={saving}
          >
            <BellOff className="w-4 h-4" aria-hidden="true" />
            Unsubscribe
          </button>
        </div>
      </div>

      {preferences && (
        <>
          {/* Transactional Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors" role="region" aria-labelledby="order-updates-heading">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" aria-hidden="true" />
              <h2 id="order-updates-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Order Updates</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors">
              Receive important updates about your orders
            </p>
            
            <div className="space-y-3" role="group" aria-label="Order update notification preferences">
              <PreferenceToggle
                icon={<Check className="w-4 h-4" />}
                label="Order Confirmations"
                description="Get notified when your order is confirmed"
                checked={preferences.order_confirmation}
                onChange={(checked) => updatePreference('order_confirmation', checked)}
              />
              <PreferenceToggle
                icon={<Truck className="w-4 h-4" />}
                label="Shipping Updates"
                description="Track your package with real-time shipping notifications"
                checked={preferences.shipping_updates}
                onChange={(checked) => updatePreference('shipping_updates', checked)}
              />
              <PreferenceToggle
                icon={<Home className="w-4 h-4" />}
                label="Delivery Notifications"
                description="Know when your package has been delivered"
                checked={preferences.delivery_notifications}
                onChange={(checked) => updatePreference('delivery_notifications', checked)}
              />
              <PreferenceToggle
                icon={<RefreshCw className="w-4 h-4" />}
                label="Return Updates"
                description="Get status updates on returns and refunds"
                checked={preferences.return_updates}
                onChange={(checked) => updatePreference('return_updates', checked)}
              />
            </div>
          </div>

          {/* Marketing Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors" role="region" aria-labelledby="marketing-heading">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" aria-hidden="true" />
              <h2 id="marketing-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Marketing & Promotions</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors">
              Opt in to exclusive deals and product announcements
            </p>
            
            <div className="space-y-3" role="group" aria-label="Marketing notification preferences">
              <PreferenceToggle
                icon={<Tag className="w-4 h-4" />}
                label="Promotional Offers"
                description="Exclusive discounts and special deals"
                checked={preferences.promotional_offers}
                onChange={(checked) => updatePreference('promotional_offers', checked)}
              />
              <PreferenceToggle
                icon={<Sparkles className="w-4 h-4" />}
                label="New Products"
                description="Be the first to know about new filter arrivals"
                checked={preferences.new_products}
                onChange={(checked) => updatePreference('new_products', checked)}
              />
              <PreferenceToggle
                icon={<Zap className="w-4 h-4" />}
                label="Flash Sales"
                description="Limited-time offers and flash sales"
                checked={preferences.flash_sales}
                onChange={(checked) => updatePreference('flash_sales', checked)}
              />
              <PreferenceToggle
                icon={<Clock className="w-4 h-4" />}
                label="Filter Reminders"
                description="Reminders when it's time to replace your filters"
                checked={preferences.filter_reminders}
                onChange={(checked) => updatePreference('filter_reminders', checked)}
              />
            </div>
          </div>

          {/* Frequency Control */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors" role="region" aria-labelledby="frequency-heading">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors" aria-hidden="true" />
              <h2 id="frequency-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Frequency & Quiet Hours</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Maximum Messages Per Week
                </label>
                <select
                  value={preferences.max_messages_per_week}
                  onChange={(e) => updatePreference('max_messages_per_week', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Maximum marketing messages per week"
                  id="max-messages-select"
                >
                  <option value={1}>1 message</option>
                  <option value={2}>2 messages</option>
                  <option value={3}>3 messages</option>
                  <option value={5}>5 messages</option>
                  <option value={10}>10 messages</option>
                  <option value={999}>Unlimited</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  Order updates are not affected by this limit
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quiet-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Quiet Hours Start
                  </label>
                  <input
                    type="time"
                    id="quiet-start"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    aria-label="Quiet hours start time"
                  />
                </div>
                <div>
                  <label htmlFor="quiet-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Quiet Hours End
                  </label>
                  <input
                    type="time"
                    id="quiet-end"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    aria-label="Quiet hours end time"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                No marketing messages will be sent during quiet hours (urgent order updates may still be sent)
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              aria-disabled={saving}
              aria-label={saving ? 'Saving preferences' : 'Save SMS preferences'}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true" />
                  <span>Saving...</span>
                  <span className="sr-only">Saving preferences, please wait</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" aria-hidden="true" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Helper Component
function PreferenceToggle({ 
  icon, 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  icon: React.ReactNode; 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  const id = `pref-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <label htmlFor={id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label={`${label}: ${description}`}
          aria-checked={checked}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 transition-colors" aria-hidden="true">{icon}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">{label}</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 transition-colors">{description}</p>
      </div>
    </label>
  );
}

