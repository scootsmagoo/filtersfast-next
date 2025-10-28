/**
 * Email Templates for Returns & Exchanges
 * Notification emails sent during the return process
 */

import { ReturnRequest } from '../types/returns';

/**
 * Email sent when return request is received
 */
export function returnRequestReceivedEmail(returnRequest: ReturnRequest): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  const itemsList = returnRequest.items
    .map(item => `- ${item.productName} (Qty: ${item.quantity}) - $${item.totalPrice.toFixed(2)}`)
    .join('\n');

  return {
    to: returnRequest.customerEmail,
    subject: `Return Request Received - Order ${returnRequest.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .items { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Return Request Received</h1>
    </div>
    <div class="content">
      <p>Hi ${returnRequest.customerName},</p>
      
      <p>We've received your return request for order <strong>${returnRequest.orderNumber}</strong>.</p>
      
      <div class="items">
        <h3>Return Items:</h3>
        ${returnRequest.items.map(item => `
          <p>
            <strong>${item.productName}</strong><br>
            Quantity: ${item.quantity} × $${item.unitPrice.toFixed(2)}<br>
            Reason: ${item.reason.replace(/_/g, ' ')}
          </p>
        `).join('')}
        
        <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
          <strong>Estimated Refund: $${returnRequest.refundAmount.toFixed(2)}</strong>
        </p>
      </div>
      
      <p>Our team will review your request within 1-2 business days. Once approved, we'll email you a prepaid return shipping label.</p>
      
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account/returns/${returnRequest.id}" class="button">
          View Return Status
        </a>
      </p>
      
      <p>If you have any questions, please don't hesitate to contact our customer service team.</p>
      
      <p>Thank you,<br>FiltersFast Support Team</p>
    </div>
    <div class="footer">
      <p>FiltersFast.com | Premium Air & Water Filters</p>
      <p>Need help? Contact us at support@filtersfast.com</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Return Request Received - Order ${returnRequest.orderNumber}

Hi ${returnRequest.customerName},

We've received your return request for order ${returnRequest.orderNumber}.

Return Items:
${itemsList}

Estimated Refund: $${returnRequest.refundAmount.toFixed(2)}

Our team will review your request within 1-2 business days. Once approved, we'll email you a prepaid return shipping label.

View your return status: ${process.env.NEXT_PUBLIC_BASE_URL}/account/returns/${returnRequest.id}

Thank you,
FiltersFast Support Team
    `
  };
}

/**
 * Email sent when return is approved and label is ready
 */
export function returnLabelEmail(returnRequest: ReturnRequest): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  return {
    to: returnRequest.customerEmail,
    subject: `Return Label Ready - Order ${returnRequest.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .instructions { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .instructions li { margin: 10px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Return Approved</h1>
    </div>
    <div class="content">
      <p>Hi ${returnRequest.customerName},</p>
      
      <p>Good news! Your return for order <strong>${returnRequest.orderNumber}</strong> has been approved.</p>
      
      <p><strong>Your prepaid return label is ready to download.</strong></p>
      
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/returns/${returnRequest.id}/label" class="button">
          Download Return Label
        </a>
      </p>
      
      <div class="instructions">
        <h3>Return Instructions:</h3>
        <ol>
          <li><strong>Print</strong> the return label</li>
          <li><strong>Pack</strong> items securely (original packaging preferred)</li>
          <li><strong>Attach</strong> the label to the outside of the package</li>
          <li><strong>Drop off</strong> at any ${returnRequest.carrier || 'UPS'} location or schedule a pickup</li>
          <li><strong>Track</strong> your return using tracking number: ${returnRequest.trackingNumber || 'Will be provided'}</li>
        </ol>
        
        ${returnRequest.freeReturnShipping ? 
          '<p style="color: #28a745; font-weight: bold;">✓ Return shipping is FREE</p>' : 
          ''}
      </div>
      
      <p>Once we receive and inspect your return, we'll process your refund of <strong>$${returnRequest.refundAmount.toFixed(2)}</strong> to your ${returnRequest.refundMethod === 'original_payment' ? 'original payment method' : 'store credit'}.</p>
      
      <p>Thank you,<br>FiltersFast Support Team</p>
    </div>
    <div class="footer">
      <p>FiltersFast.com | Premium Air & Water Filters</p>
      <p>Questions? Contact us at support@filtersfast.com</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Return Label Ready - Order ${returnRequest.orderNumber}

Hi ${returnRequest.customerName},

Good news! Your return for order ${returnRequest.orderNumber} has been approved.

Download your prepaid return label:
${process.env.NEXT_PUBLIC_BASE_URL}/api/returns/${returnRequest.id}/label

Return Instructions:
1. Print the return label
2. Pack items securely (original packaging preferred)
3. Attach the label to the outside of the package
4. Drop off at any ${returnRequest.carrier || 'UPS'} location
5. Track using: ${returnRequest.trackingNumber || 'TBD'}

${returnRequest.freeReturnShipping ? 'Return shipping is FREE!' : ''}

Refund amount: $${returnRequest.refundAmount.toFixed(2)}
Refund method: ${returnRequest.refundMethod === 'original_payment' ? 'Original payment method' : 'Store credit'}

Thank you,
FiltersFast Support Team
    `
  };
}

/**
 * Email sent when return is received at warehouse
 */
