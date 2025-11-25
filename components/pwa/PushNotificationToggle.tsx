'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
} from '@/lib/pwa-utils';

interface PushNotificationToggleProps {
  userId?: string;
}

export default function PushNotificationToggle({ userId }: PushNotificationToggleProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(getNotificationPermission());
      checkSubscription();
    }
  }, [userId]);

  const checkSubscription = async () => {
    try {
      const subscription = await getPushSubscription();
      if (subscription && userId) {
        // Check with server if subscription is active (don't expose userId in URL)
        const response = await fetch('/api/push-notifications/check', {
          credentials: 'include', // Include session cookie
        });
        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.subscribed || false);
        }
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleToggle = async () => {
    if (!isSupported || !userId) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        await unsubscribeFromPushNotifications();
        await fetch('/api/push-notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        setIsSubscribed(false);
      } else {
        // Request permission and subscribe
        const permissionResult = await requestNotificationPermission();
        setPermission(permissionResult);

        if (permissionResult === 'granted') {
          // Get VAPID public key from server
          const keyResponse = await fetch('/api/push-notifications/key');
          if (!keyResponse.ok) {
            throw new Error('Failed to get VAPID key');
          }

          const { publicKey } = await keyResponse.json();
          const subscription = await subscribeToPushNotifications(publicKey);

          if (subscription) {
            // Send subscription to server
            const subscribeResponse = await fetch('/api/push-notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                subscription: subscription.toJSON(),
              }),
            });

            if (subscribeResponse.ok) {
              setIsSubscribed(true);
            } else {
              // If server subscription fails, unsubscribe from push
              await unsubscribeFromPushNotifications();
              throw new Error('Failed to subscribe on server');
            }
          }
        } else {
          setErrorMessage('Notification permission denied. Please enable notifications in your browser settings.');
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      setErrorMessage('Failed to update notification settings. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggle}
        disabled={isLoading || permission === 'denied'}
        className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
        aria-label={isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <span className="animate-spin" aria-hidden="true">⏳</span>
            <span>Loading...</span>
          </>
        ) : isSubscribed ? (
          <>
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span>Push Notifications On</span>
          </>
        ) : (
          <>
            <BellOff className="w-5 h-5" aria-hidden="true" />
            <span>Push Notifications Off</span>
          </>
        )}
      </button>
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </div>
      )}
      {isLoading && (
        <div className="sr-only" aria-live="polite">
          {isSubscribed ? 'Unsubscribing from push notifications...' : 'Subscribing to push notifications...'}
        </div>
      )}
    </div>
  );
}

