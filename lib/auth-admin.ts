/**
 * Admin Authorization Utilities
 */

// List of admin emails (move to environment variable in production)
const ADMIN_EMAILS = [
  'falonya@gmail.com',
  'adam@filtersfast.com',
  // Add your test email here for testing
]

/**
 * Check if a user is an admin
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Check if a user has admin access
 * Returns true if user is logged in AND is an admin
 */
export function hasAdminAccess(user: { email?: string } | null | undefined): boolean {
  if (!user?.email) return false
  return isAdmin(user.email)
}

