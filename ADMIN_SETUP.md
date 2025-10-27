# 🔧 Admin Account Setup Guide

Quick guide to create and manage admin accounts for testing.

---

## 🚀 Option 1: Use the Admin Creator Script (Recommended)

The easiest way to create an admin account:

### Step 1: Run the Script

```bash
npx tsx scripts/create-admin.ts
```

### Step 2: Follow the Prompts

```
🔧 FiltersFast Admin Account Creator

This will create an admin account and add it to the admin list.

First Name: Adam
Last Name: Smith  
Email: adam@example.com
Password (min 8 chars, 1 uppercase, 1 number): MyPassword123
```

### Step 3: Add Email to Admin List

The script will tell you to open `lib/auth-admin.ts` and add your email:

```typescript
const ADMIN_EMAILS = [
  'admin@filtersfast.com',
  'adam@filtersfast.com',
  'adam@example.com', // <-- Add your email here
]
```

### Step 4: Sign In!

1. Go to `http://localhost:3000/sign-in`
2. Sign in with your new account
3. Navigate to `/admin` - you're in! 🎉

---

## 🔧 Option 2: Manual Database Entry

If you want to manually add a user:

### 1. Create Account via Sign-Up

Go to `/sign-up` and create an account normally (if sign-up is working)

### 2. Add Email to Admin List

Open `lib/auth-admin.ts` and add the email you used:

```typescript
const ADMIN_EMAILS = [
  'admin@filtersfast.com',
  'adam@filtersfast.com',
  'your-email@example.com', // <-- Your email
]
```

### 3. Sign In

You now have admin access!

---

## 🎯 Option 3: Quick Test (No Database Needed)

If you just want to test the UI without a real account:

### Temporarily Disable Auth (Already Done)

The admin pages currently have auth commented out for testing. Just navigate to:

- `/admin` - Dashboard
- `/admin/promo-codes` - Promo codes list
- `/admin/promo-codes/new` - Create form

**Note:** This is temporary and should be re-enabled before production!

---

## 🔍 Troubleshooting

### "Failed to create account" Error

If sign-up isn't working, use **Option 1** (the script) to bypass sign-up and create the account directly in the database.

### "Access Denied" at /admin

Make sure your email is added to the `ADMIN_EMAILS` array in `lib/auth-admin.ts`

### Can't Find auth.db

The database is created automatically when you first run the app. Make sure you've run `npm run dev` at least once.

---

## 📝 Admin Email Management

### Current Admin Emails

Located in: `lib/auth-admin.ts`

```typescript
const ADMIN_EMAILS = [
  'admin@filtersfast.com',
  'adam@filtersfast.com',
  // Add more here
]
```

### Adding More Admins

Just add their email to the array above. They must:
1. Have an account (via sign-up or script)
2. Be listed in ADMIN_EMAILS

### Removing Admins

Simply remove their email from the ADMIN_EMAILS array.

---

## 🔮 Future Improvements

For production, you'll want to:

1. **Move to Environment Variable**
   ```env
   ADMIN_EMAILS=admin@filtersfast.com,adam@filtersfast.com
   ```

2. **Add Admin Role to Database**
   Add `isAdmin` boolean to user table

3. **Create Admin Management UI**
   Allow admins to promote other users

4. **Add Audit Logging**
   Track admin actions for security

---

## ✅ Quick Commands Reference

```bash
# Create new admin account
npx tsx scripts/create-admin.ts

# Check if account exists
sqlite3 auth.db "SELECT email, name, emailVerified FROM user;"

# Delete user (if needed)
sqlite3 auth.db "DELETE FROM user WHERE email='test@example.com';"

# View all admins (from code)
# Open lib/auth-admin.ts
```

---

## 🎉 Success!

Once set up, you can:
- ✅ Sign in at `/sign-in`
- ✅ Access `/admin` dashboard
- ✅ Manage promo codes at `/admin/promo-codes`
- ✅ Create new codes at `/admin/promo-codes/new`

**Happy testing!** 🚀

