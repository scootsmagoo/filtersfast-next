# 🔧 Environment Setup Instructions

## ⚠️ Required for Authentication to Work

You need to create a `.env.local` file with Better Auth configuration.

---

## 🚀 Quick Setup

### Step 1: Create `.env.local` File

In the root of `FiltersFast-Next`, create a file named `.env.local` with this content:

```env
# Better Auth Configuration (Required)
BETTER_AUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars-long
BETTER_AUTH_URL=http://localhost:3001

# Database
DATABASE_URL=./auth.db

# Google reCAPTCHA v3 (Recommended for Security)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

**Note:** I noticed your dev server is running on port **3001** (not 3000), so make sure the URL matches!

### Step 2: Restart the Dev Server

After creating `.env.local`:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it:
npm run dev
```

### Step 3: Try Signing In Again

Go to `http://localhost:3001/sign-in` (note the port 3001!) and use:
- **Email:** `falonya@gmail.com`
- **Password:** `Admin123!`

---

## 🔍 What I Found

Good news! I verified that:
- ✅ Your account exists in the database
- ✅ Email: `falonya@gmail.com`
- ✅ Password hash is correct and matches `Admin123!`
- ✅ Email is verified
- ✅ You're in the admin list

The only issue is the missing environment variables for Better Auth to work properly.

---

## 🎯 After Sign-In Works

Once you can sign in:
1. Navigate to `/admin`
2. You'll see the admin dashboard
3. Click "Promo Codes" to manage codes
4. Test creating new codes!

---

## 📝 Copy This Exactly

Create file: `.env.local` in the root folder

```env
BETTER_AUTH_SECRET=FiltersFast-Secret-Key-For-Development-Testing-2025
BETTER_AUTH_URL=http://localhost:3001
DATABASE_URL=./auth.db

# Google reCAPTCHA v3 (Recommended for Security)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

Then restart the server and try signing in!

---

**Let me know once you've created the `.env.local` file and I'll help you test!** 🚀

---

## 🛡️ Optional: Google reCAPTCHA v3 Setup

### What is reCAPTCHA v3?

reCAPTCHA v3 protects your forms from spam and bot attacks. It works **invisibly** in the background - no annoying checkboxes!

### Protected Forms

Once configured, these forms are automatically protected:
- ✅ Sign Up
- ✅ Sign In
- ✅ Checkout
- ✅ Returns Requests
- ✅ Password Reset (Forgot & Reset)

### How to Get Your Keys

1. **Go to Google reCAPTCHA Admin Console:**
   - Visit: https://www.google.com/recaptcha/admin/create

2. **Register a New Site:**
   - **Label:** FiltersFast Development
   - **reCAPTCHA Type:** Choose **reCAPTCHA v3**
   - **Domains:** Add `localhost` (for development)
   - Accept the terms and click **Submit**

3. **Copy Your Keys:**
   - You'll get two keys:
     - **Site Key** (starts with `6L...`) - This is public and goes in `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
     - **Secret Key** - This is private and goes in `RECAPTCHA_SECRET_KEY`

4. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX
   RECAPTCHA_SECRET_KEY=6LxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX
   ```

5. **Restart Your Dev Server:**
   ```bash
   npm run dev
   ```

### Testing reCAPTCHA

1. Try signing up or signing in
2. Open browser DevTools Console (F12)
3. You should see reCAPTCHA loading successfully
4. The forms will still work - reCAPTCHA v3 is invisible!

### For Production

When deploying to production:
1. Register a **new site** in the reCAPTCHA console
2. Add your production domain (e.g., `filtersfast.com`)
3. Use the production keys in your production environment variables
4. **Never** reuse development keys in production!

### Security Score Thresholds

The system uses these default scores (0.0 = bot, 1.0 = human):
- Sign Up/Sign In: 0.5
- Checkout: 0.5
- Returns: 0.5
- Password Reset: 0.5

You can adjust these in `lib/recaptcha.ts` if needed.

---

## 📧 Troubleshooting reCAPTCHA

**Issue:** Forms are disabled with "Loading security..." button
- ✅ **Solution:** Make sure you added both keys to `.env.local` and restarted the server

**Issue:** "reCAPTCHA verification failed"
- ✅ **Solution:** Check that your Secret Key is correct
- ✅ **Solution:** Make sure `localhost` is added to your reCAPTCHA domain list

**Issue:** Want to skip reCAPTCHA for now?
- ✅ **Solution:** Simply don't add the keys - forms will still work, but without bot protection

