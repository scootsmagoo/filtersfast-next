/**
 * Attentive SMS Marketing API Integration
 * 
 * Official API Docs: https://docs.attentive.com/
 * 
 * Features:
 * - Subscriber management
 * - Message sending (transactional & marketing)
 * - Event tracking
 * - Webhook handling
 * - TCPA compliance helpers
 */

interface AttentiveConfig {
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  environment?: 'production' | 'sandbox';
}

interface AttentiveSubscriber {
  phone: string;
  email?: string;
  externalUserId?: string;
  customAttributes?: Record<string, any>;
  signUpSource?: string;
}

interface AttentiveMessage {
  phone: string;
  message: string;
  externalSendId?: string;
  metadata?: Record<string, any>;
}

interface AttentiveEvent {
  phone: string;
  email?: string;
  eventName: string;
  occurredAt?: string;
  properties?: Record<string, any>;
  user?: {
    externalUserId?: string;
  };
}

export class AttentiveClient {
  private config: Required<AttentiveConfig>;

  constructor(config: AttentiveConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret || '',
      baseUrl: config.baseUrl || 'https://api.attentivemobile.com',
      environment: config.environment || 'production',
    };

    if (!this.config.apiKey) {
      throw new Error('Attentive API key is required');
    }
  }

  /**
   * Subscribe a user to SMS
   */
  async subscribe(subscriber: AttentiveSubscriber): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            phone: this.normalizePhone(subscriber.phone),
            email: subscriber.email,
            externalIdentifiers: subscriber.externalUserId ? {
              clientUserId: subscriber.externalUserId,
            } : undefined,
            customAttributes: subscriber.customAttributes,
          },
          signUpSourceId: subscriber.signUpSource || 'website',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Attentive API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error subscribing to Attentive:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from SMS
   */
  async unsubscribe(phone: string): Promise<any> {
    try {
      const normalizedPhone = this.normalizePhone(phone);
      const response = await fetch(
        `${this.config.baseUrl}/v1/subscriptions/${encodeURIComponent(normalizedPhone)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.json();
        throw new Error(`Attentive API error: ${error.message || response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing from Attentive:', error);
      throw error;
    }
  }

  /**
   * Get subscriber information
   */
  async getSubscriber(phone: string): Promise<any> {
    try {
      const normalizedPhone = this.normalizePhone(phone);
      const response = await fetch(
        `${this.config.baseUrl}/v1/subscriptions/${encodeURIComponent(normalizedPhone)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.json();
        throw new Error(`Attentive API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Attentive subscriber:', error);
      throw error;
    }
  }

  /**
   * Send a custom message (requires special permissions from Attentive)
   * Most transactional messages are sent via triggered events instead
   */
  async sendMessage(message: AttentiveMessage): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/messages/custom`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: this.normalizePhone(message.phone),
          message: message.message,
          externalSendId: message.externalSendId,
          metadata: message.metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Attentive API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending Attentive message:', error);
      throw error;
    }
  }

  /**
   * Track a custom event (triggers automated messages configured in Attentive)
   * This is the recommended way to send transactional messages
   */
  async trackEvent(event: AttentiveEvent): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/events/custom`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: event.eventName,
          occurredAt: event.occurredAt || new Date().toISOString(),
          user: {
            phone: this.normalizePhone(event.phone),
            email: event.email,
            externalIdentifiers: event.user?.externalUserId ? {
              clientUserId: event.user.externalUserId,
            } : undefined,
          },
          properties: event.properties || {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Attentive API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error tracking Attentive event:', error);
      throw error;
    }
  }

  /**
   * Normalize phone number to E.164 format
   * Attentive requires phone numbers in international format
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // If it's 10 digits, assume US number and add country code
    if (normalized.length === 10) {
      normalized = '1' + normalized;
    }

    // Add + prefix if not present
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }

    return normalized;
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): boolean {
    const normalized = phone.replace(/\D/g, '');
    // US/Canada: 10 digits, International: 11+ digits
    return normalized.length >= 10 && normalized.length <= 15;
  }
}

/**
 * Helper function to create Attentive client instance
 */
export function createAttentiveClient(): AttentiveClient | null {
  const apiKey = process.env.ATTENTIVE_API_KEY;
  
  if (!apiKey) {
    console.warn('ATTENTIVE_API_KEY not configured. SMS features will be disabled.');
    return null;
  }

  return new AttentiveClient({
    apiKey,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  });
}

/**
 * Transactional SMS Events
 * Configure these in your Attentive dashboard to trigger automated messages
 */
export const AttentiveEvents = {
  // Order events
  ORDER_PLACED: 'order_placed',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  
  // Return events
  RETURN_APPROVED: 'return_approved',
  RETURN_RECEIVED: 'return_received',
  RETURN_REFUNDED: 'return_refunded',
  
  // Cart events
  CART_ABANDONED: 'cart_abandoned',
  CART_REMINDER: 'cart_reminder',
  
  // Filter reminders
  FILTER_REMINDER: 'filter_reminder',
  
  // Subscription events
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',
  SUBSCRIPTION_FAILED: 'subscription_failed',
  
  // Welcome
  WELCOME_NEW_SUBSCRIBER: 'welcome_new_subscriber',
} as const;

/**
 * Helper to send order update SMS
 */
export async function sendOrderUpdateSMS(params: {
  phone: string;
  email?: string;
  userId?: string;
  orderId: string;
  orderNumber: string;
  status: keyof typeof AttentiveEvents;
  trackingNumber?: string;
  trackingUrl?: string;
}) {
  const client = createAttentiveClient();
  if (!client) return { success: false, error: 'SMS not configured' };

  try {
    await client.trackEvent({
      phone: params.phone,
      email: params.email,
      eventName: AttentiveEvents[params.status],
      user: params.userId ? { externalUserId: params.userId } : undefined,
      properties: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        trackingNumber: params.trackingNumber,
        trackingUrl: params.trackingUrl,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send order update SMS:', error);
    return { success: false, error };
  }
}

/**
 * TCPA Compliance Helper
 * Generates compliant consent language
 */
export const TCPACompliance = {
  checkoutOptIn: `By checking this box, you consent to receive recurring automated promotional and personalized marketing text messages (e.g. cart reminders, order updates) from FiltersFast at the cell number used when signing up. Consent is not a condition of any purchase. Reply HELP for help and STOP to cancel. Msg frequency varies. Msg & data rates may apply. View Terms & Privacy.`,
  
  shortOptIn: `By providing your phone number, you agree to receive text messages from FiltersFast. Msg & data rates may apply. Text STOP to opt out.`,
  
  termsUrl: '/terms/sms-terms',
  privacyUrl: '/privacy',
  
  validateConsent(consent: boolean, phone: string): { valid: boolean; error?: string } {
    if (!consent) {
      return { valid: false, error: 'TCPA consent required' };
    }
    if (!AttentiveClient.validatePhone(phone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
    return { valid: true };
  },
};

export default AttentiveClient;

