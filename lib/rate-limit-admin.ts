/**
 * Rate Limiting for Admin Endpoints
 * Prevents brute force and abuse of admin functions
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const rateLimitStore: RateLimitStore = {}
const CLEANUP_INTERVAL = 60000 // Cleanup every minute

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key]
    }
  })
}, CLEANUP_INTERVAL)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

/**
 * Rate limit checker
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${config.keyPrefix || 'rl'}:${identifier}`
  const now = Date.now()
  
  // Get or create rate limit entry
  if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
    rateLimitStore[key] = {
      count: 0,
      resetAt: now + config.windowMs,
    }
  }
  
  const entry = rateLimitStore[key]
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }
  
  // Increment count
  entry.count++
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Rate limit middleware for admin endpoints
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get identifier (IP address or user ID)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    
    const result = checkRateLimit(ip, config)
    
    if (!result.allowed) {
      const resetInSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
          },
        }
      )
    }
    
    // Rate limit OK, add headers and continue
    return null // null means continue to handler
  }
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  // Strict limits for sensitive operations
  CREATE_ADMIN: { maxRequests: 5, windowMs: 60000, keyPrefix: 'create-admin' }, // 5 per minute
  DELETE_ADMIN: { maxRequests: 10, windowMs: 60000, keyPrefix: 'delete-admin' }, // 10 per minute
  UPDATE_ROLE: { maxRequests: 20, windowMs: 60000, keyPrefix: 'update-role' }, // 20 per minute
  
  // Moderate limits for general operations
  LIST_USERS: { maxRequests: 100, windowMs: 60000, keyPrefix: 'list-users' }, // 100 per minute
  VIEW_AUDIT: { maxRequests: 50, windowMs: 60000, keyPrefix: 'view-audit' }, // 50 per minute
} as const

