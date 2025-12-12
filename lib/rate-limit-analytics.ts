/**
 * Rate limiting for analytics API endpoints
 * OWASP: Prevents brute force and denial of service attacks
 */

const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 10 * 60 * 1000; // 10 minutes in ms
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkAnalyticsRateLimit(identifier: string, scope: string = 'global'): boolean {
  const now = Date.now();
  const key = `${scope}:${identifier || 'anonymous'}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
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

