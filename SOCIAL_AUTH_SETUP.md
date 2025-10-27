# Social Authentication Setup Guide

This guide will walk you through setting up OAuth authentication with Google, Facebook, and Apple for FiltersFast.

## Overview

FiltersFast supports the following social authentication providers:
- ✅ **Google** - Most popular, recommended to enable first
- ✅ **Facebook** - High user adoption
- ✅ **Apple** - Required for iOS apps, great for privacy-conscious users

## Quick Start

### 1. Environment Variables

Add the following to your `.env.local` file (or production environment):

```bash
# Required for Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000  # Change to your production URL

# Google OAuth (Recommended - Start Here)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-service-id
APPLE_CLIENT_SECRET=your-apple-client-secret
```

**Note:** You only need to configure the providers you want to enable. If credentials are missing, that provider will be automatically disabled.

---

## Provider Setup Instructions

### 🔵 Google OAuth Setup

**Time Required:** ~5 minutes  
**Difficulty:** Easy

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "FiltersFast" (or your choice)

3. **Enable OAuth APIs**
   - Navigate to: APIs & Services → Library
   - Search for "Google+ API" and enable it

4. **Configure OAuth Consent Screen**
   - Go to: APIs & Services → OAuth consent screen
   - User Type: External (for public access) or Internal (for organization only)
   - Fill in required fields:
     - App name: FiltersFast
     - User support email: your-email@domain.com
     - Developer contact: your-email@domain.com
   - Scopes: Add `email` and `profile`
   - Test users: Add your email for testing

5. **Create OAuth Credentials**
   - Go to: APIs & Services → Credentials
   - Click: "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Name: "FiltersFast Web Client"
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://yourdomain.com/api/auth/callback/google
     ```

6. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Add to `.env.local`:
     ```bash
     GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
     ```

---

### 🔷 Facebook OAuth Setup

**Time Required:** ~10 minutes  
**Difficulty:** Medium

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/

2. **Create App**
   - Click "My Apps" → "Create App"
   - Use case: "Authenticate and request data from users with Facebook Login"
   - App type: Consumer
   - App name: FiltersFast
   - Contact email: your-email@domain.com

3. **Add Facebook Login Product**
   - Dashboard → Add Product
   - Select "Facebook Login" → Set Up

4. **Configure Facebook Login Settings**
   - Go to: Facebook Login → Settings
   - Valid OAuth Redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/facebook
     https://yourdomain.com/api/auth/callback/facebook
     ```
   - Save changes

5. **Get App Credentials**
   - Go to: Settings → Basic
   - Copy App ID and App Secret
   - Add to `.env.local`:
     ```bash
     FACEBOOK_CLIENT_ID=your-app-id
     FACEBOOK_CLIENT_SECRET=your-app-secret
     ```

6. **App Review** (For Production)
   - For testing: Add test users in Roles → Test Users
   - For production: Submit for App Review to make it public
   - Required permissions: `email`, `public_profile`

---

### 🍎 Apple Sign In Setup

**Time Required:** ~15 minutes  
**Difficulty:** Advanced

**Prerequisites:**
- Apple Developer Account ($99/year)
- Access to Apple Developer Console

1. **Create App ID**
   - Visit: https://developer.apple.com/account/resources/identifiers/list
   - Click "+" to register a new identifier
   - Select "App IDs" → Continue
   - Description: FiltersFast
   - Bundle ID: com.yourdomain.filtersfast (explicit)
   - Capabilities: Check "Sign in with Apple"
   - Save

2. **Create Services ID**
   - Go back to Identifiers
   - Click "+" → Select "Services IDs" → Continue
   - Description: FiltersFast Web
   - Identifier: com.yourdomain.filtersfast.web
   - Check "Sign in with Apple" → Configure
   - Primary App ID: Select your App ID from step 1
   - Domains and Subdomains:
     ```
     localhost (for development)
     yourdomain.com
     ```
   - Return URLs:
     ```
     http://localhost:3000/api/auth/callback/apple
     https://yourdomain.com/api/auth/callback/apple
     ```
   - Save and Continue

