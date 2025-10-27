# 🧪 Testing Guide - FiltersFast Next.js

Comprehensive testing instructions for all features.

---

## 🔐 Authentication Testing

### Sign Up Flow

1. Navigate to http://localhost:3000/sign-up
2. Fill in the form:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** TestPassword123
3. Click "Create Account"
4. Should redirect to `/account` with verification prompt
5. Check terminal for verification email link

**Expected Results:**
- ✅ Account created in database
- ✅ Verification email logged to console
- ✅ Redirected to account dashboard
- ✅ Yellow banner: "Please verify your email"

### Sign In Flow

1. Navigate to http://localhost:3000/sign-in
2. Enter credentials
3. Click "Sign In"
4. Should redirect to `/account`

**Expected Results:**
- ✅ Session created
- ✅ Header shows user name/avatar
- ✅ Dashboard displays user info

### Password Reset Flow

1. Navigate to http://localhost:3000/forgot-password
2. Enter email address
3. Click "Send Reset Link"
4. Check terminal for reset link
5. Click the reset link
6. Enter new password (must meet requirements)
7. Confirm password
8. Click "Reset Password"

**Expected Results:**
- ✅ Generic success message (anti-enumeration)
- ✅ Reset link in terminal (development)
- ✅ Token validates successfully
- ✅ Password updated in database
- ✅ All sessions invalidated
- ✅ Redirect to sign-in with success message

**Security Tests:**
- ❌ Try using old reset link (should fail - one-time use)
- ❌ Try using expired token (should fail - 30min expiry)
- ❌ Request 4 resets quickly (should rate limit - 3/hour max)

### Email Verification Flow

1. Sign up for new account
2. Check terminal for verification link
3. Click verification link
4. Should see success page
5. Auto-redirect to account

**Expected Results:**
- ✅ Email marked as verified in database
- ✅ Green success banner on account
- ✅ Token consumed (one-time use)

**Resend Test:**
1. Before verifying, click "Resend Verification Email"
2. Check terminal for new link
3. Old link should now be invalid

---

## 🛒 Shopping Cart Testing

### Add to Cart

1. Navigate to any product listing page
2. Click "Add to Cart" on any product
3. Button shows "Adding..." then "Added!"
4. Cart badge in header increments
5. Screen reader announces: "[Product] added to cart"

**Expected Results:**
- ✅ Item appears in cart
- ✅ Badge updates immediately
- ✅ Visual feedback (green button)
- ✅ Screen reader announcement
- ✅ Cart persists on page refresh (localStorage)

### Cart Management

1. Click cart icon in header
2. Should see `/cart` page with items
3. Test quantity controls:
   - Click + to increase
   - Click - to decrease
   - Type number directly
4. Click Remove button
5. Item disappears with smooth animation

**Expected Results:**
- ✅ Quantities update immediately
- ✅ Totals recalculate
- ✅ Items can be removed
- ✅ Empty cart shows empty state

---

## 💳 Checkout Testing

### Guest Checkout

1. Add items to cart
2. Click "Proceed to Checkout"
3. Select "Continue as Guest"
4. Fill shipping form:
   - First/Last Name
   - Email
   - Phone
   - Address, City, State, ZIP
5. Click "Continue to Payment"
6. Click "Review Order"
7. Verify all details
8. Click "Place Order"

**Expected Results:**
- ✅ Multi-step progress indicator
- ✅ Form validation works
- ✅ Can go back to previous steps
- ✅ Order summary sidebar updates
- ✅ Free shipping at $50+
- ✅ Redirect to success page
- ✅ Cart cleared after order

### Logged-In Checkout

1. Sign in first
2. Add items to cart
3. Click checkout
4. Should skip account step
5. Email pre-filled and disabled

**Expected Results:**
- ✅ Auto-skip to shipping step
- ✅ Email pre-populated
- ✅ Faster checkout flow

---

## 📦 Order Management Testing

### View Orders

1. Sign in
2. Navigate to account dashboard
3. Click "Orders" in sidebar (or "View All")
4. Should see `/account/orders`

**Expected Results:**
- ✅ Order history displayed
- ✅ Filter by status works
- ✅ Status badges color-coded
- ✅ Tracking info shown (if available)

### Order Details

1. Click "View Details" on any order
2. Should see `/account/orders/[id]`

**Expected Results:**
- ✅ Order timeline displayed
- ✅ Completed steps shown with checkmarks
- ✅ Tracking link opens carrier site
- ✅ Full item list with images
- ✅ Shipping address shown
- ✅ Payment method shown (last 4 digits)

