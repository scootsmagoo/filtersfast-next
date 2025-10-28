# 🛡️ reCAPTCHA v3 Implementation Guide

## Overview

FiltersFast-Next now includes **Google reCAPTCHA v3** protection across all critical user-facing forms. This provides invisible bot protection without requiring users to solve annoying challenges.

---

## ✅ Protected Forms

The following forms are automatically protected with reCAPTCHA v3:

1. **Sign Up** (`/sign-up`) - Prevents fake account creation
2. **Sign In** (`/sign-in`) - Protects against credential stuffing attacks
3. **Checkout** (`/checkout`) - Prevents fraudulent orders
4. **Returns Request** (`/returns`) - Stops abusive return requests
5. **Forgot Password** (`/forgot-password`) - Blocks automated password reset attacks
6. **Reset Password** (`/reset-password/[token]`) - Prevents password reset abuse

---

## 🏗️ Architecture

### Client-Side Components

**1. reCAPTCHA Utility Library** (`lib/recaptcha.ts`)
- Core functions for loading and executing reCAPTCHA
- TypeScript types and interfaces
- Score thresholds for different actions
- Server-side verification logic

**2. React Hook** (`lib/hooks/useRecaptcha.ts`)
- Reusable hook for React components
- Automatic script loading
- Error handling
- Ready state management

**3. API Verification Route** (`app/api/recaptcha/verify/route.ts`)
- Server-side token verification
- Score validation
- Action verification
- Rate limiting

### Action Types

Each form has a specific action type to help Google's ML model understand context:

```typescript
export enum RecaptchaAction {
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',
  CHECKOUT = 'checkout',
  FORGOT_PASSWORD = 'forgot_password',
  RESET_PASSWORD = 'reset_password',
  RETURN_REQUEST = 'return_request',
  CONTACT_FORM = 'contact_form',
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  ADD_TO_CART = 'add_to_cart',
}
```

---

## 🔧 Setup Instructions

### 1. Get Your reCAPTCHA Keys

1. Visit: https://www.google.com/recaptcha/admin/create
2. Register a new site:
   - **Label:** FiltersFast (Development or Production)
   - **reCAPTCHA Type:** Choose **reCAPTCHA v3**
   - **Domains:**
     - Development: `localhost`
     - Production: `filtersfast.com` (or your domain)
3. Copy both keys (Site Key and Secret Key)

### 2. Configure Environment Variables

Add to your `.env.local` (development) or production environment:

```env
# Public key - exposed to the client
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX

# Secret key - server-side only
RECAPTCHA_SECRET_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX
```

**Important:**
- Use **different keys** for development and production
- Never commit keys to version control
- The Site Key (starting with `NEXT_PUBLIC_`) is visible in the browser - that's OK!

### 3. Restart Your Server

```bash
npm run dev
```

---

## 💻 Usage in Components

### Basic Usage

```tsx
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import { RecaptchaAction } from '@/lib/recaptcha';

export default function MyForm() {
  const { executeRecaptcha, isReady } = useRecaptcha();
  
  const handleSubmit = async () => {
    // Execute reCAPTCHA
    const token = await executeRecaptcha(RecaptchaAction.SIGN_UP);
    
    // Verify on server
    const response = await fetch('/api/recaptcha/verify', {
      method: 'POST',
      body: JSON.stringify({
        token,
        action: RecaptchaAction.SIGN_UP,
      }),
    });
    
    const result = await response.json();
    if (!result.success) {
      // Handle verification failure
      return;
    }
    
    // Continue with form submission
  };
  
  return (
    <button disabled={!isReady} onClick={handleSubmit}>
      {!isReady ? 'Loading security...' : 'Submit'}
    </button>
  );
}
```

### Example: Sign Up Form

See `app/sign-up/page.tsx` for a complete implementation example.

---

## 🎯 Score Thresholds

reCAPTCHA v3 returns a score from 0.0 (very likely a bot) to 1.0 (very likely a human).

**Default Thresholds:**
- Sign Up/Sign In: **0.5**
- Checkout: **0.5**
- Returns: **0.5**
- Password Reset: **0.5**
- Add to Cart: **0.3** (lower threshold for less critical actions)

**Adjusting Thresholds:**

Edit `lib/recaptcha.ts`:

```typescript
export const RECAPTCHA_THRESHOLDS = {
  [RecaptchaAction.SIGN_UP]: 0.7, // More strict
  [RecaptchaAction.ADD_TO_CART]: 0.2, // More lenient
  // ...
};
```

**Guidelines:**
- Higher scores = fewer false positives but may block some legitimate users
- Lower scores = more lenient but may allow some bots
- Monitor your Google reCAPTCHA Analytics to find the right balance

