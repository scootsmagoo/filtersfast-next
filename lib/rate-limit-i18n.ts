/**
 * Rate Limiting for i18n API endpoints
 * Prevents abuse of language switching and translation APIs
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

/**
 * Clean up expired entries every 10 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limit check for i18n endpoints
 * @param identifier - IP address or user ID
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 10 * 60 * 1000 // 10 minutes
): boolean {
  const now = Date.now();
  const key = `i18n:${identifier}`;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return false;
  }
  
  if (existing.count >= maxRequests) {
    return true; // Rate limit exceeded
  }
  
  existing.count++;
  return false;
}

/**
 * Get remaining requests for identifier
 */
export function getRemainingRequests(
  identifier: string,
  maxRequests: number = 30
): number {
  const key = `i18n:${identifier}`;
  const existing = rateLimitMap.get(key);
  
  if (!existing || Date.now() > existing.resetTime) {
    return maxRequests;
  }
  
  return Math.max(0, maxRequests - existing.count);
}