export function returnReceivedEmail(returnRequest: ReturnRequest): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  return {
    to: returnRequest.customerEmail,
    subject: `Return Received - Order ${returnRequest.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Return Received</h1>
    </div>
    <div class="content">
      <p>Hi ${returnRequest.customerName},</p>
      
      <p>We've received your return for order <strong>${returnRequest.orderNumber}</strong>.</p>
      
      <p>Our team is now inspecting the items. Once inspection is complete (typically 1-2 business days), we'll process your refund of <strong>$${returnRequest.refundAmount.toFixed(2)}</strong>.</p>
      
      <p>You'll receive another email once your refund has been processed.</p>
      
      <p>Thank you,<br>FiltersFast Support Team</p>
    </div>
    <div class="footer">
      <p>FiltersFast.com | Premium Air & Water Filters</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Return Received - Order ${returnRequest.orderNumber}

Hi ${returnRequest.customerName},

We've received your return for order ${returnRequest.orderNumber}.

Our team is now inspecting the items. Once inspection is complete (typically 1-2 business days), we'll process your refund of $${returnRequest.refundAmount.toFixed(2)}.

You'll receive another email once your refund has been processed.

Thank you,
FiltersFast Support Team
    `
  };
}

/**
 * Email sent when refund is processed
 */
export function refundProcessedEmail(returnRequest: ReturnRequest): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  return {
    to: returnRequest.customerEmail,
    subject: `Refund Processed - Order ${returnRequest.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .refund-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; border: 2px solid #28a745; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Refund Processed</h1>
    </div>
    <div class="content">
      <p>Hi ${returnRequest.customerName},</p>
      
      <p>Great news! Your return has been processed and your refund has been issued.</p>
      
      <div class="refund-box">
        <h2 style="margin: 0; color: #28a745;">$${returnRequest.refundAmount.toFixed(2)}</h2>
        <p style="margin: 10px 0 0 0; color: #666;">Refund Amount</p>
      </div>
      
      <p><strong>Refund Details:</strong></p>
      <ul>
        <li>Order: ${returnRequest.orderNumber}</li>
        <li>Amount: $${returnRequest.refundAmount.toFixed(2)}</li>
        <li>Method: ${returnRequest.refundMethod === 'original_payment' ? 'Original payment method' : 'Store credit'}</li>
        <li>Processing Time: ${returnRequest.refundMethod === 'original_payment' ? '3-5 business days' : 'Immediately available'}</li>
      </ul>
      
      ${returnRequest.refundMethod === 'original_payment' ? 
        '<p><em>Please allow 3-5 business days for the refund to appear in your account, depending on your financial institution.</em></p>' :
        '<p><em>Your store credit is now available and can be used on your next purchase!</em></p>'
      }
      
      <p>Thank you for shopping with FiltersFast. We hope to serve you again soon!</p>
      
      <p>Best regards,<br>FiltersFast Support Team</p>
    </div>
    <div class="footer">
      <p>FiltersFast.com | Premium Air & Water Filters</p>
      <p>Questions about your refund? Contact us at support@filtersfast.com</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Refund Processed - Order ${returnRequest.orderNumber}

Hi ${returnRequest.customerName},

Great news! Your return has been processed and your refund has been issued.

Refund Amount: $${returnRequest.refundAmount.toFixed(2)}

Refund Details:
- Order: ${returnRequest.orderNumber}
- Amount: $${returnRequest.refundAmount.toFixed(2)}
- Method: ${returnRequest.refundMethod === 'original_payment' ? 'Original payment method' : 'Store credit'}
- Processing Time: ${returnRequest.refundMethod === 'original_payment' ? '3-5 business days' : 'Immediately available'}

${returnRequest.refundMethod === 'original_payment' ? 
  'Please allow 3-5 business days for the refund to appear in your account.' :
  'Your store credit is now available for your next purchase!'
}

Thank you for shopping with FiltersFast!

Best regards,
FiltersFast Support Team
    `
  };
}

/**
 * Email sent when return is rejected
 */
export function returnRejectedEmail(returnRequest: ReturnRequest, reason: string): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  return {
    to: returnRequest.customerEmail,
    subject: `Return Request Update - Order ${returnRequest.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .reason-box { background-color: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Return Request Update</h1>
    </div>
    <div class="content">
      <p>Hi ${returnRequest.customerName},</p>
      
      <p>We've reviewed your return request for order <strong>${returnRequest.orderNumber}</strong>.</p>
      
      <div class="reason-box">
        <strong>Status:</strong> Unfortunately, we're unable to approve this return request.
        <br><br>
        <strong>Reason:</strong> ${reason}
      </div>
      
      <p>If you have any questions or believe this decision was made in error, please don't hesitate to contact our customer service team. We're here to help!</p>
      
      <p>Contact us at: support@filtersfast.com or call 1-800-XXX-XXXX</p>
      
      <p>Thank you,<br>FiltersFast Support Team</p>
    </div>
    <div class="footer">
      <p>FiltersFast.com | Premium Air & Water Filters</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Return Request Update - Order ${returnRequest.orderNumber}

Hi ${returnRequest.customerName},

We've reviewed your return request for order ${returnRequest.orderNumber}.

Status: Unfortunately, we're unable to approve this return request.

Reason: ${reason}

If you have questions or believe this decision was made in error, please contact us:
Email: support@filtersfast.com
Phone: 1-800-XXX-XXXX

Thank you,
FiltersFast Support Team
    `
  };
}

