/**
 * Email Templates for Referral Program
 */

export interface ReferralConversionEmailData {
  referrerName: string;
  referrerEmail: string;
  referredCustomerName: string;
  orderTotal: number;
  rewardAmount: number;
  referralCode: string;
}

export interface ReferralRewardReadyEmailData {
  customerName: string;
  email: string;
  rewardAmount: number;
  rewardCode?: string;
  totalReferrals: number;
}

export interface WelcomeReferralProgramEmailData {
  customerName: string;
  email: string;
  referralCode: string;
  referrerReward: number;
  referredDiscount: number;
}

/**
 * New Referral Conversion Email
 * Sent when someone uses your referral code
 */
export function referralConversionEmail(data: ReferralConversionEmailData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  return {
    to: data.referrerEmail,
    subject: '🎉 Great news! Someone used your referral code',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 32px; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .reward-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; margin: 20px 0; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); }
    .reward-box h2 { margin: 0; font-size: 48px; font-weight: bold; }
    .reward-box p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.95; }
    .info-card { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-weight: 500; }
    .info-value { font-weight: bold; color: #333; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(242, 103, 34, 0.3); }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; background-color: #f5f5f5; border-radius: 0 0 10px 10px; }
    .footer a { color: #054f97; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 You Earned a Reward!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Someone just used your referral code</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Hi ${data.referrerName},</p>
      
      <p style="font-size: 16px;">Awesome news! <strong>${data.referredCustomerName || 'A new customer'}</strong> just made their first purchase using your referral code <strong>${data.referralCode}</strong>!</p>
      
      <div class="reward-box">
        <p style="margin: 0 0 10px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Your Reward</p>
        <h2>$${data.rewardAmount.toFixed(2)}</h2>
        <p>Store Credit</p>
      </div>
      
      <div class="info-card">
        <h3 style="margin-top: 0; color: #6366f1;">Order Details:</h3>
        <div class="info-row">
          <span class="info-label">Customer:</span>
          <span class="info-value">${data.referredCustomerName || 'Guest'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Order Total:</span>
          <span class="info-value">$${data.orderTotal.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value" style="color: #f59e0b;">Pending (14-day waiting period)</span>
        </div>
      </div>

      <p style="font-size: 14px; color: #666; background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <strong>Note:</strong> Your reward will be available in 14 days to allow for returns. Once approved, you can use it on your next order!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.filtersfast.com/account/referrals" class="button">View Referral Dashboard</a>
      </div>

      <p style="font-size: 16px; margin-top: 30px;">Keep sharing your code <strong>${data.referralCode}</strong> to earn more rewards!</p>
    </div>
    
    <div class="footer">
      <p>FiltersFast - America's Top Online Filtration Retailer</p>
      <p><a href="https://www.filtersfast.com">www.filtersfast.com</a> | <a href="https://www.filtersfast.com/support">Support</a></p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        You're receiving this email because you're enrolled in the FiltersFast Referral Program.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
🎉 You Earned a Reward!

Hi ${data.referrerName},

Awesome news! ${data.referredCustomerName || 'A new customer'} just made their first purchase using your referral code ${data.referralCode}!

Your Reward: $${data.rewardAmount.toFixed(2)} Store Credit

Order Details:
- Customer: ${data.referredCustomerName || 'Guest'}
- Order Total: $${data.orderTotal.toFixed(2)}
- Status: Pending (14-day waiting period)

Note: Your reward will be available in 14 days to allow for returns. Once approved, you can use it on your next order!

View your referral dashboard: https://www.filtersfast.com/account/referrals

Keep sharing your code ${data.referralCode} to earn more rewards!

---
FiltersFast - America's Top Online Filtration Retailer
www.filtersfast.com | Support: https://www.filtersfast.com/support
    `
  };
}

/**
 * Reward Ready Email
 * Sent when a reward is approved and ready to use
 */
export function referralRewardReadyEmail(data: ReferralRewardReadyEmailData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  return {
    to: data.email,
    subject: '💰 Your referral reward is ready to use!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 32px; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .reward-box { background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; padding: 30px; margin: 20px 0; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(242, 103, 34, 0.3); }
    .reward-box h2 { margin: 0; font-size: 56px; font-weight: bold; }
    .reward-box p { margin: 10px 0 0 0; font-size: 20px; }
    .code-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px dashed #10b981; text-align: center; }
    .code-box .code { font-size: 32px; font-weight: bold; color: #10b981; font-family: monospace; letter-spacing: 2px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(242, 103, 34, 0.3); }
    .stats { display: flex; justify-content: space-around; margin: 30px 0; }
    .stat { text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; color: #6366f1; }
    .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; background-color: #f5f5f5; border-radius: 0 0 10px 10px; }
    .footer a { color: #054f97; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Your Reward is Ready!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Time to treat yourself</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Hi ${data.customerName},</p>
      
      <p style="font-size: 16px;">Great news! Your referral reward has been approved and is now ready to use on your next purchase!</p>
      
      <div class="reward-box">
        <p style="margin: 0 0 10px 0; font-size: 18px; opacity: 0.9;">Available Credit</p>
        <h2>$${data.rewardAmount.toFixed(2)}</h2>
        <p style="opacity: 0.9;">Ready to use now!</p>
      </div>

      ${data.rewardCode ? `
      <div class="code-box">
        <p style="margin: 0 0 10px 0; color: #666;">Use code at checkout:</p>
        <div class="code">${data.rewardCode}</div>
      </div>
      ` : `
      <p style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; font-size: 14px;">
        <strong>How to use:</strong> Your credit will be automatically applied at checkout when you're signed in to your account.
      </p>
      `}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.filtersfast.com" class="button">Start Shopping</a>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-number">${data.totalReferrals}</div>
          <div class="stat-label">Total Referrals</div>
        </div>
        <div class="stat">
          <div class="stat-number">$${data.rewardAmount.toFixed(0)}</div>
          <div class="stat-label">Available Credit</div>
        </div>
      </div>

      <p style="font-size: 16px; text-align: center; margin-top: 30px;">Keep referring friends to earn even more rewards!</p>
    </div>
    
    <div class="footer">
      <p>FiltersFast - America's Top Online Filtration Retailer</p>
      <p><a href="https://www.filtersfast.com">www.filtersfast.com</a> | <a href="https://www.filtersfast.com/support">Support</a></p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
💰 Your Reward is Ready!

Hi ${data.customerName},

Great news! Your referral reward has been approved and is now ready to use on your next purchase!

Available Credit: $${data.rewardAmount.toFixed(2)}

${data.rewardCode ? `Use code at checkout: ${data.rewardCode}` : 'Your credit will be automatically applied at checkout when you\'re signed in.'}

Your Stats:
- Total Referrals: ${data.totalReferrals}
- Available Credit: $${data.rewardAmount.toFixed(0)}

Start shopping: https://www.filtersfast.com

Keep referring friends to earn even more rewards!

---
FiltersFast - America's Top Online Filtration Retailer
www.filtersfast.com | Support: https://www.filtersfast.com/support
    `
  };
}

/**
 * Welcome to Referral Program Email
 * Sent when a customer gets their first referral code
 */
export function welcomeReferralProgramEmail(data: WelcomeReferralProgramEmailData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  return {
    to: data.email,
    subject: '🎁 Share FiltersFast & Earn Rewards!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 32px; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .code-box { background-color: white; padding: 25px; margin: 20px 0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; border: 3px solid #6366f1; }
    .code-box .label { color: #666; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .code-box .code { font-size: 36px; font-weight: bold; color: #6366f1; font-family: monospace; letter-spacing: 3px; }
    .how-it-works { margin: 30px 0; }
    .step { background-color: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; }
    .step-number { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; margin-right: 20px; flex-shrink: 0; }
    .step-content h3 { margin: 0 0 5px 0; color: #333; font-size: 16px; }
    .step-content p { margin: 0; color: #666; font-size: 14px; }
    .rewards { display: flex; justify-content: space-around; margin: 30px 0; }
    .reward { text-align: center; flex: 1; }
    .reward-icon { font-size: 48px; margin-bottom: 10px; }
    .reward-amount { font-size: 28px; font-weight: bold; color: #10b981; }
    .reward-label { color: #666; font-size: 13px; margin-top: 5px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(242, 103, 34, 0.3); }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; background-color: #f5f5f5; border-radius: 0 0 10px 10px; }
    .footer a { color: #054f97; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Welcome to Our Referral Program!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Share the love and earn rewards</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Hi ${data.customerName},</p>
      
      <p style="font-size: 16px;">Thanks for being a valued FiltersFast customer! We've set up your personal referral code so you can start earning rewards by sharing FiltersFast with friends and family.</p>
      
      <div class="code-box">
        <div class="label">Your Referral Code</div>
        <div class="code">${data.referralCode}</div>
      </div>

      <div class="rewards">
        <div class="reward">
          <div class="reward-icon">👥</div>
          <div class="reward-amount">${data.referredDiscount}%</div>
          <div class="reward-label">OFF<br>For Your Friend</div>
        </div>
        <div class="reward">
          <div class="reward-icon">💰</div>
          <div class="reward-amount">$${data.referrerReward}</div>
          <div class="reward-label">Credit<br>For You</div>
        </div>
      </div>

      <div class="how-it-works">
        <h2 style="text-align: center; color: #6366f1; margin-bottom: 25px;">How It Works</h2>
        
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Share Your Code</h3>
            <p>Send your referral code to friends via email, text, or social media</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>They Save ${data.referredDiscount}%</h3>
            <p>Your friend gets ${data.referredDiscount}% off their first order of $50 or more</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>You Earn $${data.referrerReward}</h3>
            <p>Get $${data.referrerReward} in store credit after their purchase (available in 14 days)</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.filtersfast.com/account/referrals" class="button">View Referral Dashboard</a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center; background-color: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 30px;">
        <strong>Pro Tip:</strong> Share your code on social media to reach more friends and earn even more rewards!
      </p>
    </div>
    
    <div class="footer">
      <p>FiltersFast - America's Top Online Filtration Retailer</p>
      <p><a href="https://www.filtersfast.com">www.filtersfast.com</a> | <a href="https://www.filtersfast.com/support">Support</a></p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        Questions? Check out our <a href="https://www.filtersfast.com/account/referrals">Referral Program FAQ</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
🎁 Welcome to Our Referral Program!

Hi ${data.customerName},

Thanks for being a valued FiltersFast customer! We've set up your personal referral code so you can start earning rewards.

Your Referral Code: ${data.referralCode}

How It Works:

1. Share Your Code
   Send your referral code to friends via email, text, or social media

2. They Save ${data.referredDiscount}%
   Your friend gets ${data.referredDiscount}% off their first order of $50 or more

3. You Earn $${data.referrerReward}
   Get $${data.referrerReward} in store credit after their purchase (available in 14 days)

View your referral dashboard: https://www.filtersfast.com/account/referrals

Pro Tip: Share your code on social media to reach more friends and earn even more rewards!

---
FiltersFast - America's Top Online Filtration Retailer
www.filtersfast.com | Support: https://www.filtersfast.com/support
    `
  };
}

