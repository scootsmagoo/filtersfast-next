# Authentication Setup Guide

This guide will help you set up Better Auth for the FiltersFast-Next application.

## 🚀 Phase 1 - Complete!

We've successfully implemented:
- ✅ Email/Password authentication
- ✅ Sign-in page with form validation
- ✅ Sign-up page with password strength indicator
- ✅ Account dashboard with session management
- ✅ Protected routes
- ✅ Header integration showing auth state

## 📋 Environment Variables

⚠️ **CRITICAL:** Create a `.env.local` file in the root directory with the following variables. **The app will not start without these:**

```env
# Better Auth Configuration (REQUIRED)
# Generate a secure secret with: openssl rand -base64 32
# Or PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
BETTER_AUTH_SECRET=your-super-secret-256-bit-key-change-this

# App URLs (REQUIRED)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Optional - defaults to SQLite)
# For production, use PostgreSQL or MySQL:
# DATABASE_URL=postgresql://user:pass@localhost:5432/filtersfast
# DATABASE_URL=./auth.db  # SQLite (default for development)

# Node Environment
NODE_ENV=development
```

### Generating a Secure Secret

Run this command to generate a secure random secret:

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Bash/Git Bash:**
```bash
openssl rand -base64 32
```

## 🗄️ Database

Better Auth automatically creates the necessary database tables on first run. We're using SQLite for development, which creates an `auth.db` file in the project root.

### Database Schema

Better Auth creates these tables automatically:
- `user` - User accounts (id, email, name, password_hash, etc.)
- `session` - Active user sessions
- `verification` - Email verification tokens
- `password_reset` - Password reset tokens

## 🎯 Available Routes

### Public Routes
- `/sign-in` - Sign in page
- `/sign-up` - Create new account
- `/forgot-password` - Password reset (Phase 2)

### Protected Routes
- `/account` - User dashboard (requires authentication)
- `/account/orders` - Order history (coming soon)
- `/account/settings` - Account settings (coming soon)

## 🧪 Testing Authentication

### 1. Create a Test Account

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/sign-up`
3. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123!
4. Click "Create Account"
5. You'll be redirected to `/account`

### 2. Sign Out and Sign In

1. Click "Sign Out" in the account dashboard
2. Navigate to `/sign-in`
3. Use the credentials you just created
4. You should be logged in and redirected to `/account`

### 3. Check Session Persistence

1. While logged in, close and reopen your browser
2. Navigate to `http://localhost:3000`
3. Notice the header shows your account avatar
4. Sessions last 7 days by default

## 🔐 Security Features

### Implemented
- ✅ Secure password hashing (bcrypt)
- ✅ Session-based authentication with HTTP-only cookies
- ✅ CSRF protection
- ✅ Password strength validation
- ✅ Email format validation
- ✅ Automatic session expiration (7 days)
- ✅ Secure cookie settings

### Coming in Phase 2
- ⏳ Email verification
- ⏳ Password reset flow
- ⏳ Rate limiting for login attempts
- ⏳ Account lockout after failed attempts

### Coming in Phase 3
- ⏳ Two-factor authentication (2FA)
- ⏳ OAuth social sign-in (Google, Facebook)
- ⏳ Magic link authentication

## 🔧 Troubleshooting

### Issue: Can't sign in after creating account

**Solution:** Check the browser console for errors. Make sure:
- The dev server is running
- `.env.local` file exists with correct variables
- `auth.db` file was created in the project root

### Issue: Session not persisting

**Solution:** 
- Clear browser cookies
- Make sure `BETTER_AUTH_SECRET` is set in `.env.local`
- Restart the dev server

### Issue: "Invalid session" error

**Solution:**
- Sign out and sign in again
- Clear the `auth.db` file and restart (warning: deletes all users)

## 📝 Next Steps (Phase 2)

1. **Password Reset Flow**
   - Forgot password page
   - Email with reset link
   - Reset password page

2. **Email Verification**
   - Send verification email on signup
   - Verify email endpoint
   - Resend verification email

3. **Account Management**
   - Edit profile information
   - Change password
   - Delete account

4. **Order History Integration**
   - Link orders to user accounts
   - Display past orders in dashboard
   - Reorder functionality

## 🎨 Customization

### Branding

The auth pages use FiltersFast branding colors:
- Primary: `#f26722` (Orange)
- Secondary: `#0066b2` (Blue)

### Validation Rules

Current password requirements (in `app/sign-up/page.tsx`):
- Minimum 8 characters
- At least one uppercase letter (recommended)
- At least one number (recommended)
- At least one special character (recommended)

To modify, edit the `validateForm()` function in the sign-up page.

### Session Duration

To change session expiration (default: 7 days), edit `lib/auth.ts`:

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 30, // 30 days instead of 7
  updateAge: 60 * 60 * 24, // 1 day
}
```

## 🔗 Useful Links

- [Better Auth Documentation](https://better-auth.com/docs/introduction)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/authentication)

## 💡 Tips

1. **Development**: Use a simple password for testing (e.g., `test1234`)
2. **Production**: Always use HTTPS and strong secrets
3. **Database**: Consider PostgreSQL or MySQL for production
4. **Monitoring**: Add logging for failed login attempts

---

**Authentication Status:** ✅ Phase 1 Complete
**Next Phase:** Password Reset & Email Verification

