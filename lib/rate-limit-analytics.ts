/**
 * Rate limiting for analytics API endpoints
 * OWASP: Prevents brute force and denial of service attacks
 */

const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 10 * 60 * 1000; // 10 minutes in ms
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkAnalyticsRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

