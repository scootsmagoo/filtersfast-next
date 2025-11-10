/**
 * Gift Card Email Templates
 */

interface GiftCardEmailBase {
  giftCardCode: string
  amount: number
  currency?: string
  balanceUrl: string
  message?: string | null
  purchaserName?: string | null
  supportEmail?: string
}

export interface GiftCardIssuedEmail extends GiftCardEmailBase {
  recipientEmail: string
  recipientName?: string | null
  scheduledSendDate?: Date | null
}

export interface GiftCardSenderReceiptEmail extends GiftCardEmailBase {
  recipientEmail: string
  recipientName?: string | null
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function buildGiftCardIssuedEmail(data: GiftCardIssuedEmail) {
  const {
    giftCardCode,
    amount,
    currency = 'USD',
    recipientName,
    purchaserName,
    message,
    balanceUrl,
    supportEmail = 'support@filtersfast.com',
    scheduledSendDate,
  } = data

  const formattedAmount = formatCurrency(amount, currency)
  const friendlyRecipient = recipientName?.trim() || 'there'
  const greeting = purchaserName ? `${purchaserName} sent you a FiltersFast gift card!` : 'You received a FiltersFast gift card!'
  const sendDateText = scheduledSendDate
    ? `We’ll deliver this gift card on ${scheduledSendDate.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}.`
    : 'Your gift card is ready to use right away.'

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; max-width: 640px; margin: 0 auto; background: #ffffff;">
      <div style="padding: 32px 32px 24px; background: linear-gradient(135deg, #ff7a18, #af002d 70%); color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px;">${greeting}</h1>
        <p style="margin: 8px 0 0; font-size: 16px;">Hi ${friendlyRecipient},</p>
      </div>

      <div style="padding: 32px;">
        <p style="font-size: 16px; line-height: 1.6;">${sendDateText}</p>

        <div style="margin: 24px 0; padding: 24px; border-radius: 12px; border: 1px dashed #f97316; text-align: center;">
          <p style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; color: #f97316;">Gift Card Value</p>
          <p style="margin: 8px 0 16px; font-size: 32px; font-weight: 700;">${formattedAmount}</p>
          <div style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: #111827; color: #ffffff; font-size: 20px; letter-spacing: 3px;">
            ${giftCardCode}
          </div>
        </div>

        ${message ? `
          <div style="margin: 24px 0; padding: 16px 20px; border-left: 4px solid #f97316; background: #fff7ed;">
            <p style="margin: 0 0 8px; font-weight: 600;">Message from ${purchaserName || 'your sender'}:</p>
            <p style="margin: 0; font-style: italic;">${message}</p>
          </div>
        ` : ''}

        <div style="margin: 32px 0;">
          <a href="${balanceUrl}" style="display: inline-block; padding: 14px 28px; background: #f97316; color: #ffffff; border-radius: 9999px; text-decoration: none; font-weight: 600;">
            View Gift Card &amp; Check Balance
          </a>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          Shop thousands of filters for your home, from HVAC and refrigerator filters to water and air purification.
          Enter the code above at checkout to apply your gift card balance.
        </p>

        <p style="font-size: 14px; color: #6b7280;">
          Need help? Contact our support team at <a href="mailto:${supportEmail}" style="color: #f97316;">${supportEmail}</a>.
        </p>
      </div>

      <div style="padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">Gift cards are non-refundable and never expire. Remaining balance can be checked anytime.</p>
      </div>
    </div>
  `.trim()

  const text = [
    greeting,
    '',
    `Hi ${friendlyRecipient},`,
    sendDateText,
    '',
    `Gift card value: ${formattedAmount}`,
    `Gift card code: ${giftCardCode}`,
    '',
    message ? `Message from ${purchaserName || 'your sender'}: "${message}"` : '',
    '',
    `Redeem at checkout or manage your balance: ${balanceUrl}`,
    '',
    `Need help? Email ${supportEmail}.`,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject: `You've received a FiltersFast gift card (${formattedAmount})`, html, text }
}

export function buildGiftCardSenderReceiptEmail(data: GiftCardSenderReceiptEmail) {
  const {
    amount,
    currency = 'USD',
    recipientEmail,
    recipientName,
    giftCardCode,
    balanceUrl,
    message,
    supportEmail = 'support@filtersfast.com',
  } = data

  const formattedAmount = formatCurrency(amount, currency)
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; max-width: 640px; margin: 0 auto; background: #ffffff;">
      <div style="padding: 28px 32px; background: #111827; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px;">Your FiltersFast Gift Card Was Sent</h1>
      </div>

      <div style="padding: 28px 32px;">
        <p style="font-size: 16px; line-height: 1.6;">
          We emailed a ${formattedAmount} gift card to ${recipientName || recipientEmail}.
        </p>

        <div style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px; font-weight: 600;">Gift card details</p>
          <p style="margin: 0;">Recipient: ${recipientName || recipientEmail}</p>
          <p style="margin: 8px 0 0;">Amount: ${formattedAmount}</p>
          <p style="margin: 8px 0 0;">Gift card code: <strong>${giftCardCode}</strong></p>
        </div>

        ${message ? `
          <p style="font-size: 16px; line-height: 1.6;">
            You included this message:
          </p>
          <blockquote style="margin: 12px 0; padding: 12px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
            ${message}
          </blockquote>
        ` : ''}

        <p style="font-size: 14px; color: #6b7280;">
          You can review or resend the gift card at any time:
        </p>
        <p>
          <a href="${balanceUrl}" style="color: #f97316; text-decoration: none;">Manage gift card &raquo;</a>
        </p>

        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          Have questions? We're here to help at <a href="mailto:${supportEmail}" style="color: #f97316;">${supportEmail}</a>.
        </p>
      </div>
    </div>
  `.trim()

  const text = [
    'Your FiltersFast gift card was delivered.',
    '',
    `Recipient: ${recipientName || recipientEmail}`,
    `Amount: ${formattedAmount}`,
    `Gift card code: ${giftCardCode}`,
    '',
    message ? `Message you included: "${message}"` : '',
    '',
    `Manage gift card: ${balanceUrl}`,
    '',
    `Need help? ${supportEmail}`,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject: `Gift card sent to ${recipientName || recipientEmail}`, html, text }
}

