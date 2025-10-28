/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API protection
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique IPs to track
  maxRequests: number; // Max requests per interval
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 */
function cleanup() {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Run cleanup every minute
if (typeof window === 'undefined') {
  setInterval(cleanup, 60000);
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  
  // Get or create entry
  if (!store[identifier] || store[identifier].resetTime < now) {
    store[identifier] = {
      count: 0,
      resetTime: now + config.interval,
    };
  }
  
  const entry = store[identifier];
  
  // Check if over limit
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime,
    };
  }
  
  // Increment counter
  entry.count++;
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get IP address from request headers
 */
export function getClientIdentifier(request: Request): string {
  // Check common headers for IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a constant (for development)
  return 'unknown';
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // Standard API endpoints (10 req/min)
  standard: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    maxRequests: 10,
  },
  
  // Strict limits for sensitive operations (5 req/min)
  strict: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    maxRequests: 5,
  },
  
  // Generous limits for read-only operations (30 req/min)
  generous: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    maxRequests: 30,
  },
};

