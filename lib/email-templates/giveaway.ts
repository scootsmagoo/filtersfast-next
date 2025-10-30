/**
 * Giveaway Email Templates
 * 
 * Email notifications for giveaway entries and winners
 */

/**
 * Send confirmation email when someone enters a giveaway
 */
export interface GiveawayConfirmationData {
  email: string;
  firstName: string;
  giveawayTitle: string;
  prizeDescription: string;
  endDate: string;
}

export function sendGiveawayConfirmationEmail(data: GiveawayConfirmationData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  const endDate = new Date(data.endDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const subject = `You're Entered! ${data.giveawayTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #f26722;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #054f97;
          margin-top: 0;
        }
        .prize-box {
          background-color: #f9f9f9;
          border-left: 4px solid #f26722;
          padding: 20px;
          margin: 25px 0;
        }
        .prize-box h3 {
          margin-top: 0;
          color: #054f97;
        }
        .info-box {
          background-color: #e8f4f8;
          border-radius: 6px;
          padding: 20px;
          margin: 25px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background-color: #f26722;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e0e0e0;
        }
        .footer a {
          color: #086db6;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You're Entered!</h1>
        </div>
        
        <div class="content">
          <h2>Hi ${data.firstName},</h2>
          
          <p>Great news! Your entry for our <strong>${data.giveawayTitle}</strong> has been received!</p>
          
          <div class="prize-box">
            <h3>What You Could Win:</h3>
            <p>${data.prizeDescription}</p>
          </div>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>Winner Announcement:</strong> ${endDate}</p>
            <p style="margin: 10px 0 0 0;">We'll notify you by email if you're selected as the winner. Good luck! 🍀</p>
          </div>
          
          <p>While you're here, why not check out our latest deals?</p>
          
          <center>
            <a href="https://www.filtersfast.com" class="button">Shop FiltersFast</a>
          </center>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Note:</strong> No purchase necessary to win. See our 
            <a href="https://www.filtersfast.com/sweepstakes" style="color: #086db6;">official rules</a> 
            for complete details.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>FiltersFast</strong></p>
          <p>America's #1 Online Filter Store</p>
          <p>
            <a href="https://www.filtersfast.com">Shop Now</a> | 
            <a href="https://www.filtersfast.com/support">Help Center</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px;">
            This email was sent because you entered a giveaway at FiltersFast.com.<br>
            © ${new Date().getFullYear()} FiltersFast. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
You're Entered! ${data.giveawayTitle}

Hi ${data.firstName},

Great news! Your entry for our ${data.giveawayTitle} has been received!

What You Could Win:
${data.prizeDescription}

Winner Announcement: ${endDate}

We'll notify you by email if you're selected as the winner. Good luck!

While you're here, why not check out our latest deals?
Visit: https://www.filtersfast.com

Note: No purchase necessary to win. See our official rules at https://www.filtersfast.com/sweepstakes for complete details.

---
FiltersFast
America's #1 Online Filter Store
https://www.filtersfast.com
  `.trim();

  return {
    to: data.email,
    subject,
    html,
    text
  };
}

/**
 * Send notification email to giveaway winner
 */
export interface GiveawayWinnerData {
  email: string;
  firstName: string;
  giveawayTitle: string;
  prizeDescription: string;
}

export function sendGiveawayWinnerEmail(data: GiveawayWinnerData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  const subject = `🎉 You Won! ${data.giveawayTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 36px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .confetti {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #054f97;
          margin-top: 0;
        }
        .winner-box {
          background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
          border: 3px solid #37b033;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .winner-box h3 {
          margin-top: 0;
          color: #37b033;
          font-size: 24px;
        }
        .winner-box p {
          font-size: 18px;
          margin: 15px 0 0 0;
        }
        .info-box {
          background-color: #fff3e0;
          border-left: 4px solid #f26722;
          padding: 20px;
          margin: 25px 0;
        }
        .info-box h4 {
          margin-top: 0;
          color: #054f97;
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background-color: #37b033;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          font-size: 16px;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e0e0e0;
        }
        .footer a {
          color: #086db6;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .header h1 {
            font-size: 28px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="confetti">🎊 🎉 🎊</div>
          <h1>Congratulations!</h1>
          <h2 style="color: #ffffff; font-weight: normal; margin: 10px 0 0 0;">You're Our Winner!</h2>
        </div>
        
        <div class="content">
          <h2>Hi ${data.firstName},</h2>
          
          <p style="font-size: 18px;">
            We're thrilled to announce that <strong>you are the winner</strong> of our 
            <strong>${data.giveawayTitle}</strong>! 🎉
          </p>
          
          <div class="winner-box">
            <h3>Your Prize:</h3>
            <p>${data.prizeDescription}</p>
          </div>
          
          <div class="info-box">
            <h4>Next Steps:</h4>
            <p style="margin: 10px 0;">
              Our team will be in touch within the next 24-48 hours to arrange delivery of your prize. 
              Please reply to this email or contact us at <strong>support@filtersfast.com</strong> 
              to confirm your shipping address.
            </p>
            <p style="margin: 10px 0 0 0;">
              <strong>Important:</strong> Please respond within 14 days to claim your prize.
            </p>
          </div>
          
          <p>Thank you for participating in our giveaway, and congratulations again!</p>
          
          <center>
            <a href="mailto:support@filtersfast.com?subject=Giveaway%20Winner%20-%20${encodeURIComponent(data.giveawayTitle)}" class="button">
              Contact Us to Claim Prize
            </a>
          </center>
          
          <p style="margin-top: 30px;">
            While you're celebrating, don't forget to check out our latest products and deals!
          </p>
          
          <center>
            <a href="https://www.filtersfast.com" style="color: #086db6; text-decoration: none;">
              Visit FiltersFast.com →
            </a>
          </center>
        </div>
        
        <div class="footer">
          <p><strong>FiltersFast</strong></p>
          <p>America's #1 Online Filter Store</p>
          <p>
            <a href="https://www.filtersfast.com">Shop Now</a> | 
            <a href="mailto:support@filtersfast.com">Contact Support</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px;">
            © ${new Date().getFullYear()} FiltersFast. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎉 CONGRATULATIONS! You Won! ${data.giveawayTitle}

Hi ${data.firstName},

We're thrilled to announce that YOU are the winner of our ${data.giveawayTitle}!

Your Prize:
${data.prizeDescription}

NEXT STEPS:
Our team will be in touch within the next 24-48 hours to arrange delivery of your prize. Please reply to this email or contact us at support@filtersfast.com to confirm your shipping address.

IMPORTANT: Please respond within 14 days to claim your prize.

Thank you for participating in our giveaway, and congratulations again!

To claim your prize, email us at: support@filtersfast.com

---
FiltersFast
America's #1 Online Filter Store
https://www.filtersfast.com
  `.trim();

  return {
    to: data.email,
    subject,
    html,
    text
  };
}