---

## 📊 Monitoring & Analytics

### Google reCAPTCHA Console

1. Visit: https://www.google.com/recaptcha/admin
2. Select your site
3. View analytics:
   - Request volume
   - Score distribution
   - Action breakdown
   - Suspicious activity

### Recommended Monitoring

1. **Track verification failures** in your application logs
2. **Monitor score distributions** in Google Analytics
3. **Set up alerts** for unusual patterns
4. **Review blocked requests** to adjust thresholds if needed

---

## 🔒 Security Best Practices

### ✅ DO

- Use separate keys for development and production
- Verify tokens on the server-side (never trust client-only verification)
- Log verification failures for security monitoring
- Rotate keys if compromised
- Set appropriate score thresholds based on your needs
- Monitor reCAPTCHA analytics regularly

### ❌ DON'T

- Commit keys to version control
- Reuse development keys in production
- Skip server-side verification
- Set thresholds too high (may block legitimate users)
- Ignore suspicious activity patterns
- Share your Secret Key publicly

---

## 🐛 Troubleshooting

### Forms Show "Loading security..." Forever

**Cause:** reCAPTCHA script failed to load or keys are missing

**Solutions:**
1. Check that both environment variables are set in `.env.local`
2. Restart your development server
3. Check browser console for errors
4. Verify your Site Key is correct

### "reCAPTCHA verification failed" Error

**Cause:** Server-side verification failed

**Solutions:**
1. Verify your Secret Key is correct
2. Check that `localhost` (or your domain) is added to your reCAPTCHA site
3. Ensure the action matches on client and server
4. Check server logs for detailed error messages

### Scores Are Too Low (Blocking Real Users)

**Cause:** Threshold is set too high

**Solutions:**
1. Review Google Analytics to see score distribution
2. Lower the threshold in `lib/recaptcha.ts`
3. Consider using different thresholds for different actions
4. Test with real users to find the sweet spot

### Want to Disable reCAPTCHA Temporarily?

**For Development:**
- Simply don't set the environment variables
- Forms will still work, but without bot protection
- You'll see a warning in the console

**For Testing:**
- Use reCAPTCHA's test keys (returns predictable scores)
- Site key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- Secret key: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Register production site in Google reCAPTCHA Console
- [ ] Add production domain to reCAPTCHA site settings
- [ ] Set production environment variables
- [ ] Test all forms in production environment
- [ ] Set up monitoring and alerts
- [ ] Document threshold values in runbook

### Environment Variables in Production

```env
# Production (Vercel, AWS, etc.)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_production_site_key
RECAPTCHA_SECRET_KEY=your_production_secret_key
```

**Vercel:**
```bash
vercel env add NEXT_PUBLIC_RECAPTCHA_SITE_KEY
vercel env add RECAPTCHA_SECRET_KEY
```

**AWS/Other:**
Follow your platform's environment variable configuration guide.

---

## 📈 Performance Impact

### Script Loading

- **Size:** ~45KB (minified, gzipped)
- **Loading:** Asynchronous, non-blocking
- **Caching:** Cached by Google's CDN
- **Impact:** Minimal - loads after page interactive

### Verification Latency

- **Client Execution:** ~100-300ms
- **Server Verification:** ~200-500ms
- **Total Impact:** ~300-800ms per form submission

### Optimization Tips

1. **Script is loaded once** and reused across all forms
2. **Verification happens only on submit**, not on page load
3. **Use loading states** to provide user feedback
4. **Rate limiting** is applied to verification API

---

## 🆘 Support & Resources

### Official Documentation

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Best Practices Guide](https://developers.google.com/recaptcha/docs/v3#best_practices)

### FiltersFast-Next Resources

- Implementation: `lib/recaptcha.ts`
- React Hook: `lib/hooks/useRecaptcha.ts`
- API Route: `app/api/recaptcha/verify/route.ts`
- Setup Guide: `ENV_SETUP_INSTRUCTIONS.md`

### Common Issues

Search for existing issues or create a new one if you encounter problems:
- Check browser console for client-side errors
- Check server logs for verification errors
- Review Google reCAPTCHA Analytics for patterns

---

## 📝 Changelog

### v1.0.0 (2025-01-XX)

- ✅ Initial reCAPTCHA v3 implementation
- ✅ Protected all critical forms
- ✅ Created reusable React hook
- ✅ Server-side verification with rate limiting
- ✅ Configurable score thresholds
- ✅ Comprehensive documentation

---

**Questions?** Check the troubleshooting section or review the code examples in the integrated forms.

**Need Help?** Review the official Google reCAPTCHA documentation or check our implementation files.