### Reorder

1. Click "Reorder" on delivered order
2. Should add items back to cart

**Expected Results:**
- ✅ Items added to cart
- ✅ Redirected to cart page

---

## ♿ Accessibility Testing

### Keyboard Navigation

1. Tab through the entire site
2. All interactive elements should be reachable
3. Focus should be visible (orange outline)
4. Enter/Space should activate buttons
5. Escape should close modals/dropdowns

**Checklist:**
- [ ] Can tab to all links
- [ ] Can tab to all buttons
- [ ] Can tab through forms
- [ ] Focus visible on all elements
- [ ] No keyboard traps
- [ ] Logical tab order

### Screen Reader Testing

**Tools:** NVDA (Windows), JAWS (Windows), VoiceOver (Mac)

1. Enable screen reader
2. Navigate homepage
3. Add item to cart
4. Listen for "Added to cart" announcement
5. Navigate through checkout
6. Verify all form labels read correctly

**Checklist:**
- [ ] All images have alt text
- [ ] Form labels read correctly
- [ ] Buttons describe action
- [ ] Cart updates announced
- [ ] Error messages read aloud
- [ ] Success messages announced

### Skip Links

1. Load any page
2. Press Tab once
3. Should see "Skip to main content"
4. Press Enter
5. Focus should jump to main content

---

## 🔒 Security Testing

### Rate Limiting

**Test Login Rate Limit:**
1. Try to login with wrong password 6 times
2. Should get rate limited after 5 attempts
3. Wait 1 minute
4. Should be able to try again

**Test Password Reset Rate Limit:**
1. Request password reset 4 times in a row
2. Should be rate limited after 3 attempts
3. Should see "Try again in X minutes" message

### CSRF Protection

All state-changing requests should verify origin.

**Test (manual):**
```javascript
// Try from different origin (should fail)
fetch('http://localhost:3000/api/auth/update-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Hacker' })
});
// Should return 403 Forbidden
```

### Input Validation

**Test XSS Prevention:**
1. Sign up with name: `<script>alert('xss')</script>`
2. Should be sanitized (tags removed)
3. Check profile - should show plain text

**Test SQL Injection:**
1. Try email: `admin' OR '1'='1`
2. Should not bypass authentication
3. Parameterized queries prevent injection

---

## 🧪 Automated Testing

### npm audit

```bash
npm audit
# Should show: found 0 vulnerabilities
```

### Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Desktop" or "Mobile"
4. Click "Generate report"

**Expected Scores:**
- Performance: 85-95
- Accessibility: 90-98
- Best Practices: 95-100
- SEO: 90-100

### axe DevTools

1. Install [axe DevTools extension](https://www.deque.com/axe/devtools/)
2. Open DevTools → axe tab
3. Click "Scan ALL of my page"
4. Review any issues

**Expected:** 0 critical, 0 serious issues

---

## 📊 Testing Checklist

### Authentication (11 tests)
- [ ] Sign up creates account
- [ ] Email verification sends link
- [ ] Email verification works
- [ ] Sign in creates session
- [ ] Sign out destroys session
- [ ] Forgot password sends link
- [ ] Password reset works
- [ ] Old reset links don't work
- [ ] Rate limiting works (login, reset)
- [ ] Profile update works
- [ ] Account deletion works

### E-commerce (8 tests)
- [ ] Add to cart works
- [ ] Cart persists on refresh
- [ ] Quantity controls work
- [ ] Remove from cart works
- [ ] Guest checkout works
- [ ] Logged-in checkout works
- [ ] Order confirmation displays
- [ ] Order history displays

### Accessibility (6 tests)
- [ ] Keyboard navigation complete
- [ ] Skip links work
- [ ] Focus indicators visible
- [ ] Screen reader announces changes
- [ ] All images have alt text
- [ ] Form labels present

### Security (5 tests)
- [ ] npm audit shows 0 vulnerabilities
- [ ] Rate limiting enforced
- [ ] CSRF protection active
- [ ] XSS prevented
- [ ] Sessions invalidate properly

---

## 🐛 Known Issues

### Development Mode
- Email links logged to console (not sent)
- Tokens stored in memory (lost on restart)
- Mock order data (not from database)

These are expected and will be resolved with production configuration.

---

## 📝 Test Coverage Goals

- **Authentication:** 95% ✅
- **E-commerce:** 90% ✅
- **Accessibility:** 93% ✅
- **Security:** 94% ✅

---

**Happy Testing!** 🎯

