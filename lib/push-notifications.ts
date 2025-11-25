import webpush from 'web-push';
import {
  getAllPushSubscriptions,
  getUserPushSubscriptions,
  logPushNotification,
  getPushNotificationPreferences,
} from '@/lib/db/push-notifications';
import { logger } from '@/lib/logger';

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:notifications@filtersfast.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: unknown;
  };
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    logger.error('Error sending push notification:', error);
    
    // If subscription is invalid, we should remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      logger.info('Push subscription expired or invalid, should be removed');
    }
    
    return false;
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload,
  type?: 'order_updates' | 'deals_promotions' | 'abandoned_carts' | 'back_in_stock'
): Promise<number> {
  try {
    // Check user preferences
    if (type) {
      const preferences = getPushNotificationPreferences(userId);
      const preferenceMap: Record<string, keyof typeof preferences> = {
        order_updates: 'order_updates',
        deals_promotions: 'deals_promotions',
        abandoned_carts: 'abandoned_carts',
        back_in_stock: 'back_in_stock',
      };

      const preferenceKey = preferenceMap[type];
      if (preferenceKey && preferences[preferenceKey] === 0) {
        logger.info(`User ${userId} has disabled ${type} notifications`);
        return 0;
      }
    }

    const subscriptions = getUserPushSubscriptions(userId);
    let sentCount = 0;

    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const success = await sendPushNotification(subscription, payload);
      
      if (success) {
        sentCount++;
        logPushNotification(
          userId,
          sub.id,
          payload.title,
          payload.body,
          payload.data,
          'sent'
        );
      } else {
        logPushNotification(
          userId,
          sub.id,
          payload.title,
          payload.body,
          payload.data,
          'failed',
          'Failed to send notification'
        );
      }
    }

    return sentCount;
  } catch (error) {
    logger.error('Error sending push notification to user:', error);
    return 0;
  }
}

/**
 * Send push notification to all subscribers (broadcast)
 */
export async function broadcastPushNotification(
  payload: PushNotificationPayload
): Promise<number> {
  try {
    const subscriptions = getAllPushSubscriptions();
    let sentCount = 0;

    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const success = await sendPushNotification(subscription, payload);
      if (success) {
        sentCount++;
      }
    }

    return sentCount;
  } catch (error) {
    logger.error('Error broadcasting push notification:', error);
    return 0;
  }
}

/**
 * Send order update notification
 */
export async function sendOrderUpdateNotification(
  userId: string,
  orderId: string,
  status: string,
  message: string
): Promise<boolean> {
  // Validate and sanitize inputs
  const sanitizedOrderId = typeof orderId === 'string' && /^[a-zA-Z0-9_-]+$/.test(orderId) && orderId.length <= 100
    ? orderId
    : '';
  const sanitizedMessage = typeof message === 'string' && message.length > 0 && message.length <= 500
    ? message
    : 'Your order has been updated';

  const payload: PushNotificationPayload = {
    title: 'Order Update',
    body: sanitizedMessage,
    icon: '/touch-icon-114x114.png',
    badge: '/touch-icon-114x114.png',
    data: {
      url: sanitizedOrderId ? `/account/orders/${sanitizedOrderId}` : '/account/orders',
      type: 'order_update',
      orderId: sanitizedOrderId,
    },
    tag: sanitizedOrderId ? `order-${sanitizedOrderId}`.substring(0, 50) : 'order-update',
  };

  const sentCount = await sendPushNotificationToUser(userId, payload, 'order_updates');
  return sentCount > 0;
}

/**
 * Send deal/promotion notification
 */
export async function sendDealNotification(
  userId: string,
  title: string,
  message: string,
  url?: string
): Promise<boolean> {
  // Validate and sanitize inputs
  const sanitizedTitle = typeof title === 'string' && title.length > 0 && title.length <= 100
    ? title
    : 'New Deal';
  const sanitizedMessage = typeof message === 'string' && message.length > 0 && message.length <= 500
    ? message
    : 'Check out our latest deals';

  // Validate URL
  let sanitizedUrl = '/deals';
  if (url && typeof url === 'string') {
    try {
      const urlObj = new URL(url, 'https://www.filtersfast.com');
      // Only allow same-origin URLs
      if (urlObj.origin === 'https://www.filtersfast.com' || urlObj.pathname.startsWith('/')) {
        const path = urlObj.pathname;
        if (path.startsWith('/') && !path.includes('..') && path.length <= 500) {
          sanitizedUrl = path + urlObj.search;
        }
      }
    } catch (error) {
      // Use default URL on error
      sanitizedUrl = '/deals';
    }
  }

  const payload: PushNotificationPayload = {
    title: sanitizedTitle,
    body: sanitizedMessage,
    icon: '/touch-icon-114x114.png',
    badge: '/touch-icon-114x114.png',
    data: {
      url: sanitizedUrl,
      type: 'deal',
    },
    tag: 'deal',
  };

  const sentCount = await sendPushNotificationToUser(userId, payload, 'deals_promotions');
  return sentCount > 0;
}

/**
 * Send abandoned cart notification
 */
export async function sendAbandonedCartNotification(
  userId: string,
  cartItemCount: number
): Promise<boolean> {
  const payload: PushNotificationPayload = {
    title: 'Don\'t forget your cart!',
    body: `You have ${cartItemCount} item${cartItemCount > 1 ? 's' : ''} waiting in your cart`,
    icon: '/touch-icon-114x114.png',
    badge: '/touch-icon-114x114.png',
    data: {
      url: '/cart',
      type: 'abandoned_cart',
    },
    tag: 'abandoned-cart',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Cart',
      },
    ],
  };

  const sentCount = await sendPushNotificationToUser(userId, payload, 'abandoned_carts');
  return sentCount > 0;
}

/**
 * Send back in stock notification
 */
export async function sendBackInStockNotification(
  userId: string,
  productName: string,
  productId: string
): Promise<boolean> {
  // Validate and sanitize inputs
  const sanitizedProductName = typeof productName === 'string' && productName.length > 0 && productName.length <= 100
    ? productName
    : 'Product';
  const sanitizedProductId = typeof productId === 'string' && /^[a-zA-Z0-9_-]+$/.test(productId) && productId.length <= 100
    ? productId
    : '';

  const payload: PushNotificationPayload = {
    title: 'Back in Stock!',
    body: `${sanitizedProductName} is now available`,
    icon: '/touch-icon-114x114.png',
    badge: '/touch-icon-114x114.png',
    data: {
      url: sanitizedProductId ? `/products/${sanitizedProductId}` : '/products',
      type: 'back_in_stock',
      productId: sanitizedProductId,
    },
    tag: sanitizedProductId ? `back-in-stock-${sanitizedProductId}`.substring(0, 50) : 'back-in-stock',
  };

  const sentCount = await sendPushNotificationToUser(userId, payload, 'back_in_stock');
  return sentCount > 0;
}

