/**
 * Newsletter Email Templates
 * GDPR/CAN-SPAM compliant templates with unsubscribe links
 */

import { createNewsletterToken } from '@/lib/db/newsletter-tokens';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Generate an unsubscribe token for a user
 */
export async function generateUnsubscribeToken(userId: string, email: string): Promise<string> {
  // Unsubscribe tokens never expire (CAN-SPAM requirement)
  return createNewsletterToken(userId, email, 'unsubscribe', null);
}

/**
 * Base email footer with GDPR/CAN-SPAM compliance
 */
export function getEmailFooter(userId: string, email: string, unsubscribeToken: string): string {
  const unsubscribeUrl = `${baseUrl}/unsubscribe/${unsubscribeToken}`;
  const preferencesUrl = `${baseUrl}/account/newsletter`;
  
  return `
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; font-family: Arial, sans-serif;">
      <p style="margin: 0 0 10px 0;">
        You're receiving this email because you subscribed to FiltersFast communications.
      </p>
      <p style="margin: 0 0 10px 0;">
        <strong>Manage your preferences:</strong><br>
        <a href="${preferencesUrl}" style="color: #f97316; text-decoration: none;">Update Email Preferences</a> | 
        <a href="${unsubscribeUrl}" style="color: #f97316; text-decoration: none;">Unsubscribe</a>
      </p>
      <p style="margin: 0 0 10px 0;">
        <strong>FiltersFast</strong><br>
        Providing quality filters for your home and business<br>
        <a href="mailto:support@filtersfast.com" style="color: #f97316; text-decoration: none;">support@filtersfast.com</a>
      </p>
      <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
        This email was sent to ${email}. If you no longer wish to receive these emails, 
        you can <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">unsubscribe here</a>.
      </p>
      <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
        © ${new Date().getFullYear()} FiltersFast. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Newsletter promotional email template
 */
export interface NewsletterEmailOptions {
  userId: string;
  email: string;
  subject: string;
  preheader?: string;
  heading: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

export async function createNewsletterEmail(options: NewsletterEmailOptions): Promise<{ subject: string; html: string }> {
  // OWASP: Input validation
  if (!options.userId || !options.email || !options.subject || !options.heading || !options.content) {
    throw new Error('Missing required email options');
  }
  
  // OWASP: Sanitize HTML to prevent XSS (basic sanitization - use DOMPurify in production)
  const escapeHtml = (str: string) => 
    str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#039;');
  
  const unsubscribeToken = await generateUnsubscribeToken(options.userId, options.email);
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${escapeHtml(options.subject)}</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      ${options.preheader ? `
        <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f9fafb;">
          ${options.preheader}
        </div>
      ` : ''}
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #f97316; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    FiltersFast
                  </h1>
                </td>
              </tr>
              
              ${options.imageUrl ? `
                <!-- Hero Image -->
                <tr>
                  <td>
                    <img src="${options.imageUrl}" alt="" width="600" style="display: block; width: 100%; height: auto;">
                  </td>
                </tr>
              ` : ''}
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold;">
                    ${escapeHtml(options.heading)}
                  </h2>
                  
                  <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                    ${options.content}
                  </div>
                  
                  ${options.ctaText && options.ctaUrl ? `
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td style="border-radius: 6px; background-color: #f97316;">
                          <a href="${options.ctaUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                            ${options.ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  ${getEmailFooter(options.userId, options.email, unsubscribeToken)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  return {
    subject: options.subject,
    html: html.trim(),
  };
}

/**
 * Product reminder email template
 */
export interface ReminderEmailOptions {
  userId: string;
  email: string;
  customerName: string;
  productName: string;
  productUrl: string;
  lastPurchaseDate?: string;
  imageUrl?: string;
}

export async function createReminderEmail(options: ReminderEmailOptions): Promise<{ subject: string; html: string }> {
  const subject = `Time to Replace Your ${options.productName}`;
  const unsubscribeToken = await generateUnsubscribeToken(options.userId, options.email);
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #f97316; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    FiltersFast
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold;">
                    Hi ${options.customerName}! 👋
                  </h2>
                  
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    It's been a while since you purchased your ${options.productName}. 
                    Based on typical usage, it might be time for a replacement.
                  </p>
                  
                  ${options.lastPurchaseDate ? `
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                      Last purchase: ${options.lastPurchaseDate}
                    </p>
                  ` : ''}
                  
                  ${options.imageUrl ? `
                    <div style="margin: 20px 0; text-align: center;">
                      <img src="${options.imageUrl}" alt="${options.productName}" width="300" style="max-width: 100%; height: auto; border-radius: 8px;">
                    </div>
                  ` : ''}
                  
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Regular filter replacement helps:
                  </p>
                  <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                    <li>Maintain optimal air quality</li>
                    <li>Improve system efficiency</li>
                    <li>Extend equipment lifespan</li>
                    <li>Reduce energy costs</li>
                  </ul>
                  
                  <table cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                    <tr>
                      <td style="border-radius: 6px; background-color: #f97316;">
                        <a href="${options.productUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                          Reorder Now
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                    Not ready to reorder? You can <a href="${baseUrl}/account/reminders" style="color: #f97316; text-decoration: none;">manage your reminders</a> or snooze this notification.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  ${getEmailFooter(options.userId, options.email, unsubscribeToken)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  return {
    subject,
    html: html.trim(),
  };
}

/**
 * Plain text version generator for accessibility
 */
export function generatePlainTextVersion(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