3. **Create Private Key**
   - Go to: Keys
   - Click "+" to create a new key
   - Key Name: FiltersFast Sign in with Apple Key
   - Check "Sign in with Apple" → Configure
   - Select your Primary App ID
   - Save → Download the .p8 key file (KEEP IT SAFE!)
   - Note the Key ID (you'll need this)

4. **Get Team ID**
   - Top right of Apple Developer page
   - Or go to: Membership → Team ID

5. **Generate Client Secret**
   - Apple uses JWT for client secret
   - You'll need to generate this programmatically
   - Use the .p8 key, Key ID, Team ID, and Services ID
   - See: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens

6. **Add to Environment**
   ```bash
   APPLE_CLIENT_ID=com.yourdomain.filtersfast.web
   APPLE_CLIENT_SECRET=your-generated-jwt-secret
   ```

**Note:** Apple Sign In is complex. Consider using it only if targeting iOS users or if required by Apple guidelines.

---

## Testing Social Authentication

### Local Development

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Sign In Flow**
   - Go to: http://localhost:3000/sign-in
   - Click on any social provider button
   - Complete OAuth flow
   - You should be redirected to /account

3. **Verify User Creation**
   - Check your database (`auth.db`)
   - User should have:
     - Email from social provider
     - Name from social provider
     - OAuth provider ID

### Common Issues

#### ❌ "Redirect URI mismatch"
- **Solution:** Ensure callback URLs match exactly in provider settings
- Format: `http://localhost:3000/api/auth/callback/{provider}`

#### ❌ "Invalid client secret"
- **Solution:** Double-check credentials in `.env.local`
- Regenerate secret if needed

#### ❌ Provider button doesn't appear
- **Solution:** Check that both CLIENT_ID and CLIENT_SECRET are set
- Provider is automatically disabled if credentials are missing

#### ❌ "App not verified" (Google)
- **Solution:** Add your email as test user in OAuth consent screen
- For production: Submit for verification

---

## Production Deployment

### Environment Variables

Set all environment variables in your production environment:

**Vercel:**
```bash
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
# ... repeat for other providers
```

**Other Platforms:**
- Add environment variables through your hosting dashboard
- Ensure `BETTER_AUTH_URL` is set to your production domain

### Security Checklist

- ✅ Use different OAuth apps for production (don't reuse dev credentials)
- ✅ Add production domain to authorized origins/redirects
- ✅ Enable HTTPS (required for production)
- ✅ Rotate secrets regularly
- ✅ Monitor OAuth usage and errors
- ✅ Set up proper error logging

### Callback URLs for Production

Update all provider settings with production URLs:
```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/auth/callback/facebook
https://yourdomain.com/api/auth/callback/apple
```

---

## User Experience

### What Users See

1. **Sign In/Sign Up Pages**
   - Traditional email/password form
   - Divider: "Or continue with"
   - Social provider buttons (Google, Facebook, Apple)

2. **OAuth Flow**
   - Click provider button
   - Redirect to provider's login page
   - User authenticates with provider
   - Consent screen (first time only)
   - Redirect back to FiltersFast (/account)

3. **Account Linking**
   - Users can link multiple OAuth providers to one account
   - Email address is used to match accounts

### Best Practices

- ✅ **Enable Google first** - Most users have Google accounts
- ✅ **Add Facebook second** - Wide adoption, especially mobile
- ✅ **Apple for iOS apps** - Required if you have iOS app, privacy-focused

---

## Monitoring and Analytics

### Track OAuth Usage

Consider adding analytics to track:
- Which providers are most popular
- Conversion rates for social login
- Failed authentication attempts

### Error Handling

The app includes comprehensive error handling:
- Invalid credentials
- Network errors
- Provider-specific errors
- User-friendly error messages

---

## Support and Resources

### Better Auth Documentation
- https://www.better-auth.com/docs/integrations/oauth

### Provider Documentation
- **Google:** https://developers.google.com/identity/protocols/oauth2
- **Facebook:** https://developers.facebook.com/docs/facebook-login
- **Apple:** https://developer.apple.com/sign-in-with-apple
- **GitHub:** https://docs.github.com/en/apps/oauth-apps

---

## Need Help?

If you encounter issues:
1. Check the console for error messages
2. Verify callback URLs match exactly
3. Ensure environment variables are set correctly
4. Test with a single provider first
5. Check provider's developer console for errors

---

## Migration Notes

### Existing Users
- Existing email/password users can link social accounts
- Email matching is used to connect accounts
- Users keep their existing data

### Database
- Better Auth automatically handles user and account tables
- OAuth accounts are stored separately
- Multiple OAuth providers can link to one user

---

**Last Updated:** October 2025  
**Better Auth Version:** 1.3.32+  
**Status:** Production Ready ✅

